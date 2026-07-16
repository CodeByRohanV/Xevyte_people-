package com.register.example.controller;

import com.register.example.entity.GlobalSettings;
import com.register.example.service.GlobalSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/org-chart-config")
public class OrgChartConfigController {

    private final GlobalSettingsService globalSettingsService;

    public OrgChartConfigController(GlobalSettingsService globalSettingsService) {
        this.globalSettingsService = globalSettingsService;
    }

    private static final Set<String> ALLOWED_KEYS = new HashSet<>(Arrays.asList(
        "employeeId", "designation", "aadharNo", "panNo", "address", 
        "presentAddress", "contactNo", "workLocation", "personalMail", "email", 
        "emergencyContactNumber", "gender", "dateOfBirth", "joiningDate", "bloodGroup", 
        "noticePeriod", "uanNumber", "pfMemberId", "esiNumber", "esiDispensary"
    ));

    @GetMapping("/columns")
    public ResponseEntity<List<String>> getSelectedColumns() {
        Optional<GlobalSettings> settings = globalSettingsService.getSettings("ORG_CHART_COLUMNS");
        if (settings.isPresent() && settings.get().getContent() != null && !settings.get().getContent().isEmpty()) {
            List<String> rawColumns = Arrays.asList(settings.get().getContent().split(","));
            List<String> filtered = new ArrayList<>();
            for (String col : rawColumns) {
                if (ALLOWED_KEYS.contains(col.trim())) {
                    filtered.add(col.trim());
                }
            }
            return ResponseEntity.ok(filtered);
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/columns")
    public ResponseEntity<Map<String, String>> saveSelectedColumns(@RequestBody List<String> columns) {
        List<String> filtered = new ArrayList<>();
        for (String col : columns) {
            if (col != null && ALLOWED_KEYS.contains(col.trim())) {
                filtered.add(col.trim());
            }
        }
        String content = String.join(",", filtered);
        globalSettingsService.saveOrUpdate("ORG_CHART_COLUMNS", null, content);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Org chart columns configuration saved successfully");
        return ResponseEntity.ok(response);
    }
}
