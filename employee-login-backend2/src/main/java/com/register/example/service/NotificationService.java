package com.register.example.service;

import com.register.example.entity.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.register.example.repository.NotificationRepository;
import com.register.example.repository.EmployeeRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private TravelRequestService travelService; // Existing

    @Autowired
    private DailyEntryService dailyEntryService; // Existing

    @Autowired
    private PerformanceGoalService performanceGoalService; // NEW

    @Autowired
    private SelfAssessmentService selfAssessmentService;
    // NEW

    @Autowired
    private ApplicantService applicantService; // NEW

    @Autowired
    private TicketService ticketService; // ⭐ ADD THIS

    @Autowired
    private NotificationRepository notificationRepository; // ⭐ For Workflow/MyDocuments notifications

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Aggregates notifications from all modules into a single UNIQUE list.
     */
    public List<Notification> getAllNotifications(String employeeId) {
        if (employeeId == null || employeeId.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String trimmedId = employeeId.trim();
        Set<Notification> uniqueNotifications = new HashSet<>();

        // Add Claim notifications
        List<Notification> claimNotifs = claimService.getNotifications(trimmedId);
        if (claimNotifs != null)
            uniqueNotifications.addAll(claimNotifs);

        // Add Leave notifications
        List<Notification> leaveNotifs = leaveService.getNotifications(trimmedId);
        if (leaveNotifs != null)
            uniqueNotifications.addAll(leaveNotifs);

        // Add Travel notifications
        List<Notification> travelNotifs = travelService.getNotifications(trimmedId);
        if (travelNotifs != null)
            uniqueNotifications.addAll(travelNotifs);

        // Add DailyEntry notifications
        List<Notification> dailyEntryNotifs = dailyEntryService.getNotifications(trimmedId);
        if (dailyEntryNotifs != null)
            uniqueNotifications.addAll(dailyEntryNotifs);

        // Add PerformanceGoal notifications
        List<Notification> performanceGoalNotifs = performanceGoalService.getNotifications(trimmedId);
        if (performanceGoalNotifs != null)
            uniqueNotifications.addAll(performanceGoalNotifs);

        // Add Applicant notifications
        List<Notification> applicantNotifs = applicantService.getNotifications(trimmedId);
        if (applicantNotifs != null)
            uniqueNotifications.addAll(applicantNotifs);

        // Add Ticket notifications
        List<Notification> ticketNotifs = ticketService.getNotifications(trimmedId);
        if (ticketNotifs != null)
            uniqueNotifications.addAll(ticketNotifs);

        // ⭐ Add Workflow/MyDocuments Notifications from DB
        // workflowNotifs is redundant if claimService/leaveService already call
        // notificationRepository.findByEmployeeId
        // But we keep it in case some modules use it directly without a dedicated
        // service method
        List<Notification> workflowNotifs = notificationRepository.findByEmployeeId(trimmedId);
        if (workflowNotifs != null)
            uniqueNotifications.addAll(workflowNotifs);

        return new ArrayList<>(uniqueNotifications);
    }

    /**
     * Marks a notification as read in any module.
     */
    public String markNotificationAsRead(Long id) {
        String result;

        // 1. Try ClaimService
        result = claimService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // 2. Try LeaveService
        result = leaveService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // 3. Try TravelService
        result = travelService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // 4. Try DailyEntryService
        result = dailyEntryService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // 5. Try PerformanceGoalService
        result = performanceGoalService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // Try Applicant module
        result = applicantService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // Try TicketService
        result = ticketService.markNotificationAsRead(id);
        if (result != null && !result.toLowerCase().contains("not found"))
            return result;

        // 8. Try NotificationRepository (Central workflow/asset notifications)
        return notificationRepository.findById(id).map(notif -> {
            notif.setRead(true);
            notificationRepository.save(notif);
            return "Notification marked as read successfully.";
        }).orElse("Error: Notification ID " + id + " not found in any module.");
    }

    // ------------------ WORKFLOW / MYDOCUMENTS NOTIFICATIONS ------------------

    public void sendWorkflowNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.trim().isEmpty()) {
            System.err.println("⚠️ Cannot send notification: Employee ID is empty.");
            return;
        }
        try {
            Notification notif = new Notification();
            notif.setEmployeeId(employeeId.trim());
            notif.setMessage(message);
            notif.setRead(false);
            notif.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
            notificationRepository.save(notif);
            System.out.println("✅ Workflow notification saved for: " + employeeId);
        } catch (Exception e) {
            System.err.println("❌ Error saving workflow notification: " + e.getMessage());
        }
    }

    public void sendWorkflowBulkNotification(List<String> empIds, String message) {
        for (String id : empIds) {
            sendWorkflowNotification(id.trim(), message);
        }
    }
}
