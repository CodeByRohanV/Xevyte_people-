package com.register.example.controller;

import com.register.example.entity.Claim;
import com.register.example.entity.Employee;
import com.register.example.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/task-counts")
@CrossOrigin(origins = "*")
public class TaskCountController {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private TravelRequestService travelRequestService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private ResignationService resignationService;

    @Autowired
    private EmployeeService employeeService;

    
    @GetMapping("/{employeeId}")
    public ResponseEntity<Map<String, Long>> getTaskCounts(@PathVariable String employeeId) {

        Employee employee = employeeService.getEmployeeByEmployeeId(employeeId);
        if (employee == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Long> counts = new HashMap<>();

        counts.put("claims", getClaimsCount(employeeId));
        counts.put("leaves", getLeavesCount(employeeId));
        counts.put("travel", getTravelCount(employeeId));
        counts.put("helpdesk", getHelpdeskCount(employeeId));
        counts.put("exit", getExitCount(employeeId));

        // Total
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        counts.put("total", total);

        return ResponseEntity.ok(counts);
    }

    private long getClaimsCount(String employeeId) {
        Set<Claim> allClaims = new HashSet<>();
        try {
            allClaims.addAll(claimService.getClaimsForManager(employeeId));
        } catch (Exception e) {
        }
        try {
            allClaims.addAll(claimService.getClaimsForFinance(employeeId));
        } catch (Exception e) {
        }

        Set<String> claimTaskKeys = new HashSet<>();
        for (Claim c : allClaims) {
            String key = (c.getClaimGroupId() != null && !c.getClaimGroupId().trim().isEmpty())
                    ? c.getClaimGroupId()
                    : "single-" + c.getId();
            claimTaskKeys.add(key);
        }
        return (long) claimTaskKeys.size();
    }

    private long getLeavesCount(String employeeId) {
        Set<Long> leaveIds = new HashSet<>();
        try {
            leaveService.getManagerLeaves(employeeId).stream()
                    .filter(l -> l.getStatus() != null && (l.getStatus().equalsIgnoreCase("Pending")
                            || l.getStatus().toLowerCase().startsWith("pending level")))
                    .forEach(l -> leaveIds.add(l.getId()));
        } catch (Exception e) {
        }
        try {
            leaveService.getHrLeaves(employeeId).stream()
                    .filter(l -> l.getStatus() != null && (l.getStatus().equalsIgnoreCase("Pending")
                            || l.getStatus().toLowerCase().startsWith("pending level")))
                    .forEach(l -> leaveIds.add(l.getId()));
        } catch (Exception e) {
        }
        return (long) leaveIds.size();
    }

    private long getTravelCount(String employeeId) {
        Set<Long> travelIds = new HashSet<>();
        try {
            travelRequestService.getPendingRequestsForManager(employeeId).forEach(t -> travelIds.add(t.getId()));
        } catch (Exception e) {
        }
        try {
            travelRequestService.getRequestsAssignedToAdmin(employeeId).forEach(t -> travelIds.add(t.getId()));
        } catch (Exception e) {
        }
        return (long) travelIds.size();
    }

    private long getHelpdeskCount(String employeeId) {
        Set<Long> helpDeskIds = new HashSet<>();
        try {
            ticketService.getManagerTickets(employeeId).forEach(t -> helpDeskIds.add(t.getId()));
        } catch (Exception e) {
        }
        return (long) helpDeskIds.size();
    }

    private long getExitCount(String employeeId) {
        Set<Long> exitIds = new HashSet<>();
        String[] roles = { "MANAGER", "REVIEWER", "HR", "ADMIN", "FINANCE" };
        for (String role : roles) {
            try {
                resignationService.getAssignedResignations(role, employeeId).forEach(r -> exitIds.add(r.getId()));
            } catch (Exception e) {
            }
        }
        return (long) exitIds.size();
    }
}
