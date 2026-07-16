package com.register.example.controller;

import com.register.example.entity.PerformanceGoalTemplate;
import com.register.example.entity.PerformanceGoalTemplateGoal;
import com.register.example.entity.PerformanceGoalTemplateAttribute;
import com.register.example.repository.PerformanceGoalTemplateRepository;
import com.register.example.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/performance/templates")
@CrossOrigin(origins = "*")
public class PerformanceGoalTemplateController {

    @Autowired
    private PerformanceGoalTemplateRepository templateRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private HttpServletRequest servletRequest;

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = servletRequest.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                com.register.example.entity.Employee emp = employeeService.getEmployeeByEmployeeId(employeeId);
                if (emp != null) {
                    return emp.getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<PerformanceGoalTemplate> saveTemplate(@RequestBody PerformanceGoalTemplate template) {
        String tenantId = getCurrentUserTenantId();
        template.setTenantId(tenantId);
        
        // Associate template goals to template
        if (template.getGoals() != null) {
            for (PerformanceGoalTemplateGoal goal : template.getGoals()) {
                goal.setTemplate(template);
            }
        }

        // Associate template attributes to template
        if (template.getTemplateAttributes() != null) {
            for (PerformanceGoalTemplateAttribute attr : template.getTemplateAttributes()) {
                attr.setTemplate(template);
            }
        }
        
        PerformanceGoalTemplate saved = templateRepository.save(template);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<PerformanceGoalTemplate>> getAllTemplates() {
        String tenantId = getCurrentUserTenantId();
        List<PerformanceGoalTemplate> templates;
        if (tenantId != null && !tenantId.isEmpty()) {
            templates = templateRepository.findByTenantId(tenantId);
        } else {
            templates = templateRepository.findAll();
        }
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<PerformanceGoalTemplate>> getTemplatesByDepartment(@PathVariable String department) {
        String tenantId = getCurrentUserTenantId();
        List<PerformanceGoalTemplate> templates;
        if (tenantId != null && !tenantId.isEmpty()) {
            templates = templateRepository.findByDepartmentAndTenantId(department, tenantId);
        } else {
            templates = templateRepository.findByDepartment(department);
        }
        return ResponseEntity.ok(templates);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteTemplate(@PathVariable Long id) {
        if (!templateRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        templateRepository.deleteById(id);
        return ResponseEntity.ok().body("Template deleted successfully");
    }
}
