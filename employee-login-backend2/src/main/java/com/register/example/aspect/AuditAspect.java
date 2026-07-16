package com.register.example.aspect;

import com.register.example.annotation.AuditLog;
import com.register.example.service.AuditService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.util.Map;
import java.util.LinkedHashMap;

@Aspect
@Component
public class AuditAspect {
 
    private static final String SYSTEM_CONSTANT = "SYSTEM";
    private static final String EMPLOYEE_CONSTANT = "EMPLOYEE";
    private static final String LEAVE_ATTENDANCE_CONSTANT = "LEAVE_ATTENDANCE";
    private static final String CLAIMS_TRAVEL_CONSTANT = "CLAIMS_TRAVEL";
    private static final String ADMIN_CONSTANT = "ADMIN";
    private static final String ONBOARDING_CONSTANT = "ONBOARDING";
    private static final String CONTRACT_CONSTANT = "CONTRACT";
    private static final String COMPENSATION_CONSTANT = "COMPENSATION";
    private static final String DOCUMENTS_CONSTANT = "DOCUMENTS";
    private static final String SUPPORT_CONSTANT = "SUPPORT";
    private static final String PERFORMANCE_CONSTANT = "PERFORMANCE";
    private static final String LMS_CONSTANT = "LMS";
    private static final String TASKS_CONSTANT = "TASKS";
    private static final String REPORTS_CONSTANT = "REPORTS";
 
