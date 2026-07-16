package com.register.example.controller;

import com.register.example.entity.AdminAccess;
import com.register.example.payload.AdminAccessRequest;
import com.register.example.service.AdminAccessService;
import org.springframework.web.bind.annotation.*;
import com.register.example.entity.DocumentCategory;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/admin-access")
public class AdminAccessController {

    private final AdminAccessService service;

    public AdminAccessController(AdminAccessService service) {
        this.service = service;
    }

    // Save Admin / SuperAdmin access
    @PostMapping("/save")
    public AdminAccess saveAdminAccess(@RequestBody AdminAccessRequest request) {
        return service.saveAdminAccess(
                request.getRoleName().toUpperCase(),
                request.getEmployeeIds());
    }

    @PostMapping("/travel-admin/save")
    public void saveTravelAdmin(@RequestBody AdminAccessRequest request) {
        service.updateTravelAdmin(request.getEmployeeIds());
    }

    // Get IDs under a particular admin role
    @GetMapping("/{roleName}")
    public List<String> getAdminIds(@PathVariable String roleName) {
        return service.getAdminIds(roleName.toUpperCase());
    }

    // Check if user is Admin / SuperAdmin
    @GetMapping("/check")
    public boolean checkAdminRole(
            @RequestParam String roleName,
            @RequestParam String employeeId) {
        return service.isAdmin(roleName.toUpperCase(), employeeId);
    }

    // --------------------- DOCUMENT CATEGORY APIs ---------------------
    @PostMapping("/categories/save")
    public DocumentCategory saveCategory(@RequestParam String label) {
        return service.saveCategory(label);
    }

    @GetMapping("/categories")
    public List<DocumentCategory> getCategories() {
        return service.getAllCategories();
    }

    @DeleteMapping("/categories/{id}")
    public void deleteCategory(@PathVariable Long id) {
        service.deleteCategory(id);
    }
}
