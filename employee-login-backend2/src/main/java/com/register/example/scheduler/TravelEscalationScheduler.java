package com.register.example.scheduler;

import com.register.example.entity.Employee;
import com.register.example.entity.TravelRequest;
import com.register.example.entity.Notification;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.repository.TravelRequestRepository;
import com.register.example.service.EmailService;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Component
public class TravelEscalationScheduler {

        private final TravelRequestRepository requestRepository;
        private final EmployeeRepository employeeRepository;
        private final NotificationRepository notificationRepository;
        private final EmailService emailService;

        public TravelEscalationScheduler(
                        TravelRequestRepository requestRepository,
                        EmployeeRepository employeeRepository,
                        NotificationRepository notificationRepository,
                        EmailService emailService) {
                this.requestRepository = requestRepository;
                this.employeeRepository = employeeRepository;
                this.notificationRepository = notificationRepository;
                this.emailService = emailService;
        }

        // ✅ Run every hour
        @Scheduled(fixedRate = 60 * 60 * 1000)
        @Transactional
        public void checkPendingRequests() {
                LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
                checkManagerPendingRequests(now);
                checkAdminPendingRequests(now);
        }

        private void checkManagerPendingRequests(LocalDateTime now) {
                List<TravelRequest> managerPendingRequests = requestRepository
                                .findByAssignedManagerIdIsNotNullAndStatus("Pending For Approval");

                for (TravelRequest req : managerPendingRequests) {
                        if (req.getCreatedAt() == null) {
                                continue;
                        }

                        long hoursPending = Duration.between(req.getCreatedAt(), now).toHours();

                        Employee emp = employeeRepository.findByEmployeeId(req.getEmployeeId()).orElse(null);
                        Employee manager = employeeRepository.findByEmployeeId(req.getAssignedManagerId()).orElse(null);

                        if (emp == null || manager == null) {
                                continue;
                        }

                        String empFullName = emp.getFirstName() + " " + emp.getLastName();

                        if (hoursPending >= 24 && hoursPending < 48) {
                                if (req.getManagerReminderSentAt() == null) {
                                        String msg = "Reminder: Please take action for the travel request submitted by "
                                                        + empFullName + " (" + emp.getEmployeeId() + ").";

                                        sendNotification(manager.getEmployeeId(), msg);
                                        emailService.sendEmail(manager.getEmail(),
                                                        "Reminder: Pending Travel Request", msg);

                                        req.setManagerReminderSentAt(new Date());
                                        requestRepository.save(req);
                                }
                        }
                }
        }

        private void checkAdminPendingRequests(LocalDateTime now) {
                List<TravelRequest> adminPendingRequests = requestRepository
                                .findByStatusAndTravelAdminIsNotNull("Booking In Progress");

                for (TravelRequest req : adminPendingRequests) {
                        if (req.getUpdatedAt() == null) {
                                continue;
                        }

                        long hoursPending = Duration.between(req.getUpdatedAt(), now).toHours();

                        Employee emp = employeeRepository.findByEmployeeId(req.getEmployeeId()).orElse(null);
                        Employee admin = employeeRepository.findByEmployeeId(req.getTravelAdmin()).orElse(null);

                        if (emp == null || admin == null) {
                                continue;
                        }

                        String empFullName = emp.getFirstName() + " " + emp.getLastName();

                        if (hoursPending >= 12 && hoursPending < 24) {
                                if (req.getAdminReminderSentAt() == null) {
                                        String msg = "Reminder: Please take action for the travel request (ID: "
                                                        + req.getId() + ") submitted by "
                                                        + empFullName + " (" + emp.getEmployeeId() + ").";

                                        sendNotification(admin.getEmployeeId(), msg);
                                        emailService.sendEmail(admin.getEmail(),
                                                        "Reminder: Pending Travel Request", msg);

                                        req.setAdminReminderSentAt(new Date());
                                        requestRepository.save(req);
                                }
                        }
                }
        }

        // ================================
        // HELPER: Send Notification
        // ================================
        private void sendNotification(String employeeId, String message) {
                if (employeeId == null || message == null)
                        return;

                Notification notification = new Notification();
                notification.setEmployeeId(employeeId);
                notification.setMessage(message);
                notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
                notification.setRead(false);

                notificationRepository.save(notification);
        }
}
