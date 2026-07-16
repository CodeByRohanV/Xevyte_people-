package com.register.example.controller;

import com.register.example.service.LeaveAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "*")
public class LeaveAssignmentController {

    private final LeaveAssignmentService leaveAssignmentService;

    public LeaveAssignmentController(LeaveAssignmentService leaveAssignmentService) {
        this.leaveAssignmentService = leaveAssignmentService;
    }

    /**
     * ✔ Summary leave balance (total granted/consumed/remaining)
     * GET /api/leaves/balance/{employeeId}
     */
    @GetMapping("/balance/{employeeId}")
    public ResponseEntity<Map<String, Double>> getLeaveBalance(
            @PathVariable String employeeId) {

        Map<String, Double> result = leaveAssignmentService.getLeaveBalance(employeeId);

        return ResponseEntity.ok(result);
    }

    /**
     * ✔ Detailed leave balance table
     * GET /api/leaves/balance/details/{employeeId}
     */
    @GetMapping("/balance/details/{employeeId}")
    public ResponseEntity<java.util.List<com.register.example.payload.EmployeeLeaveBalanceDTO>> getDetailedLeaveBalance(
            @PathVariable String employeeId) {

        java.util.List<com.register.example.payload.EmployeeLeaveBalanceDTO> result = leaveAssignmentService
                .getDetailedLeaveBalance(employeeId);

        return ResponseEntity.ok(result);
    }

    /**
     * ✔ Alias for detailed leave balance (frontend compatibility)
     * GET /api/leaves/balance-detailed/{employeeId}
     */
    @GetMapping("/balance-detailed/{employeeId}")
    public ResponseEntity<java.util.List<com.register.example.payload.EmployeeLeaveBalanceDTO>> getDetailedLeaveBalanceAlias(
            @PathVariable String employeeId) {
        return getDetailedLeaveBalance(employeeId);
    }
}
