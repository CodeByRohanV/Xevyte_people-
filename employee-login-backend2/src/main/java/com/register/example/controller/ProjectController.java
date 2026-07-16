package com.register.example.controller;

import com.register.example.entity.Allocation;
import com.register.example.entity.Employee;
import com.register.example.entity.Project;
import com.register.example.entity.Sow;
import com.register.example.repository.AllocationRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ProjectRepository;
import com.register.example.repository.SowRepository;
import com.register.example.service.TravelRequestService;
import com.register.example.service.LeaveService;
import com.register.example.service.ClaimService;
import com.register.example.payload.ProjectCreateRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private jakarta.servlet.http.HttpServletRequest request;

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @Autowired
    private SowRepository sowRepository;

    @Autowired
    private TravelRequestService travelRequestService;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private ClaimService claimService;

    // Get all projects by SOW ID
    @GetMapping("/sow/{sowId}")
    public List<Project> getProjectsBySowId(@PathVariable Long sowId) {
        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return projectRepository.findBySowSowIdAndTenantId(sowId, tenantId);
        }
        return projectRepository.findBySowSowId(sowId);
    }

    private void validateProjectNameUnique(String projectName, Long sowId, String tenantId) {
        if (tenantId != null && !tenantId.isEmpty()) {
            if (projectRepository.existsByProjectNameAndSowSowIdAndTenantId(projectName, sowId, tenantId)) {
                throw new RuntimeException(
                        "Project with name '" + projectName + "' already exists for this SOW.");
            }
        } else {
            if (projectRepository.existsByProjectNameAndSowSowId(projectName, sowId)) {
                throw new RuntimeException(
                        "Project with name '" + projectName + "' already exists for this SOW.");
            }
        }
    }

    private Long getNextTenantProjectId(String tenantId) {
        Long nextSeq = 1L;
        if (tenantId != null && !tenantId.isEmpty()) {
            Long maxVal = projectRepository.findMaxTenantProjectIdByTenantId(tenantId);
            if (maxVal != null) {
                nextSeq = maxVal + 1;
            }
        } else {
            Long maxVal = projectRepository.findMaxTenantProjectIdWithoutTenant();
            if (maxVal != null) {
                nextSeq = maxVal + 1;
            }
        }
        return nextSeq;
    }

    // Create a new project
    @PostMapping
    public Project createProject(@RequestBody ProjectCreateRequest request) {
        Sow sow = sowRepository.findById(request.getSowId())
                .orElseThrow(() -> new ResourceNotFoundException("SOW not found with ID: " + request.getSowId()));

        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(sow.getTenantId())) {
            throw new RuntimeException("Access denied to this SOW");
        }

        validateProjectNameUnique(request.getProjectName(), request.getSowId(), tenantId);

        Project project = new Project();
        project.setSow(sow);
        project.setProjectName(request.getProjectName()); // NEW
        project.setProjectStartDate(request.getProjectStartDate());
        project.setProjectEndDate(request.getProjectEndDate());
        project.setTotalEffort(request.getTotalEffort());
        project.setTotalCost(request.getTotalCost());
        project.setManager(request.getManager());
        project.setReviewer(request.getReviewer());
        project.setHr(request.getHr());
        project.setFinance(request.getFinance());
        project.setAdmin(request.getAdmin());
        project.setTenantId(tenantId);

        project.setTenantProjectId(getNextTenantProjectId(tenantId));

        return projectRepository.save(project);
    }

    // Get all projects by Customer ID (optimized)
    @GetMapping("/customer/{customerId}/all-projects")
    public List<Project> getAllProjectsByCustomer(@PathVariable Long customerId) {
        String tenantId = getCurrentUserTenantId();
        List<Sow> sows;
        if (tenantId != null && !tenantId.isEmpty()) {
            sows = sowRepository.findByCustomerCustomerIdAndTenantId(customerId, tenantId);
        } else {
            sows = sowRepository.findByCustomerCustomerId(customerId);
        }

        if (sows == null || sows.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> sowIds = sows.stream().map(Sow::getSowId).collect(Collectors.toList());

        if (tenantId != null && !tenantId.isEmpty()) {
            return projectRepository.findBySowSowIdInAndTenantId(sowIds, tenantId);
        }
        return projectRepository.findBySowSowIdIn(sowIds);
    }

    // Exception class for resource not found
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    @GetMapping
    public List<Project> getAllProjects() {
        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return projectRepository.findByTenantId(tenantId);
        }
        return projectRepository.findAll();
    }

    @GetMapping("/employee/{employeeId}/customer/{customerId}")
    public List<Project> getProjectsForEmployeeByCustomer(
            @PathVariable String employeeId,
            @PathVariable Long customerId) {

        String tenantId = getCurrentUserTenantId();
        List<Project> list = projectRepository.findProjectsByCustomerAndEmployee(customerId, employeeId);
        if (tenantId != null && !tenantId.isEmpty()) {
            return list.stream().filter(p -> tenantId.equals(p.getTenantId())).toList();
        }
        return list;
    }

    @PutMapping("/{projectId}")
    public Project updateProject(
            @PathVariable Long projectId,
            @RequestBody ProjectCreateRequest request) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(project.getTenantId())) {
            throw new RuntimeException("Access denied to this project");
        }

        // ✅ Overwrite fields
        project.setProjectName(request.getProjectName());
        project.setProjectStartDate(request.getProjectStartDate());
        project.setProjectEndDate(request.getProjectEndDate());
        project.setTotalEffort(request.getTotalEffort());
        project.setTotalCost(request.getTotalCost());
        String oldManagerId = project.getManager();
        project.setManager(request.getManager());
        project.setReviewer(request.getReviewer());
        project.setHr(request.getHr());
        project.setFinance(request.getFinance());
        project.setAdmin(request.getAdmin());

        // ❌ DO NOT change sow here (project already belongs to SOW)

        Project savedProject = projectRepository.save(project);

        // ✅ Synchronize these changes to the employee_portal table for all allocated employees
        try {
            List<Allocation> allocations = allocationRepository.findByProjectProjectId(projectId);
            if (allocations != null && !allocations.isEmpty()) {
                for (Allocation alloc : allocations) {
                    employeeRepository.findByEmployeeId(alloc.getEmployeeId()).ifPresent(emp -> {
                        String currentEmpManager = emp.getAssignedManagerId();
                        emp.setAssignedManagerId(savedProject.getManager());
                        emp.setReviewerId(savedProject.getReviewer());
                        emp.setAssignedHrId(savedProject.getHr());
                        emp.setAssignedFinanceId(savedProject.getFinance());
                        emp.setAssignedAdminId(savedProject.getAdmin());
                        employeeRepository.save(emp);

                        // Synchronize pending requests to new manager
                        if (savedProject.getManager() != null && !savedProject.getManager().equals(oldManagerId)) {
                            travelRequestService.updatePendingRequestsManager(emp.getEmployeeId(), currentEmpManager, savedProject.getManager());
                            leaveService.updatePendingLeavesManager(emp.getEmployeeId(), currentEmpManager, savedProject.getManager());
                            claimService.updatePendingClaimsManager(emp.getEmployeeId(), currentEmpManager, savedProject.getManager());
                        }
                    });
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the project update
            System.err.println("Failed to sync project roles and pending requests: " + e.getMessage());
        }

        return savedProject;
    }

}
