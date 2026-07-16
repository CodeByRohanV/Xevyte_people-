package com.register.example.scheduler;

import com.register.example.entity.Claim;

import com.register.example.entity.Employee;
import com.register.example.entity.Notification;
import com.register.example.repository.ClaimRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class EscalationScheduler {

    private static final String CONST_MANAGER = "Manager";
    private static final String CONST_FINANCE = "Finance";

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;


    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Runs every 1 hour and performs escalation + notifications based on time thresholds.
     */
     @Scheduled(fixedRate = 3600000)
//    @Scheduled(fixedRate = 60000)  // 60,000 ms = 1 minute
    public void escalateAndNotifyClaims() {
        Date now = new Date();

        handleManagerLevelEscalation(now);
        handleFinanceLevelEscalation(now); 
    }

    /**
     *  MANAGER INACTION HANDLING:
     *  - After 3 days → Notify Manager (Alert) (once)
     *  - After 5 days → Escalate to Finance + notify both Manager and Finance
     */
    private void handleManagerLevelEscalation(Date now) {
        List<Claim> managerClaims = claimRepository.findByStatusAndNextApprover("Pending", CONST_MANAGER);

        for (Claim claim : managerClaims) {
            long diffHours = TimeUnit.MILLISECONDS.toHours(now.getTime() - claim.getSubmittedDate().getTime());

            // --- Step 1: After 3 days (72 hours) notify Manager alert (only once) ---
            if (diffHours >= 72) {
                if (claim.getManagerReminderSentAt() == null) {
                    sendManagerReminder(claim, now);
                    claim.setManagerReminderSentAt(now);
                    claimRepository.save(claim);
                }
            }

            // --- Step 2: Auto-escalation to Finance is removed/disabled ---
            // else if (diffHours >= 120) {
            //     escalateToFinance(claim, now);
            //     claim.setManagerReminderSentAt(null);
            //     claimRepository.save(claim);
            // }
        }
    }

    /**
     * FINANCE INACTION HANDLING:
     * - After 3 days → Notify Finance (Alert) (once)
     * - After 5 days → Auto-Reject + notify Finance and Employee
     */
    private void handleFinanceLevelEscalation(Date now) {
        List<Claim> financeClaims = claimRepository.findByStatusAndNextApprover("Pending", CONST_FINANCE);

        for (Claim claim : financeClaims) {
            long diffHours = TimeUnit.MILLISECONDS.toHours(now.getTime() - claim.getSubmittedDate().getTime());

            // --- Step 3: After 3 days (72 hours) notify Finance alert (only once) ---
            if (diffHours >= 72) {
                if (claim.getFinanceReminderSentAt() == null) {
                    sendFinanceReminder(claim, now);
                    claim.setFinanceReminderSentAt(now);
                    claimRepository.save(claim);
                }
            }

            // --- Step 4: After 5 days (120 hours) auto-reject (Disabled) ---
//            else if (diffHours >= 120) {
//                autoRejectClaim(claim, now);
//                // reset reminder timestamp as no longer needed
//                claim.setFinanceReminderSentAt(null);
//                claimRepository.save(claim);
//            } 
        }
    }

    // ------------------------- Helper Methods ---------------------------- //

    private void sendManagerReminder(Claim claim, Date now) {
        Employee manager = getEmployeeByRole(claim.getEmployeeId(), CONST_MANAGER);
        if (manager != null) {
            String msg = " Reminder: You have a pending claim from " + claim.getEmployeeId() +
                    " awaiting your approval for over 3 days. Please take action.";
            sendNotification(manager.getEmployeeId(), msg, now);
            emailService.sendEmail(manager.getEmail(), "Pending Claim Reminder", msg);
        }
    }

    private void escalateToFinance(Claim claim, Date now) {
        claim.setNextApprover(CONST_FINANCE);
        claimRepository.save(claim);

        Employee manager = getEmployeeByRole(claim.getEmployeeId(), CONST_MANAGER); 
        Employee finance = getEmployeeByRole(claim.getEmployeeId(), CONST_FINANCE);

        // Notify Manager
        if (manager != null) {
            String msgManager = "Claim (ID: " + claim.getId() + ") has been escalated to Finance due to your inaction (5 days).";
            sendNotification(manager.getEmployeeId(), msgManager, now);
            emailService.sendEmail(manager.getEmail(), "Claim Escalated to Finance", msgManager);
        }

        // Notify Finance
        if (finance != null) {
            String msgFinance = " A claim (ID: " + claim.getId() + ") has been assigned to you due to Manager inaction. Please review and approve the claim within 3 days.";
            sendNotification(finance.getEmployeeId(), msgFinance, now);
            emailService.sendEmail(finance.getEmail(), "New Claim Assigned from Manager Escalation", msgFinance);
        }
    }

    private void sendFinanceReminder(Claim claim, Date now) {
        Employee finance = getEmployeeByRole(claim.getEmployeeId(), CONST_FINANCE);
        if (finance != null) {
            String msg = "Reminder: You have a pending claim (ID: " + claim.getId() +
                    ") awaiting your approval for over 3 days. Please review it and take necessary action.";
            sendNotification(finance.getEmployeeId(), msg, now);
            emailService.sendEmail(finance.getEmail(), "Pending Claim Reminder (Finance)", msg);
        }
    }

    
    private void autoRejectClaim(Claim claim, Date now) {
        claim.setStatus("Rejected");
        claim.setNextApprover(null);
        claim.setRejectionReason("Automatically rejected due to Finance inaction (5 days).");
        claimRepository.save(claim);

        Employee finance = getEmployeeByRole(claim.getEmployeeId(), CONST_FINANCE);
        Employee employee = employeeRepository.findByEmployeeId(claim.getEmployeeId()).orElse(null);

        // Notify Finance
        if (finance != null) {
            String msgFinance = "Claim (ID: " + claim.getId() + ") auto-rejected due to your inaction (5 days).";
            sendNotification(finance.getEmployeeId(), msgFinance, now);
            emailService.sendEmail(finance.getEmail(), "Claim Auto-Rejected", msgFinance);
        } 

        // Notify Employee
        if (employee != null) {
            String msgEmp = " Your claim (ID: " + claim.getId() + ") was automatically rejected due to Finance inaction. Please contact your finance team for further assistance.";
            sendNotification(employee.getEmployeeId(), msgEmp, now);
            emailService.sendEmail(employee.getEmail(), "Claim Auto-Rejected by System", msgEmp);
        }
    }

    private void sendNotification(String employeeId, String message, Date timestamp) {
        if (employeeId == null) return;
        Notification notification = new Notification();
        notification.setEmployeeId(employeeId);
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    private Employee getEmployeeByRole(String employeeId, String role) {
        return employeeRepository.findByEmployeeId(employeeId)
                .map(emp -> {
                    String assignedId = switch (role) {
                        case CONST_MANAGER -> emp.getAssignedManagerId();
                        case CONST_FINANCE -> emp.getAssignedFinanceId();
                        default -> null;
                    };
                    if (assignedId == null) return null;
                    return employeeRepository.findByEmployeeId(assignedId).orElse(null);
                })
                .orElse(null);
    }

}
