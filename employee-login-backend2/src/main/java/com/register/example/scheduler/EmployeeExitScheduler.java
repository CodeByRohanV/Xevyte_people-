package com.register.example.scheduler;

import com.register.example.entity.Employee;
import com.register.example.entity.Resignation;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ResignationRepository;
import com.register.example.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

/**
 * Scheduled job to check for employees whose exit date/last working day has arrived.
 * Runs daily at 11:59 PM to set the employee's status to Inactive in both HRMS and Scaloz Tenant Users.
 */
@Component
public class EmployeeExitScheduler {

    @Autowired
    private ResignationRepository resignationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Value("${scaloz.api.url:http://localhost:8085/api/tenant-users/sync-from-hrms}")
    private String scalozApiUrl;

    @Scheduled(cron = "0 59 23 * * ?", zone = "Asia/Kolkata") // Runs every day at 11:59 PM
    public void deactivateDepartedEmployees() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        System.out.println("⏰ [EmployeeExitScheduler] Running exit deactivation check on " + today);

        // Find all resignations in the system
        List<Resignation> approvedResignations = resignationRepository.findAll();
        for (Resignation resignation : approvedResignations) {
            String status = resignation.getStatus();
            if (status == null) continue;

            // Only act if the resignation exit is approved (HR Approved or Exit Complete)
            boolean isApproved = status.equalsIgnoreCase("HR Approved")
                    || status.equalsIgnoreCase("Final Approved - Exit Complete");

            if (isApproved && resignation.getLastWorkingDay() != null && !resignation.getLastWorkingDay().isAfter(today)) {
                String empId = resignation.getEmployeeId();
                System.out.println("👤 [EmployeeExitScheduler] Deactivating employee " + empId + " due to LWD: " + today);

                // 1. Update status to Inactive ("no") in the HRMS Employee Portal database
                Optional<Employee> empOpt = employeeRepository.findByEmployeeId(empId);
                if (empOpt.isPresent()) {
                    Employee employee = empOpt.get();
                    if (!"no".equals(employee.getActive())) {
                        employee.setActive("no");
                        employeeRepository.save(employee);
                        System.out.println("✅ [EmployeeExitScheduler] Employee " + empId + " set to active='no' in HRMS.");
                    }

                    // 2. Sync Inactive status to the Scaloz Tenant Users table
                    syncInactiveToScaloz(employee);
                }
            }
        }
    }

    private void syncInactiveToScaloz(Employee employee) {
        try {
            // Build status sync URL (replace sync-from-hrms with sync-status-from-hrms)
            String statusSyncUrl = scalozApiUrl;
            if (statusSyncUrl.endsWith("/sync-from-hrms")) {
                statusSyncUrl = statusSyncUrl.replace("/sync-from-hrms", "/sync-status-from-hrms");
            } else {
                statusSyncUrl = statusSyncUrl + "/sync-status-from-hrms";
            }

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Generate system Bearer token
            String jwtToken = jwtTokenProvider.generateToken("system_sync", Map.of("role", "SYSTEM"));
            headers.set("Authorization", "Bearer " + jwtToken);

            String shortEmpId = employee.getEmployeeId();
            if (shortEmpId != null && shortEmpId.contains("_")) {
                shortEmpId = shortEmpId.substring(shortEmpId.lastIndexOf('_') + 1);
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("employeeId", shortEmpId);
            payload.put("tenantCode", employee.getTenantId());
            payload.put("status", "Inactive");

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

            System.out.println("[HRMS→Scaloz] Syncing status Inactive for shortEmpId: " + shortEmpId + " to URL: " + statusSyncUrl);
            restTemplate.postForEntity(statusSyncUrl, requestEntity, String.class);
            System.out.println("[HRMS→Scaloz] Sync status Inactive completed successfully.");
        } catch (Exception e) {
            System.err.println("[HRMS→Scaloz] Failed to sync Inactive status to tenant portal: " + e.getMessage());
        }
    }
}
