package com.register.example.service;

import com.register.example.payload.EmployeeSummaryDTO;
import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeSummaryService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private com.register.example.repository.ProjectRepository projectRepository;

    // Fetch all employees as summary DTO
    public List<EmployeeSummaryDTO> getAllEmployeesSummary() {
        List<Employee> employees = getCurrentTenantEmployees();
        return employees.stream()
        	      .map(emp -> new EmployeeSummaryDTO(
                          emp.getEmployeeId(),   // ✅ employeeId
                          emp.getFirstName(),    // ✅ firstName
                          emp.getLastName(),     // ✅ lastName
                          emp.getEmail()         // ✅ email
                  ))

                .collect(Collectors.toList());
    }

    // Fetch employee suggestions based on search query
    public List<EmployeeSummaryDTO> getEmployeeSuggestions(String query) {
        return getFilteredEmployeeSuggestions(query, null);
    }

    // Fetch ONLY approver/admin suggestions (Manager, Reviewer, HR, Finance, Admin, Travel Admin)
    public List<EmployeeSummaryDTO> getApproverSuggestions(String query) {
        // 1. Get all unique approver IDs from the projects table
        java.util.Set<String> approverIds = new java.util.HashSet<>();
        List<com.register.example.entity.Project> projects = projectRepository.findAll();
        for (com.register.example.entity.Project p : projects) {
            if (p.getManager() != null) approverIds.add(p.getManager());
            if (p.getReviewer() != null) approverIds.add(p.getReviewer());
            if (p.getHr() != null) approverIds.add(p.getHr());
            if (p.getFinance() != null) approverIds.add(p.getFinance());
            if (p.getAdmin() != null) approverIds.add(p.getAdmin());
        }

        // 2. Get all unique Travel Admin IDs from the employee table
        List<Employee> employees = getCurrentTenantEmployees();
        for (Employee emp : employees) {
            if (emp.getTravelAdmin() != null && !emp.getTravelAdmin().isEmpty()) {
                approverIds.add(emp.getTravelAdmin());
            }
        }

        // 3. Filter employee suggestions by these IDs
        return getFilteredEmployeeSuggestions(query, approverIds);
    }

    private List<EmployeeSummaryDTO> getFilteredEmployeeSuggestions(String query, java.util.Set<String> allowedIds) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        
        String lowercaseQuery = query.toLowerCase().trim();
        List<Employee> employees = getCurrentTenantEmployees();
        
        return employees.stream()
                .filter(emp -> {
                    // Check if ID is in allowed list (if provided)
                    if (allowedIds != null && !allowedIds.contains(emp.getEmployeeId())) {
                        return false;
                    }

                    String employeeId = emp.getEmployeeId() != null ? emp.getEmployeeId().toLowerCase() : "";
                    String firstName = emp.getFirstName() != null ? emp.getFirstName().toLowerCase() : "";
                    String lastName = emp.getLastName() != null ? emp.getLastName().toLowerCase() : "";
                    String fullName = firstName + " " + lastName;
                    
                    return employeeId.contains(lowercaseQuery) || 
                           fullName.contains(lowercaseQuery);
                })
                .limit(10)
                .map(emp -> new EmployeeSummaryDTO(
                        emp.getEmployeeId(),
                        emp.getFirstName(),
                        emp.getLastName(),
                        emp.getEmail()
                ))
                .collect(Collectors.toList());
    }

    private List<Employee> getCurrentTenantEmployees() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String currentEmployeeId = auth.getName();
            if (currentEmployeeId != null) {
                if (currentEmployeeId.contains("_")) {
                    String tenantId = currentEmployeeId.split("_")[0];
                    return employeeRepository.findByTenantId(tenantId);
                }
                java.util.Optional<Employee> currentEmpOpt = employeeRepository.findByEmployeeId(currentEmployeeId);
                if (currentEmpOpt.isPresent()) {
                    String tenantId = currentEmpOpt.get().getTenantId();
                    if (tenantId != null && !tenantId.isEmpty()) {
                        return employeeRepository.findByTenantId(tenantId);
                    }
                }
            }
        }
        return List.of();
    }
}
