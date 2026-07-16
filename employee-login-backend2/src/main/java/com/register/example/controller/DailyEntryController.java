package com.register.example.controller;

import com.register.example.payload.DailyEntryDTO;
import com.register.example.payload.FreezeRequest;
import com.register.example.payload.SubmittedDateDTO;
import com.register.example.service.DailyEntryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-entry")

public class DailyEntryController {

    private static final String CONST_ERROR_PREFIX = "Error: ";
    private final DailyEntryService dailyEntryService;

    @org.springframework.beans.factory.annotation.Autowired
    private com.register.example.scheduler.TimesheetReminderScheduler timesheetReminderScheduler;

    public DailyEntryController(DailyEntryService dailyEntryService) {
        this.dailyEntryService = dailyEntryService;
    }

    @PostMapping("/submit/{employeeId}")
    public ResponseEntity<Object> submitEntry(@PathVariable String employeeId,
                                         @RequestBody DailyEntryDTO dto) {
        try {
            DailyEntryDTO saved = dailyEntryService.submitDailyEntry(employeeId, dto);
            return ResponseEntity.ok(saved);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(CONST_ERROR_PREFIX + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(CONST_ERROR_PREFIX + e.getMessage());
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<DailyEntryDTO>> getEmployeeEntries(@PathVariable String employeeId) {
        return ResponseEntity.ok(dailyEntryService.getEntriesByEmployee(employeeId));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<DailyEntryDTO>> getManagerEntries(@PathVariable String managerId) {
        return ResponseEntity.ok(dailyEntryService.getEntriesByManager(managerId));
    }

    @GetMapping("/hr/{hrId}")
    public ResponseEntity<List<DailyEntryDTO>> getHrEntries(@PathVariable String hrId) {
        return ResponseEntity.ok(dailyEntryService.getEntriesByHr(hrId));
    }

    @GetMapping("/manager/{managerId}/employee/{employeeId}")
    public ResponseEntity<List<DailyEntryDTO>> getEmployeeEntriesForManager(@PathVariable String managerId,
                                                                            @PathVariable String employeeId) {
        return ResponseEntity.ok(dailyEntryService.getEntriesByManagerAndEmployee(managerId, employeeId));
    }

    @GetMapping("/hr/{hrId}/employee/{employeeId}")
    public ResponseEntity<List<DailyEntryDTO>> getEmployeeEntriesForHr(@PathVariable String hrId,
                                                                       @PathVariable String employeeId) {
        return ResponseEntity.ok(dailyEntryService.getEntriesByHrAndEmployee(hrId, employeeId));
    }

    @GetMapping("/submitted-dates/{employeeId}")
    public ResponseEntity<List<SubmittedDateDTO>> getSubmittedDatesByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(dailyEntryService.getSubmittedDatesByEmployee(employeeId));
    }

    @GetMapping("/total-hours/{employeeId}")
    public ResponseEntity<Double> getTotalHoursByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(dailyEntryService.getTotalHoursByEmployee(employeeId));
    }

    @GetMapping("/frozen-dates/{employeeId}")
    public ResponseEntity<List<LocalDate>> getFrozenDates(@PathVariable String employeeId) {
        return ResponseEntity.ok(dailyEntryService.getFrozenDates(employeeId));
    }

    @PutMapping("/freeze")
    public ResponseEntity<Object> freezeTimesheets(@RequestBody FreezeRequest request) {
        try {
            dailyEntryService.freezeTimesheets(
                    request.getManagerId(),
                    request.getEmployeeId(),
                    request.getStartDate(),
                    request.getEndDate()
            );
            return ResponseEntity.ok("Timesheets frozen successfully for employee: " + request.getEmployeeId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(CONST_ERROR_PREFIX + e.getMessage());
        }
    }

    @PutMapping("/update/{entryId}")
    public ResponseEntity<Object> updateEntry(@PathVariable Long entryId,
                                         @RequestBody DailyEntryDTO dto) {
        try {
            // Validate entryId
            if (entryId == null || entryId <= 0) {
                return ResponseEntity.badRequest().body(CONST_ERROR_PREFIX + "Invalid entry ID. Entry ID must be a positive number.");
            }
            
            DailyEntryDTO updated = dailyEntryService.updateDailyEntry(entryId, dto);
            return ResponseEntity.ok(updated);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(CONST_ERROR_PREFIX + "Invalid entry ID format. Entry ID must be a number.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(CONST_ERROR_PREFIX + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(CONST_ERROR_PREFIX + e.getMessage());
        }
    }
    
    @PutMapping("/unfreeze")
    public ResponseEntity<Object> unfreezeTimesheets(@RequestBody FreezeRequest request) {
        try {
            dailyEntryService.unfreezeTimesheets(
                    request.getManagerId(),
                    request.getEmployeeId(),
                    request.getStartDate(),
                    request.getEndDate()
            );
            return ResponseEntity.ok("Timesheets unfrozen successfully for employee: " + request.getEmployeeId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(CONST_ERROR_PREFIX + e.getMessage());
        }
    }

    @GetMapping("/fetch-reports")
    public ResponseEntity<List<DailyEntryDTO>> getTimesheetReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {

        List<DailyEntryDTO> reports = dailyEntryService.getFilteredEntries(employeeId, clientId, projectId, status, startDate, endDate);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/trigger-reminders")
    public ResponseEntity<String> triggerReminders(@RequestParam(required = false) String date) {
        try {
            LocalDate targetDate = (date != null) ? LocalDate.parse(date) : LocalDate.now().minusDays(1);
            timesheetReminderScheduler.processDateReminders(targetDate);
            return ResponseEntity.ok("Reminders processed successfully for date: " + targetDate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error triggering reminders: " + e.getMessage());
        }
    }
}
