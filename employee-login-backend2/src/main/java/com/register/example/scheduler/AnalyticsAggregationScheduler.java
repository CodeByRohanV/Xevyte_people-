package com.register.example.scheduler;

import com.register.example.entity.DepartmentMetricsSummary;
import com.register.example.entity.Employee;
import com.register.example.entity.LeaveRequest;
import com.register.example.entity.Resignation;
import com.register.example.entity.Ticket;
import com.register.example.repository.DepartmentMetricsSummaryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.LeaveRequestRepository;
import com.register.example.repository.ResignationRepository;
import com.register.example.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class AnalyticsAggregationScheduler {

    private final EmployeeRepository employeeRepository;
    private final DepartmentMetricsSummaryRepository summaryRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final TicketRepository ticketRepository;
    private final ResignationRepository resignationRepository;

    @Scheduled(cron = "0 0 2 * * ?") // Runs every day at 2 AM
    public void aggregateMetrics() {
        log.info("Starting nightly analytics aggregation with advanced KPIs...");
        LocalDate today = LocalDate.now();
        
        List<String> departments = employeeRepository.findDistinctDepartments();
        for (String dept : departments) {
            if (dept == null || dept.trim().isEmpty()) continue;
            
            long totalEmployees = employeeRepository.countByDepartmentAndActive(dept, "yes");
            
            List<String> empIds = employeeRepository.findByDepartment(dept).stream()
                    .map(Employee::getEmployeeId)
                    .collect(Collectors.toList());
            
            long activeLeaves = 0;
            long pendingApprovals = 0;
            int sickLeaves = 0;
            int casualLeaves = 0;
            int earnedLeaves = 0;
            long openTickets = 0;
            long attritionCount = 0;

            if (!empIds.isEmpty()) {
                List<LeaveRequest> leaves = leaveRequestRepository.findByEmployeeIdInAndStatusIn(
                        empIds, List.of("APPROVED", "Pending")
                );
                
                for (LeaveRequest leave : leaves) {
                    if ("APPROVED".equalsIgnoreCase(leave.getStatus())) {
                        if (leave.getStartDate() != null && leave.getEndDate() != null && 
                            !today.isBefore(leave.getStartDate()) && !today.isAfter(leave.getEndDate())) {
                            activeLeaves++;
                            if ("Sick".equalsIgnoreCase(leave.getType())) sickLeaves++;
                            else if ("Casual".equalsIgnoreCase(leave.getType())) casualLeaves++;
                            else if ("Earned".equalsIgnoreCase(leave.getType())) earnedLeaves++;
                        }
                    } else if (leave.getStatus() != null && leave.getStatus().toLowerCase().startsWith("pending")) {
                        pendingApprovals++;
                    }
                }

                for (String empId : empIds) {
                    List<Ticket> tickets = ticketRepository.findByEmployeeId(empId);
                    openTickets += tickets.stream()
                        .filter(t -> "Open".equalsIgnoreCase(t.getStatus()) || "In Progress".equalsIgnoreCase(t.getStatus()))
                        .count();
                        
                    List<Resignation> resignations = resignationRepository.findByEmployeeId(empId);
                    attritionCount += resignations.stream()
                        .filter(r -> "Clearance Completed".equalsIgnoreCase(r.getStatus()) || "HR Approved".equalsIgnoreCase(r.getStatus()))
                        .count();
                }
            }
            
            // --- Advanced Enterprise Heuristics ---
            
            // 1. Flight Risk Score (0-100)
            // Based on attrition history, high leave frequency, and long pending approvals
            int baseFlightRisk = 10;
            int attritionPenalty = (int) Math.min(attritionCount * 15, 40);
            int pendingApprovalPenalty = (int) Math.min(pendingApprovals * 2, 25);
            int sickLeavePenalty = (int) Math.min(sickLeaves * 3, 25);
            int flightRiskScore = Math.min(100, baseFlightRisk + attritionPenalty + pendingApprovalPenalty + sickLeavePenalty);
            
            // 2. Burnout Risk Score (0-100)
            // Driven by high open tickets (workload), low casual/earned leaves (no rest), and sick leaves (physical toll)
            int workloadStress = (int) Math.min(openTickets * 5, 40);
            int noRestPenalty = casualLeaves + earnedLeaves == 0 ? 30 : 0;
            int sickToll = (int) Math.min(sickLeaves * 4, 30);
            int burnoutRiskScore = Math.min(100, workloadStress + noRestPenalty + sickToll);
            
            // 3. Manager Effectiveness Score (0-100)
            // Managers who approve quickly and maintain low attrition have high scores
            int baseEffectiveness = 90;
            int approvalDelayPenalty = (int) Math.min(pendingApprovals * 5, 50);
            int attritionLoss = (int) Math.min(attritionCount * 10, 40);
            int managerEffectivenessScore = Math.max(0, baseEffectiveness - approvalDelayPenalty - attritionLoss);
            
            // 4. Leave Forecast (Simple moving average simulation for next 30 days)
            // Just simulating a heuristic: current active leaves + 10% historical sick trend
            int leaveForecast = (int) (activeLeaves + (sickLeaves * 1.5) + (casualLeaves * 0.5));
            
            // 5. Department Health Score (0-100)
            // An aggregate index: Inverse of flight risk & burnout, boosted by manager effectiveness
            int healthScore = 100 - (flightRiskScore / 2) - (burnoutRiskScore / 2) + (managerEffectivenessScore - 50) / 2;
            int departmentHealthScore = Math.min(100, Math.max(0, healthScore));

            // 6. Workforce Health Score
            // Specifically tracks absenteeism vs presence
            int absenteeismImpact = (int) Math.min((sickLeaves + casualLeaves) * 2, 50);
            int workforceHealthScore = Math.max(0, 100 - absenteeismImpact);

            DepartmentMetricsSummary summary = summaryRepository.findByDepartmentAndRecordDate(dept, today)
                    .orElse(new DepartmentMetricsSummary());
                    
            summary.setDepartment(dept);
            summary.setRecordDate(today);
            summary.setTotalEmployees((int) totalEmployees);
            summary.setActiveLeaves((int) activeLeaves);
            summary.setOpenTickets((int) openTickets);
            summary.setPendingApprovals((int) pendingApprovals);
            summary.setAttritionCount((int) attritionCount);
            summary.setSickLeaves(sickLeaves);
            summary.setCasualLeaves(casualLeaves);
            summary.setEarnedLeaves(earnedLeaves);
            
            // Set Advanced KPIs
            summary.setFlightRiskScore(flightRiskScore);
            summary.setBurnoutRiskScore(burnoutRiskScore);
            summary.setManagerEffectivenessScore(managerEffectivenessScore);
            summary.setLeaveForecast(leaveForecast);
            summary.setDepartmentHealthScore(departmentHealthScore);
            summary.setWorkforceHealthScore(workforceHealthScore);
            
            summaryRepository.save(summary);
        }
        log.info("Finished advanced analytics aggregation for {} departments", departments.size());
    }
}

