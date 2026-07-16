package com.register.example.scheduler;

import com.register.example.entity.Employee;
import com.register.example.entity.PerformanceGoal;
import com.register.example.entity.Notification;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PerformanceGoalRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import java.util.List;

@Component
public class GoalEscalationScheduler {

    private final PerformanceGoalRepository goalRepository;
    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;

    @PersistenceContext
    private EntityManager entityManager;

    public GoalEscalationScheduler(PerformanceGoalRepository goalRepository,
            NotificationRepository notificationRepository,
            EmployeeRepository employeeRepository,
            EmailService emailService) {
        this.goalRepository = goalRepository;
        this.notificationRepository = notificationRepository;
        this.employeeRepository = employeeRepository;
        this.emailService = emailService;
    }

    @Scheduled(fixedRate = 120000) // Every 2 minutes
    @Transactional
    public void checkAndUpdateGoals() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

        // ===================== 1️⃣ HANDLE "PENDING" GOALS =====================
        List<PerformanceGoal> pendingGoals = goalRepository.findByStatus("Pending");
        for (PerformanceGoal goal : pendingGoals) {
            if (goal.getStartDate() == null)
                continue;

            long daysSinceStart = ChronoUnit.DAYS.between(goal.getStartDate().toLocalDate(), today);
            Employee employee = employeeRepository.findByEmployeeId(goal.getEmployeeId()).orElse(null);
            if (employee == null)
                continue;

            // 🔔 12-Day Reminder
            if (daysSinceStart >= 12 && !goal.isReminder12DaysSent()) {
                sendNotification(employee,
                        "Please take action on your goal: " + goal.getGoalTitle(),
                        "Goal Reminder");

                goal.setReminder12DaysSent(true);
                goalRepository.save(goal);
            }

            // 🔒 15-Day Lock and Set In Progress
            if (daysSinceStart >= 15 && !goal.isInProgress15DaysSent()) {
                goal.setStatus("In Progress");
                goal.setInProgress15DaysSent(true);
                goalRepository.save(goal);
                goalRepository.flush();

                sendNotification(employee,
                        "Your goals are auto-locked. Please check.",
                        "Goal Status Updated");

                System.out.println("✅ Status updated to In Progress for Goal ID " + goal.getGoalId());
            }
        }

        // ===================== 2️⃣ HANDLE "IN PROGRESS" GOALS =====================
        // Self-Assessment and Auto-Submit logic removed as requested.
        // This section now remains for any future "In Progress" specific logic.
        List<PerformanceGoal> inProgressGoals = goalRepository.findByStatus("In Progress");
        for (PerformanceGoal goal : inProgressGoals) {
            // Currently no automated escalations for In Progress status
            continue;
        }

        // ✅ Clear persistence context to avoid stale data
        entityManager.clear();
    }

    // 📩 Helper: Send in-app + email notification
    private void sendNotification(Employee employee, String message, String subject) {
        if (employee == null)
            return;

        System.out.println("SCHEDULER DEBUG (Pre-DB Write): Final Message='" + message + "'");

        Notification notification = new Notification();
        notification.setEmployeeId(employee.getEmployeeId());
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);

        notificationRepository.save(notification);

        emailService.sendEmail(employee.getEmail(), subject, message);

        System.out.println("📧 Notification sent to " + employee.getEmployeeId() + ": " + subject);
    }
}