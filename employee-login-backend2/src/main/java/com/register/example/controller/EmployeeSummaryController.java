package com.register.example.controller;

import com.register.example.payload.EmployeeSummaryDTO;
import com.register.example.service.EmployeeSummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employeesdetails")
public class EmployeeSummaryController {

    @Autowired
    private EmployeeSummaryService employeeSummaryService;

    // --- Get all employees with only ID, name, email ---
    @GetMapping("/summary")
    public List<EmployeeSummaryDTO> getAllEmployeesSummary() {
        return employeeSummaryService.getAllEmployeesSummary();
    }

    // --- Get employee suggestions for auto-complete ---
    @GetMapping("/suggestions")
    public List<EmployeeSummaryDTO> getEmployeeSuggestions(@RequestParam String query) {
        return employeeSummaryService.getEmployeeSuggestions(query);
    }

    // --- Get ONLY approver/admin suggestions (Manager, Reviewer, HR, Finance, Admin, Travel Admin) ---
    @GetMapping("/approver-suggestions")
    public List<EmployeeSummaryDTO> getApproverSuggestions(@RequestParam String query) {
        return employeeSummaryService.getApproverSuggestions(query);
    }
}
