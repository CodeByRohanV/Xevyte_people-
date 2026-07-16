package com.register.example.controller;

import com.register.example.entity.Notification;
import com.register.example.service.NotificationService; // Use the unified service

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    
    // REMOVE @Autowired private ClaimService claimService;
    
    // 1. Inject the Unified NotificationService
    @Autowired
    private NotificationService notificationService;

    // 2. Delegate the combined retrieval logic
    @GetMapping("/{employeeId}")
    public List<Notification> getNotifications(@PathVariable String employeeId) {
        // This method now returns notifications from ALL integrated modules
        return notificationService.getAllNotifications(employeeId);
    }
    
    // 3. Delegate the unified mark as read logic
    @PostMapping("/read/{id}")
    public String markAsRead(@PathVariable Long id) {
        // This method now checks all modules to mark the notification as read
        return notificationService.markNotificationAsRead(id);
    } 
}

