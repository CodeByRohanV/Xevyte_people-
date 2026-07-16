package com.register.example.service;

import com.register.example.entity.Category;
import com.register.example.entity.SubCategory;
import com.register.example.repository.CategoryRepository;
import com.register.example.repository.SubCategoryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.entity.Employee;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HelpDeskCategoryService {

    private final CategoryRepository categoryRepo;
    private final SubCategoryRepository subCategoryRepo;
    private final EmployeeRepository employeeRepository;

    public HelpDeskCategoryService(CategoryRepository categoryRepo, SubCategoryRepository subCategoryRepo, EmployeeRepository employeeRepository) {
        this.categoryRepo = categoryRepo;
        this.subCategoryRepo = subCategoryRepo;
        this.employeeRepository = employeeRepository;
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            if (employeeId != null) {
                if (employeeId.contains("_")) {
                    return employeeId.split("_")[0];
                }
                java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        }
        return null;
    }

    public Category createOrGetCategory(String teamName, String ticketType, String categoryName) {
        String tenantId = getCurrentTenantId();
        Optional<Category> existing = categoryRepo.findByTeamNameAndTicketTypeAndCategoryNameAndTenantId(teamName, ticketType, categoryName, tenantId);
        return existing.orElseGet(() ->
                categoryRepo.save(new Category(categoryName, ticketType, teamName, tenantId))
        );
    }

    public List<Category> getCategoriesByTeamAndType(String teamName, String ticketType) {
        String tenantId = getCurrentTenantId();
        return categoryRepo.findByTeamNameAndTicketTypeAndTenantId(teamName, ticketType, tenantId);
    }

    public SubCategory createSubCategory(Long categoryId, String subCategoryName) {
        String tenantId = getCurrentTenantId();
        Category cat = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category Not Found"));
        
        // Security check: ensure category belongs to the tenant
        if (tenantId != null && !tenantId.equals(cat.getTenantId())) {
            throw new RuntimeException("Unauthorized category access");
        }

        return subCategoryRepo.save(new SubCategory(subCategoryName, cat));
    }

    public List<SubCategory> getSubCategoriesByCategory(Long categoryId) {
        String tenantId = getCurrentTenantId();
        Category cat = categoryRepo.findById(categoryId).orElse(null);
        if (cat == null) return List.of();
        
        // Security check: ensure category belongs to the tenant
        if (tenantId != null && !tenantId.equals(cat.getTenantId())) {
            return List.of();
        }

        return subCategoryRepo.findByCategory(cat);
    }

    public List<Category> getCategoriesByTicketType(String ticketType) {
        String tenantId = getCurrentTenantId();
        return categoryRepo.findByTicketTypeIgnoreCaseAndTenantId(ticketType, tenantId);
    }

    public Category getCategoryByName(String categoryName) {
        String tenantId = getCurrentTenantId();
        return categoryRepo.findByCategoryNameIgnoreCaseAndTenantId(categoryName, tenantId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryName));
    }

    public List<String> getAllTicketTypes() {
        String tenantId = getCurrentTenantId();
        return categoryRepo.findDistinctTicketTypesByTenantId(tenantId);
    }

}
