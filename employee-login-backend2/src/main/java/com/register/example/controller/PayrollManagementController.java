package com.register.example.controller;

import com.register.example.entity.PayrollManagement;
import com.register.example.service.PayrollManagementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll-management")
@CrossOrigin(origins = "*")
public class PayrollManagementController {

    private final PayrollManagementService payrollManagementService;

    public PayrollManagementController(PayrollManagementService payrollManagementService) {
        this.payrollManagementService = payrollManagementService;
    }

    @GetMapping
    public ResponseEntity<Object> getPayrollRecords(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            return ResponseEntity.ok(payrollManagementService.getAndSyncPayrollForAllEmployees(date));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/calculate")
    public ResponseEntity<Object> calculatePayroll(
            @RequestParam(required = false) String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        try {
            if (employeeId != null && !employeeId.isEmpty()) {
                PayrollManagement result = payrollManagementService.calculateAndSavePayroll(employeeId, date);
                return ResponseEntity.ok(result);
            } else {
                payrollManagementService.calculatePayrollForAllEmployees(date);
                return ResponseEntity.ok(Map.of("message", "Payroll calculation triggered for all employees for "
                        + date.getMonth() + " " + date.getYear()));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