    private static final Map<String, String> MODULE_KEYWORD_MAP = new LinkedHashMap<>();
    static {
        MODULE_KEYWORD_MAP.put("Employee", EMPLOYEE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Profile", EMPLOYEE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Leave", LEAVE_ATTENDANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Attendance", LEAVE_ATTENDANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Holiday", LEAVE_ATTENDANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Timesheet", "TIMESHEET");
        MODULE_KEYWORD_MAP.put("Asset", "ASSET");
        MODULE_KEYWORD_MAP.put("Claim", CLAIMS_TRAVEL_CONSTANT);
        MODULE_KEYWORD_MAP.put("Travel", CLAIMS_TRAVEL_CONSTANT);
        MODULE_KEYWORD_MAP.put("Reimbursement", CLAIMS_TRAVEL_CONSTANT);
        MODULE_KEYWORD_MAP.put("Auth", "AUTH");
        MODULE_KEYWORD_MAP.put("User", "AUTH");
        MODULE_KEYWORD_MAP.put("Security", "AUTH");
        MODULE_KEYWORD_MAP.put("Admin", ADMIN_CONSTANT);
        MODULE_KEYWORD_MAP.put("Configuration", ADMIN_CONSTANT);
        MODULE_KEYWORD_MAP.put("Setting", ADMIN_CONSTANT);
        MODULE_KEYWORD_MAP.put("Clearance", "CLEARANCE");
        MODULE_KEYWORD_MAP.put("Compensation", COMPENSATION_CONSTANT);
        MODULE_KEYWORD_MAP.put("Payroll", COMPENSATION_CONSTANT);
        MODULE_KEYWORD_MAP.put("Payslip", COMPENSATION_CONSTANT);
        MODULE_KEYWORD_MAP.put("Document", DOCUMENTS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Handbook", DOCUMENTS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Policy", DOCUMENTS_CONSTANT);
        MODULE_KEYWORD_MAP.put("KnowledgeHub", DOCUMENTS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Preonboarding", ONBOARDING_CONSTANT);
        MODULE_KEYWORD_MAP.put("Onboarding", ONBOARDING_CONSTANT);
        MODULE_KEYWORD_MAP.put("Applicant", ONBOARDING_CONSTANT);
        MODULE_KEYWORD_MAP.put("Customer", CONTRACT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Sow", CONTRACT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Project", CONTRACT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Allocation", CONTRACT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Resignation", "EXIT");
        MODULE_KEYWORD_MAP.put("Exit", "EXIT");
        MODULE_KEYWORD_MAP.put("Help", SUPPORT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Grievance", SUPPORT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Support", SUPPORT_CONSTANT);
        MODULE_KEYWORD_MAP.put("Performance", PERFORMANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Goal", PERFORMANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Rating", PERFORMANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Appraisal", PERFORMANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Review", PERFORMANCE_CONSTANT);
        MODULE_KEYWORD_MAP.put("Lms", LMS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Course", LMS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Training", LMS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Task", TASKS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Todo", TASKS_CONSTANT);
        MODULE_KEYWORD_MAP.put("Report", REPORTS_CONSTANT);
    }

    private final AuditService auditService;

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @Around("@annotation(auditLog) || (" +
            "within(@org.springframework.web.bind.annotation.RestController *) && " +
            "(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PatchMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping)))")
    public Object auditMethod(ProceedingJoinPoint joinPoint, AuditLog auditLog) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // Handle methods that don't have the annotation (automatic mode)
        String actionType = "";
        String module = "";
        String entityName = "";
        String description = "";
        boolean logParameters = true;
        boolean logResult = true;
        boolean logException = true;

        if (auditLog != null) {
            actionType = auditLog.action();
            module = auditLog.module();
            entityName = auditLog.entityName();
            description = auditLog.description();
            logParameters = auditLog.logParameters();
            logResult = auditLog.logResult();
            logException = auditLog.logException();
        } else {
            // Automatic deduction from method/class
            actionType = deduceActionType(method);
            module = extractModuleFromClassName(method.getDeclaringClass().getSimpleName());
            entityName = method.getDeclaringClass().getSimpleName().replace("Controller", "").replace("Service", "");
            description = String.format("Executed %s module action: %s", module, method.getName());
        }
        
        if (actionType.isEmpty()) actionType = method.getName().toUpperCase();
        if (module.isEmpty()) module = extractModuleFromClassName(method.getDeclaringClass().getSimpleName());
        if (entityName.isEmpty()) entityName = method.getDeclaringClass().getSimpleName().replace("Controller", "").replace("Service", "");
        
        HttpServletRequest request = getCurrentRequest();
        String userId = getCurrentUserId();
        String userType = getCurrentUserType();
        
        Object oldValue = null;
        Object newValue = null;
        Object result = null;
        
        try {
            if (logParameters) {
                oldValue = joinPoint.getArgs();
            }
            
            result = joinPoint.proceed();
            
            if (logResult) {
                newValue = result;
            }
            
            if (description.isEmpty()) {
                description = String.format("Executed %s.%s", method.getDeclaringClass().getSimpleName(), method.getName());
            }
            
            auditService.logCustomAction(actionType, module, entityName, null, userId, userType, description,
                                       oldValue, newValue, null, request);
            
            return result;
            
        } catch (Exception e) {
            if (logException) {
                String errorMessage = e.getMessage();
                if (description.isEmpty()) {
                    description = String.format("Failed to execute %s.%s", method.getDeclaringClass().getSimpleName(), method.getName());
                }
                
                auditService.logAction(actionType, module, entityName, null, userId, userType, description,
                                     oldValue, null, getClientIpAddress(request), getUserAgent(request),
                                     "FAILURE", errorMessage, null);
            }
            throw e;
        }
    }
    
    private String deduceActionType(Method method) {
        if (method.isAnnotationPresent(org.springframework.web.bind.annotation.PostMapping.class)) return "CREATE";
        if (method.isAnnotationPresent(org.springframework.web.bind.annotation.PutMapping.class)) return "UPDATE";
        if (method.isAnnotationPresent(org.springframework.web.bind.annotation.PatchMapping.class)) return "UPDATE";
        if (method.isAnnotationPresent(org.springframework.web.bind.annotation.DeleteMapping.class)) return "DELETE";
        return method.getName().toUpperCase();
    }
    
    private String extractModuleFromClassName(String className) {
        for (Map.Entry<String, String> entry : MODULE_KEYWORD_MAP.entrySet()) {
            if (className.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return className.toUpperCase().replace("CONTROLLER", "").replace("SERVICE", "");
    }
    
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getCurrentUserId() {
        try {
            HttpServletRequest request = getCurrentRequest();
            if (request != null && request.getHeader("employeeId") != null) {
                return request.getHeader("employeeId");
            }
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName();
            }
            return SYSTEM_CONSTANT;
        } catch (Exception e) {
            return SYSTEM_CONSTANT;
        }
    }
    
    private String getCurrentUserType() {
        try {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ADMIN_CONSTANT;
            } else if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"))) {
                return "MANAGER";
            }
            return EMPLOYEE_CONSTANT;
        } catch (Exception e) {
            return SYSTEM_CONSTANT;
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return null;
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    private String getUserAgent(HttpServletRequest request) {
        return request != null ? request.getHeader("User-Agent") : null;
    }
}
