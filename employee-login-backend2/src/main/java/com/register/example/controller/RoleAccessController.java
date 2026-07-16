package com.register.example.controller;

import com.register.example.entity.RoleAccess;
import com.register.example.payload.RoleAccessRequest;
import com.register.example.service.RoleAccessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/roles")
public class RoleAccessController {

    @Autowired
    private RoleAccessService service;

    // ✅ Save / Update role access
    @PostMapping("/save")
    public RoleAccess saveRoleData(@RequestBody RoleAccessRequest request) {
        return service.saveRoleAccess(
                request.getRoleName(),
                request.getEmployeeIds()
        );
    }

    // ✅ Get all employee IDs for a role
    @GetMapping("/{roleName}")
    public List<String> getRoleEmployees(@PathVariable String roleName) {
        return service.getEmployeeIds(roleName);
    }

    // ✅ Check if employee belongs to a role
    @GetMapping("/check")
    public boolean checkRole(
            @RequestParam String roleName,
            @RequestParam String employeeId
    ) {
        return service.isEmployeeInRole(roleName, employeeId);
    }
    @DeleteMapping("/remove")
    public RoleAccess removeEmployee(
            @RequestParam String roleName,
            @RequestParam String employeeId
    ) {
        return service.removeEmployeeId(roleName, employeeId);
    }

}
