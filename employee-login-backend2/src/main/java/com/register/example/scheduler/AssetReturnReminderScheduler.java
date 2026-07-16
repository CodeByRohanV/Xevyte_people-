package com.register.example.scheduler;

import com.register.example.entity.AssetAllocation;
import com.register.example.entity.AssetMaster;
import com.register.example.entity.Employee;
import com.register.example.repository.AssetAllocationRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.EmailService;
import com.register.example.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class AssetReturnReminderScheduler {

    @Autowired
    private AssetAllocationRepository assetAllocationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private com.register.example.repository.TenantRepository tenantRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    /**
     * Scheduled task to send asset return reminders.
     * Runs every day at 9:00 AM.
     * Targets assets due for return within the next 7 days.
     */
    @Scheduled(cron = "0 0 9 * * ?", zone = "Asia/Kolkata")
    public void sendAssetReturnReminders() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        LocalDate sevenDaysLater = today.plusDays(7);

        System.out.println("⏳ Starting Asset Return Reminder Check for period: " + today + " to " + sevenDaysLater);

        List<AssetAllocation> upcomingReturns = assetAllocationRepository
                .findByReturnDateIsNullAndExpectedReturnDateBetween(today, sevenDaysLater);

        if (upcomingReturns.isEmpty()) {
            System.out.println("ℹ️ No assets due for return in the next week.");
            return;
        }

        for (AssetAllocation allocation : upcomingReturns) {
            try {
                sendRemindersForAllocation(allocation);
            } catch (Exception e) {
                System.err.println("❌ Failed to send reminders for allocation ID: " + allocation.getAllocationId() + " - " + e.getMessage());
            }
        }
        
        System.out.println("✅ Asset Return Reminder task completed.");
    }

    private void sendRemindersForAllocation(AssetAllocation allocation) {
        Employee employee = allocation.getEmployee();
        if (employee == null) {
            return;
        }

        final String assetName = resolveAssetName(allocation.getAsset());
        final String assetTag = allocation.getAsset() != null ? allocation.getAsset().getAssetTag() : "N/A";
        LocalDate returnDate = allocation.getExpectedReturnDate();
        final String formattedReturnDate = returnDate != null ? returnDate.format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "N/A";

        sendEmployeeReminders(employee, assetTag, assetName, formattedReturnDate);
        sendAllocatorReminders(employee, allocation.getApprovedBy(), assetTag, assetName, formattedReturnDate);
    }

    private String resolveAssetName(AssetMaster asset) {
        if (asset == null) {
            return "Asset";
        }
        String tempAssetName = null;
        if (asset.getDynamicValues() != null) {
            tempAssetName = getDynamicValueCaseInsensitive(asset.getDynamicValues(), "Asset Model Name");
            if (tempAssetName == null || tempAssetName.isEmpty()) {
                tempAssetName = getDynamicValueCaseInsensitive(asset.getDynamicValues(), "Model");
            }
        }
        if (tempAssetName == null || tempAssetName.isEmpty()) {
            if (asset.getSubCategory() != null) {
                tempAssetName = asset.getSubCategory().getName();
            } else if (asset.getCategory() != null) {
                tempAssetName = asset.getCategory().getName();
            }
        }
        return (tempAssetName != null && !tempAssetName.isEmpty()) ? tempAssetName : "Asset";
    }

    private void sendEmployeeReminders(Employee employee, String assetTag, String assetName, String formattedReturnDate) {
        String subject = "Reminder: Asset Return Due Soon - " + assetTag;

        String tenantId = employee.getTenantId();
        com.register.example.entity.Tenant tenant = (tenantId != null && tenantRepository != null) 
                ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
        String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";

        String messageBody = String.format(
            "Dear %s,\n\n" +
            "This is a reminder that the asset allocated to you is due for return.\n\n" +
            "Asset details:\n" +
            "- Asset Tag: %s\n" +
            "- Model: %s\n" +
            "- Expected Return Date: %s\n\n" +
            "Please ensure that you return the asset on or before the due date. You can view the details in the Asset Management module of your portal.\n\n" +
            "Best regards,\n" +
            "IT Asset Management Team\n" +
            "%s",
            employee.getFirstName(), assetTag, assetName, formattedReturnDate, resolvedCompanyName
        );

        if (employee.getEmail() != null && !employee.getEmail().isEmpty()) {
            emailService.sendEmail(employee.getEmail(), subject, messageBody);
        }
        notificationService.sendWorkflowNotification(employee.getEmployeeId(), 
            "Reminder: Your allocated asset (" + assetTag + ") is due for return on " + formattedReturnDate);
    }

    private void sendAllocatorReminders(Employee employee, String allocatorId, String assetTag, String assetName, String formattedReturnDate) {
        if (allocatorId == null || allocatorId.trim().isEmpty()) {
            return;
        }
        employeeRepository.findByEmployeeId(allocatorId.trim()).ifPresent(allocator -> {
            String allocatorSubject = "Reminder: Asset Return Due for Employee " + employee.getEmployeeId();
            String allocatorBody = String.format(
                "Dear %s,\n\n" +
                "This is a reminder that an asset allocated by you is due for return.\n\n" +
                "Allocation details:\n" +
                "- Employee: %s %s (%s)\n" +
                "- Asset Tag: %s\n" +
                "- Model: %s\n" +
                "- Expected Return Date: %s\n\n" +
                "Please coordinate with the employee to ensure the return process is completed in the Asset Management module.\n\n" +
                "Best regards,\n" +
                "IT Asset Management System",
                allocator.getFirstName(), employee.getFirstName(), employee.getLastName(), 
                employee.getEmployeeId(), assetTag, assetName, formattedReturnDate
            );

            if (allocator.getEmail() != null && !allocator.getEmail().isEmpty()) {
                emailService.sendEmail(allocator.getEmail(), allocatorSubject, allocatorBody);
            }
            notificationService.sendWorkflowNotification(allocator.getEmployeeId(), 
                "Reminder: Asset " + assetTag + " held by " + employee.getEmployeeId() + " is due for return on " + formattedReturnDate);
        });
    }

    private String getDynamicValueCaseInsensitive(java.util.Map<String, String> map, String key) {
        if (map == null || key == null) return null;
        return map.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(key))
                .map(map::get)
                .findFirst()
                .orElse(null);
    }
}
