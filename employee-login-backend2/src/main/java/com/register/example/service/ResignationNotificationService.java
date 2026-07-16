package com.register.example.service;

import com.register.example.entity.Notification;
import com.register.example.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ResignationNotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.register.example.service.DelegationService delegationService;
    

    /**
     * Creates and saves a new notification for a user related to a resignation process.
     *
     * @param employeeId   The ID of the recipient.
     * @param role         The role of the recipient (e.g., HR, MANAGER, ADMIN).
     * @param resignationId The ID of the related resignation record.
     * @param message      The content of the notification.
     */
    public void createNotification(String employeeId, String role, Long resignationId, String message) {
        try {
            if (employeeId == null || employeeId.trim().isEmpty()) {
                System.err.println("⚠️ [Resignation] Skipping notification — employeeId is null or empty");
                return;
            }

            // 1. Notify primary
            saveNotificationRecord(employeeId, message);

            // 2. Notify delegate if active
            try {
                String delegateId = delegationService.getActiveDelegateId(employeeId, "Exit Management");
                if (delegateId != null) {
                    saveNotificationRecord(delegateId, "[Delegated] " + message);
                }
            } catch (Exception e) {
                System.err.println("❌ [Resignation] Error notifying delegate: " + e.getMessage());
            }

        } catch (Exception e) {
            System.err.println("❌ [Resignation] Error saving notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void saveNotificationRecord(String employeeId, String message) {
        Notification notification = new Notification();
        notification.setEmployeeId(employeeId);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notificationRepository.save(notification);

        System.out.printf(
            "✅ [Resignation] Notification saved for Employee ID: %s | Msg: %s%n",
            employeeId,
            message
        );
    }


    /**
     * Retrieves all resignation-related notifications for a given employeeId.
     * (Currently returns all notifications for that employee)
     */
    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    /**
     * Marks a specific resignation notification as read.
     */
    public String markNotificationAsRead(Long id) {
        Optional<Notification> notif = notificationRepository.findById(id);
        if (notif.isPresent()) {
            Notification n = notif.get();
            n.setRead(true);
            notificationRepository.save(n);
            return "Resignation notification marked as read.";
        }
        return "Resignation notification ID " + id + " not found.";
    }
}
