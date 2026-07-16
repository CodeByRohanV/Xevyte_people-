package com.register.example.controller;

import com.register.example.entity.Holiday;
import com.register.example.entity.LeaveRequest;
import com.register.example.payload.LeaveActionDTO;
import com.register.example.payload.LeaveRequestDTO;
import com.register.example.payload.LeaveCalculationDetailsDTO;
import com.register.example.service.HolidayService;
import com.register.example.service.LeaveAssignmentService;
import com.register.example.service.LeaveService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.register.example.entity.Employee;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.register.example.repository.LeaveRequestRepository;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;
    private final LeaveAssignmentService leaveAssignmentService;
    private final HolidayService holidayService;
    private final LeaveRequestRepository leaveRequestRepository;

    public LeaveController(
            LeaveService leaveService,
            LeaveAssignmentService leaveAssignmentService,
            HolidayService holidayService,
            LeaveRequestRepository leaveRequestRepository) {
        this.leaveService = leaveService;
        this.leaveAssignmentService = leaveAssignmentService;
        this.holidayService = holidayService;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    @PostMapping(value = "/apply", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<LeaveRequest> applyLeave(
            @RequestPart("dto") LeaveRequestDTO dto,
            @RequestPart(value = "document", required = false) MultipartFile document) throws Exception {
        return ResponseEntity.ok(leaveService.applyLeave(dto, document));
    }

    @PostMapping("/apply-with-existing-file")
    public ResponseEntity<LeaveRequest> applyLeaveWithExistingFile(@RequestBody LeaveRequestDTO dto) throws Exception {
        return ResponseEntity.ok(
                leaveService.applyLeaveWithExistingFile(dto, dto.getExistingFileName()));
    }

    @PostMapping("/submit-draft/{draftId}")
    public ResponseEntity<LeaveRequest> submitDraft(@PathVariable Long draftId, @RequestBody LeaveRequestDTO dto) {
        try {
            LeaveRequest submittedLeave = leaveService.submitDraft(draftId, dto);
            return ResponseEntity.ok(submittedLeave);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Draft with ID " + draftId + " not found.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error submitting draft.");
        }
    }

    @PostMapping("/action")
    public ResponseEntity<LeaveRequest> takeAction(@RequestBody LeaveActionDTO dto) {
        LeaveRequest result = leaveService.takeAction(dto);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/manual-deduct/{leaveId}")
    public ResponseEntity<String> manualDeduct(@PathVariable Long leaveId) {
        try {
            Optional<LeaveRequest> leaveOpt = leaveRequestRepository.findById(leaveId);
            if (leaveOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Leave request not found");
            }
            LeaveRequest leave = leaveOpt.get();
            leaveService.deductLeaves(leave);
            return ResponseEntity.ok(
                    "Deduction triggered successfully for " + leave.getType() + " - " + leave.getTotalDays() + " days");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getEmployeeLeaves(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveService.getEmployeeLeaves(employeeId));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<LeaveRequest>> getManagerLeaves(@PathVariable String managerId) {
        return ResponseEntity.ok(leaveService.getManagerLeaves(managerId));
    }

    @GetMapping("/hr/{hrId}")
    public ResponseEntity<List<LeaveRequest>> getHrLeaves(@PathVariable String hrId) {
        return ResponseEntity.ok(leaveService.getHrLeaves(hrId));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadLeaveDocument(@PathVariable Long id) throws IOException {
        Resource file = leaveService.getLeaveDocument(id);

        if (file == null || !file.exists())
            return ResponseEntity.notFound().build();

        String filename = (file.getFilename() == null || file.getFilename().trim().isEmpty())
                ? "leave_document_" + id
                : file.getFilename();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(file);
    }

    @PostMapping("/assign/{employeeId}")
    public ResponseEntity<String> assignLeaves(@PathVariable String employeeId) {
        try {
            Double assignedLeaves = leaveAssignmentService.assignLeaves(employeeId);

            return ResponseEntity.ok(
                    "Assigned " + assignedLeaves + " CL and "
                            + assignedLeaves + " SL leaves for employee " + employeeId);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body("Leaves already assigned for this employee.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error assigning leaves: " + e.getMessage());
        }
    }

    // ❌ removed duplicate balance APIs here

    @PutMapping("/cancel/{id}")
    @Transactional
    public ResponseEntity<Object> cancelLeave(@PathVariable Long id) {
        try {
            leaveService.cancelLeave(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error cancelling leave: " + e.getMessage());
        }
    }

    @GetMapping("/approved-dates/{employeeId}")
    public ResponseEntity<Map<LocalDate, String>> getApprovedLeaveDates(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveService.getApprovedLeaveDates(employeeId));
    }

    @GetMapping("/used-optional-holidays/{employeeId}")
    public ResponseEntity<List<String>> getUsedOptionalHolidays(@PathVariable String employeeId) {
        return ResponseEntity.ok(leaveService.getUsedOptionalHolidays(employeeId));
    }

    @GetMapping("/holidays")
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAll());
    }

    @PostMapping("/holidays")
    public ResponseEntity<Holiday> addHoliday(@RequestBody Holiday holiday) {
        return ResponseEntity.ok(holidayService.create(holiday));
    }

    @PutMapping("/holidays/{id}")
    public ResponseEntity<Holiday> updateHoliday(@PathVariable Long id, @RequestBody Holiday holiday) {
        return ResponseEntity.ok(holidayService.update(id, holiday));
    }

    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Long id) {
        holidayService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/holidays/{id}")
    public ResponseEntity<Holiday> getHolidayById(@PathVariable Long id) {
        return holidayService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/holidays/date/{date}")
    public ResponseEntity<Holiday> getHolidayByDate(@PathVariable String date) {
        return holidayService.getByDate(LocalDate.parse(date))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/holidays/{year}/{month}")
    public ResponseEntity<List<Holiday>> getHolidaysByMonth(@PathVariable int year, @PathVariable int month) {
        return ResponseEntity.ok(holidayService.getByMonth(year, month));
    }

    @GetMapping("/holidays/year/{year}")
    public ResponseEntity<List<Holiday>> getHolidaysByYear(@PathVariable int year) {
        return ResponseEntity.ok(holidayService.getByYear(year));
    }

    @GetMapping("/non-working-days")
    public ResponseEntity<Object> getNonWorkingDays(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            List<Holiday> holidays = holidayService.getHolidaysInDateRange(start, end);
            Set<LocalDate> holidayDates = holidays.stream()
                    .map(Holiday::getDate)
                    .collect(Collectors.toSet());

            Set<LocalDate> nonWorkingDays = IntStream
                    .range(0, (int) (end.toEpochDay() - start.toEpochDay()) + 1)
                    .mapToObj(i -> start.plusDays(i))
                    .filter(date -> date.getDayOfWeek().equals(DayOfWeek.SATURDAY) ||
                            date.getDayOfWeek().equals(DayOfWeek.SUNDAY) ||
                            holidayDates.contains(date))
                    .collect(Collectors.toSet());

            return ResponseEntity.ok(nonWorkingDays);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid date format or error processing request.");
        }
    }

    @GetMapping("/employee-name/{employeeId}")
    public ResponseEntity<String> getEmployeeName(@PathVariable String employeeId) {
        try {
            String employeeName = leaveService.getEmployeeNameById(employeeId);
            if (employeeName == null || employeeName.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Employee with ID " + employeeId + " not found.");
            }
            return ResponseEntity.ok(employeeName);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching employee name: " + e.getMessage());
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<List<LeaveRequest>> getLeavesReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String leaveType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(leaveService.getFilteredLeaves(employeeId, leaveType, status, fromDate, toDate));
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getLeaveTypes() {
        return ResponseEntity.ok(leaveService.getAllLeaveTypes());
    }

    @GetMapping("/types/config")
    public ResponseEntity<List<com.register.example.payload.LeaveTypeConfigDTO>> getLeaveTypesConfig(
            @RequestParam(required = false) String employeeId) {
        return ResponseEntity.ok(leaveService.getActiveLeaveTypesConfigs(employeeId));
    }

    @PostMapping("/type/add")
    public ResponseEntity<String> addLeaveType(@RequestParam String type) {
        leaveService.addLeaveType(type);
        return ResponseEntity.ok("Leave type added successfully");
    }

    @GetMapping("/holidays/location/{employeeId}")
    public ResponseEntity<List<Holiday>> getHolidaysByEmployeeLocation(@PathVariable String employeeId) {

        Employee employee = leaveService.getEmployeeById(employeeId);

        if (employee == null || employee.getWorkLocation() == null) {
            return ResponseEntity.badRequest().build();
        }

        String location = employee.getWorkLocation();
        List<Holiday> holidays = holidayService.getHolidaysByLocation(location);

        return ResponseEntity.ok(holidays);
    }

    @GetMapping("/calculate-preview")
    public ResponseEntity<Object> previewLeaveCalculation(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam String leaveType,
            @RequestParam(required = false, defaultValue = "false") Boolean isHalfDay,
            @RequestParam(required = false) String employeeId) {
        try {
            if (startDate == null || startDate.isEmpty() || endDate == null || endDate.isEmpty()) {
                return ResponseEntity.badRequest().body("Start date and End date are required.");
            }
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            LeaveCalculationDetailsDTO details = leaveService
                    .calculateLeaveWithDetails(employeeId, start, end, leaveType, isHalfDay);

            return ResponseEntity.ok(details);
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date format. Please use YYYY-MM-DD.");
        } catch (Exception e) {
            e.printStackTrace(); // Log the error to server console
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error calculating leave: " + e.getMessage());
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Critical error during calculation: " + t.getMessage());
        }
    }

    @GetMapping("/status-details/{id}")
    public ResponseEntity<Map<String, Object>> getLeaveStatusDetails(@PathVariable Long id) {
        return ResponseEntity.ok(leaveService.getLeaveStatusDetails(id));
    }
}
