package com.register.example.scheduler;

import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;
import com.register.example.entity.Holiday;
import com.register.example.entity.LeaveRequest;
import com.register.example.entity.Notification;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.HolidayRepository;
import com.register.example.repository.LeaveRequestRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Component
public class TimesheetReminderScheduler {

    private final EmployeeRepository employeeRepository;
    private final DailyEntryRepository dailyEntryRepository;
    private final HolidayRepository holidayRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public TimesheetReminderScheduler(EmployeeRepository employeeRepository,
                                      DailyEntryRepository dailyEntryRepository,
                                      HolidayRepository holidayRepository,
                                      LeaveRequestRepository leaveRequestRepository,
                                      NotificationRepository notificationRepository,
                                      EmailService emailService) {
        this.employeeRepository = employeeRepository;
        this.dailyEntryRepository = dailyEntryRepository;
        this.holidayRepository = holidayRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }

    // @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    public void sendTimesheetReminders() {
        LocalDate yesterday = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).minusDays(1);
        processDateReminders(yesterday);
    }

    public void processDateReminders(LocalDate date) {
        List<Employee> activeEmployees = employeeRepository.findByActive("yes");

        for (Employee emp : activeEmployees) {
            try {
                // 1. Skip if date was a weekend or company holiday for this employee
                if (isWeekendOrHoliday(emp, date)) {
                    continue;
                }

                // 2. Skip if employee has approved leave on this date
                if (isOnApprovedLeave(emp.getEmployeeId(), date)) {
                    continue;
                }

                // 3. Check timesheet entries
                Optional<DailyEntry> entryOpt = dailyEntryRepository.findByEmployeeIdAndDate(emp.getEmployeeId(), date);

                if (entryOpt.isPresent()) {
                    DailyEntry entry = entryOpt.get();

                    if ("SUBMITTED".equalsIgnoreCase(entry.getStatus())) {
                        continue;
                    }

                    if (entry.getLoginTime() != null && !entry.getLoginTime().trim().isEmpty()) {
                        sendMissedLogoutReminder(emp, date);
                    } else {
                        sendMissedLoginLogoutReminder(emp, date);
                    }
                } else {
                    sendMissedLoginLogoutReminder(emp, date);
                }
            } catch (Exception e) {
                System.err.println("Error processing reminders for " + emp.getEmployeeId() + ": " + e.getMessage());
            }
        }
    }

    private boolean isWeekendOrHoliday(Employee employee, LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return true;
        }

        List<Holiday> holidays;
        if (employee.getTenantId() != null && !employee.getTenantId().trim().isEmpty()) {
            holidays = holidayRepository.findByDateBetweenAndTenantId(date, date, employee.getTenantId());
        } else {
            holidays = holidayRepository.findByDateBetween(date, date);
        }

        for (Holiday h : holidays) {
            boolean locationMatch = false;
            if (h.getLocation() == null) {
                locationMatch = true;
            } else if (employee.getWorkLocation() != null && h.getLocation().equalsIgnoreCase(employee.getWorkLocation())) {
                locationMatch = true;
            }

            if (locationMatch) {
                boolean isOptional = h.getHoliday() != null && h.getHoliday().toLowerCase().contains("(optional)");
                if (!isOptional) {
                    return true;
                }
            }
        }

        return false;
    }

    private boolean isOnApprovedLeave(String employeeId, LocalDate date) {
        List<LeaveRequest> leaves = leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, "Approved");
        for (LeaveRequest leave : leaves) {
            if (leave.getStartDate() != null && leave.getEndDate() != null) {
                if (!date.isBefore(leave.getStartDate()) && !date.isAfter(leave.getEndDate())) {
                    return true;
                }
            }
        }
        return false;
    }

    private String getShortEmployeeId(String employeeId) {
        if (employeeId == null) {
            return "";
        }
        int index = employeeId.indexOf('_');
        if (index != -1 && index < employeeId.length() - 1) {
            return employeeId.substring(index + 1);
        }
        return employeeId;
    }

    private void sendMissedLogoutReminder(Employee emp, LocalDate date) {
        String formattedDate = date.format(DATE_FORMATTER);
        String subject = "Timesheet Reminder: Missed Logout";
        String empMsg = "You logged in yesterday (" + formattedDate + ") but missed submitting your logout entry. Please update your timesheet.";

        sendNotification(emp, subject, empMsg);

        if (emp.getAssignedManagerId() != null && !emp.getAssignedManagerId().trim().isEmpty()) {
            Optional<Employee> managerOpt = employeeRepository.findByEmployeeId(emp.getAssignedManagerId());
            if (managerOpt.isPresent()) {
                String managerMsg = "Employee " + emp.getFirstName() + " " + emp.getLastName() + " (" + getShortEmployeeId(emp.getEmployeeId()) + ") logged in yesterday (" + formattedDate + ") but did not submit their logout entry.";
                sendNotification(managerOpt.get(), subject, managerMsg);
            }
        }
    }

    private void sendMissedLoginLogoutReminder(Employee emp, LocalDate date) {
        String formattedDate = date.format(DATE_FORMATTER);
        String subject = "Timesheet Reminder: Missed Login & Logout";
        String empMsg = "You have not submitted both login and logout for yesterday (" + formattedDate + ", working day). Please submit your timesheet.";

        sendNotification(emp, subject, empMsg);

        if (emp.getAssignedManagerId() != null && !emp.getAssignedManagerId().trim().isEmpty()) {
            Optional<Employee> managerOpt = employeeRepository.findByEmployeeId(emp.getAssignedManagerId());
            if (managerOpt.isPresent()) {
                String managerMsg = "Employee " + emp.getFirstName() + " " + emp.getLastName() + " (" + getShortEmployeeId(emp.getEmployeeId()) + ") has not submitted login and logout entries for yesterday (" + formattedDate + ").";
                sendNotification(managerOpt.get(), subject, managerMsg);
            }
        }
    }

    private void sendNotification(Employee emp, String subject, String message) {
        if (emp == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setEmployeeId(emp.getEmployeeId());
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);
        notificationRepository.save(notification);

        if (emp.getEmail() != null && !emp.getEmail().trim().isEmpty()) {
            emailService.sendEmail(emp.getEmail(), subject, message);
        }
    }
}
