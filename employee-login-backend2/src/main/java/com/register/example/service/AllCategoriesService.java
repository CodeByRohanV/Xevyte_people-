package com.register.example.service;

import com.register.example.entity.AllCategories;
import com.register.example.repository.AllCategoriesRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.entity.Employee;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AllCategoriesService {

    private final AllCategoriesRepository repo;
    private final EmployeeRepository employeeRepository;

    public AllCategoriesService(AllCategoriesRepository repo, EmployeeRepository employeeRepository) {
        this.repo = repo;
        this.employeeRepository = employeeRepository;
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }

    // Save Category Only
    public AllCategories addCategory(String category) {
        String tenantId = getCurrentTenantId();
        AllCategories c = new AllCategories();
        c.setGrievanceCategory(category);
        c.setGrievanceType(null);
        c.setTenantId(tenantId);
        return repo.save(c);
    }

    // Save Type Only
    public AllCategories addType(String type) {
        String tenantId = getCurrentTenantId();
        AllCategories t = new AllCategories();
        t.setGrievanceType(type);
        t.setGrievanceCategory(null);
        t.setTenantId(tenantId);
        return repo.save(t);
    }

    // Load all — both categories & types
    public List<AllCategories> getAll() {
        String tenantId = getCurrentTenantId();
        return repo.findByTenantId(tenantId);
    }
}
