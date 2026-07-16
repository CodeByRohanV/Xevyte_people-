package com.register.example.controller;

import com.register.example.payload.ModuleAccessRequest;
import com.register.example.service.ModuleAccessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/module-access")
@CrossOrigin("*")
public class ModuleAccessController {

    @Autowired
    private ModuleAccessService service;

    // ✅ SAVE / UPDATE
    @PostMapping("/save")
    public void save(@RequestBody ModuleAccessRequest request) {
        service.saveAccess(request.getModuleKey(), request.getEmployeeIds());
    }

    // ✅ FETCH IDS FOR MODULE (ADMIN PAGE)
    @GetMapping("/module/{moduleKey}")
    public List<String> getEmployees(@PathVariable String moduleKey) {
        return service.getEmployeeIdsByModule(moduleKey);
    }

    // ✅ SIDEBAR CHECK
    @GetMapping("/employee/{employeeId}")
    public Map<String, Boolean> getAccess(@PathVariable String employeeId) {
        return service.getAccessForEmployee(employeeId);
    }
 // ✅ PERMANENT DELETE
    @DeleteMapping("/module/{moduleKey}/employee/{employeeId}")
    public void removeEmployee(
            @PathVariable String moduleKey,
            @PathVariable String employeeId
    ) {
        service.removeEmployeeFromModule(moduleKey, employeeId);
    }

}
