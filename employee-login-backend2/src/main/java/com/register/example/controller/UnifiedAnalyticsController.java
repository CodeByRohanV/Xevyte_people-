package com.register.example.controller;

import com.register.example.dto.ScalozAnalyticsHubDTO;
import com.register.example.service.UnifiedAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/data/metrics")
@CrossOrigin(origins = "*")
public class UnifiedAnalyticsController {

    @Autowired
    private UnifiedAnalyticsService unifiedAnalyticsService;

    @GetMapping("/hub")
    public ResponseEntity<Object> getAnalyticsHub(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String employeeId = auth.getName();

        ScalozAnalyticsHubDTO hubDTO = unifiedAnalyticsService.getUnifiedAnalytics(employeeId, startDate, endDate);
        return ResponseEntity.ok(hubDTO);
    }
}
