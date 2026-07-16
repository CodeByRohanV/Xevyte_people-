package com.register.example.security;
 
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
 
import java.io.IOException;
import java.util.List;
 
import com.register.example.repository.TenantRepository;
import com.register.example.entity.Tenant;
import com.register.example.repository.EmployeeRepository;
import com.register.example.entity.Employee;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
 
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
 
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
 
    @Autowired
    private TenantRepository tenantRepository;
 
    @Autowired
    private EmployeeRepository employeeRepository;
 
    @Autowired
    private PasswordEncoder passwordEncoder;
 
    @Autowired
    private JwtTokenProvider tokenProvider;
 
    private static final String CONST_APPLICATION_JSON = "application/json";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
 
        // Bypass OPTIONS requests for CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
 
        String path = request.getRequestURI();
 
        // ✅ Skip public routes — no JWT needed
        boolean isPublicAuth = path.equals("/api/auth/login") ||
                               path.equals("/api/auth/forgot-password") ||
                               path.equals("/api/auth/reset-password") ||
                               path.equals("/api/auth/change-password") ||
                               path.startsWith("/api/auth/tenant-branding/") ||
                               path.startsWith("/api/auth/global-settings/") ||
                               path.equals("/api/daily-entry/trigger-reminders");
 
        boolean isPublicOnboarding = path.equals("/api/v1/auth/send-otp") ||
                                     path.equals("/api/v1/auth/verify-otp");
 
        boolean isPublicGet = path.startsWith("/api/v1/applicants/") ||
                              path.startsWith("/api/v1/preonboarding/") ||
                              path.startsWith("/api/v1/calculations/") ||
                              path.startsWith("/api/v1/analytics/deep-test");
 
        String authHeader = request.getHeader("Authorization");
        boolean hasToken = authHeader != null && authHeader.startsWith("Bearer ");
        boolean isPublicGetMethod = "GET".equalsIgnoreCase(request.getMethod()) && path.startsWith("/api/public/");
 
        if (isPublicAuth || isPublicOnboarding || (isPublicGet && !hasToken) || (isPublicGetMethod && !hasToken) || path.startsWith("/api/external/") || path.equals("/health") || path.equals("/api/v1/analytics/generate-team-data") || path.equals("/api/v1/analytics/cleanup-rohan-data") || path.equals("/api/v1/analytics/dump-rohan-data")) {
            filterChain.doFilter(request, response);
            return;
        }
 
        // ── Extract Bearer token ──────────────────────────────────────
        String header = request.getHeader("Authorization");
        String token = null;
 
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }
 
        if (token == null) {
            // No token — reject with 401
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(CONST_APPLICATION_JSON);
            response.getWriter().write("{\"error\": \"Authentication required. Please login via Scaloz IAM.\"}");
            return;
        }
 
        // ── Validate token ────────────────────────────────────────────
        if (!tokenProvider.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(CONST_APPLICATION_JSON);
            response.getWriter().write("{\"error\": \"Invalid or expired token. Please login again.\"}");
            return;
        }
 
        // ── Build auth from JWT claims (no DB lookup needed) ─────────
        try {
            String email = tokenProvider.getEmployeeIdFromJWT(token);
            String employeeId = tokenProvider.extractStringClaim(token, "employeeId");
            if (employeeId == null || employeeId.trim().isEmpty()) {
                employeeId = email; // Fallback to email subject
            }
            String name = tokenProvider.extractStringClaim(token, "name");
            String role = tokenProvider.extractStringClaim(token, "role");
            String tenant = tokenProvider.extractStringClaim(token, "tenant");
            String tenantId = tokenProvider.extractStringClaim(token, "tenantId");
            String tenantName = tokenProvider.extractStringClaim(token, "tenantName");
 
            // ── Auto-provision Tenant if missing from HRMS database ─────
            autoProvisionTenant(tenantId, tenantName, tenant, email);
 
            // ── Auto-provision Employee if missing from HRMS database ────
            autoProvisionEmployee(employeeId, email, name, role, tenantId, token);
 
            // Make tenant available to all downstream controllers
            if (tenant != null) {
                request.setAttribute("X-Tenant-ID", tenant);
            }
            if (tenantId != null) {
                request.setAttribute("X-Tenant-ID-Num", tenantId);
            }
            List<String> apps = tokenProvider.extractListClaim(token, "apps");
            if (apps != null) {
                request.setAttribute("X-Tenant-Apps", apps);
            }
 
            // Build Spring Security authority from role claim
            String springRole = (role != null && !role.startsWith("ROLE_")) ? "ROLE_" + role.toUpperCase() : (role != null ? role : "ROLE_USER");
            List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(springRole));
 
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(employeeId, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
 
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(CONST_APPLICATION_JSON);
            response.getWriter().write("{\"error\": \"Token processing failed: " + e.getMessage() + "\"}");
            return;
        }
 
        filterChain.doFilter(request, response);
    }

    private void autoProvisionTenant(String tenantId, String tenantName, String tenant, String email) {
        if (tenantId != null) {
            try {
                if (!tenantRepository.findByTenantId(tenantId).isPresent()) {
                    log.info("SSO: Tenant not found in HRMS database. Auto-creating tenant: id={}, name={}, subdomain={}", tenantId, tenantName, tenant);
                    Tenant newTenant = new Tenant();
                    newTenant.setTenantId(tenantId);
                    newTenant.setTenantName(tenantName != null ? tenantName : (tenant != null ? tenant : "SSO Tenant"));
                    newTenant.setAdminEmail(email != null ? email : "admin@scaloz.com");
                    tenantRepository.save(newTenant);
                }
            } catch (Exception e) {
                log.error("SSO: Failed to auto-provision tenant metadata in DB:", e);
            }
        }
    }

    private void autoProvisionEmployee(String employeeId, String email, String name, String role, String tenantId, String token) {
        if (employeeId != null) {
            try {
                if (!employeeRepository.findByEmployeeId(employeeId).isPresent()) {
                    String firstName = tokenProvider.extractStringClaim(token, "firstName");
                    String lastName = tokenProvider.extractStringClaim(token, "lastName");
                    String workLocation = tokenProvider.extractStringClaim(token, "workLocation");
                    String personalEmail = tokenProvider.extractStringClaim(token, "personalEmail");
                    String gender = tokenProvider.extractStringClaim(token, "gender");
                    String dateOfBirthStr = tokenProvider.extractStringClaim(token, "dateOfBirth");
                    String aadharNo = tokenProvider.extractStringClaim(token, "aadharNo");
                    String panNo = tokenProvider.extractStringClaim(token, "panNo");
                    String presentAddress = tokenProvider.extractStringClaim(token, "presentAddress");
                    String permanentAddress = tokenProvider.extractStringClaim(token, "permanentAddress");
                    String contactNo = tokenProvider.extractStringClaim(token, "contactNo");
                    String bloodGroup = tokenProvider.extractStringClaim(token, "bloodGroup");
                    String joiningDateStr = tokenProvider.extractStringClaim(token, "joiningDate");

                    log.info("SSO: Employee not found in HRMS database. Auto-creating employee: id={}, email={}, name={}", employeeId, email, name);
                    Employee newEmp = new Employee();
                    newEmp.setEmployeeId(employeeId);
                    newEmp.setEmail(email != null ? email : (employeeId + "@sso.com"));
                    
                    String fullName = name != null ? name : "SSO User";
                    String[] nameParts = fullName.trim().split("\\s+", 2);
                    newEmp.setFirstName(firstName != null && !firstName.trim().isEmpty() ? firstName : nameParts[0]);
                    newEmp.setLastName(lastName != null && !lastName.trim().isEmpty() ? lastName : (nameParts.length > 1 ? nameParts[1] : " "));
                    
                    newEmp.setRole(role != null ? role : "USER");
                    newEmp.setTenantId(tenantId);
                    newEmp.setActive("yes");
                    newEmp.setPassword(passwordEncoder.encode("SSO_BYPASS_DUMMY_PASSWORD_" + java.util.UUID.randomUUID().toString()));
                    
                    // Map expanded onboarding details
                    newEmp.setWorkLocation(workLocation);
                    newEmp.setPersonalMail(personalEmail);
                    newEmp.setGender(gender);
                    newEmp.setDateOfBirth(parseDateSafely(dateOfBirthStr));
                    newEmp.setAadharNo(aadharNo);
                    newEmp.setPanNo(panNo);
                    newEmp.setPresentAddress(presentAddress);
                    newEmp.setAddress(permanentAddress); // Maps permanentAddress to address
                    newEmp.setContactNo(contactNo);
                    newEmp.setBloodGroup(bloodGroup);
                    newEmp.setJoiningDate(parseDateSafely(joiningDateStr));
                    
                    employeeRepository.save(newEmp);
                }
            } catch (Exception e) {
                log.error("SSO: Failed to auto-provision employee record in DB:", e);
            }
        }
    }
 
    private java.time.LocalDate parseDateSafely(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            // Try standard ISO-8601 (YYYY-MM-DD)
            return java.time.LocalDate.parse(dateStr);
        } catch (Exception e) {
            // Try common formats like DD-MM-YYYY or DD/MM/YYYY
            try {
                String clean = dateStr.replace("/", "-");
                java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");
                return java.time.LocalDate.parse(clean, dtf);
            } catch (Exception ex) {
                log.warn("SSO: Failed to parse date string: {}", dateStr);
                return null;
            }
        }
    }
}