package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.Holiday;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.HolidayService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/holidays")
@CrossOrigin(origins = "*")
public class HolidayController {

    private final HolidayService holidayService;
    private final EmployeeRepository employeeRepository;

    public HolidayController(HolidayService holidayService, EmployeeRepository employeeRepository) {
        this.holidayService = holidayService;
        this.employeeRepository = employeeRepository;
    }

    // --------------------------
    // DOWNLOAD TEMPLATE
    // --------------------------
    @GetMapping("/template")
    public ResponseEntity<Resource> downloadTemplate() {
        String header = "Date,Day,Holiday\n";
        ByteArrayResource resource = new ByteArrayResource(header.getBytes());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=holiday_template.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
    }

    // --------------------------
    // UPLOAD FILE
    // --------------------------
    @PostMapping("/upload")
    public ResponseEntity<String> uploadHolidayFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("location") String location) {
        String result = holidayService.uploadHolidayFile(file, location);
        return ResponseEntity.ok(result);
    }

    // --------------------------
    // GET ALL
    // --------------------------
    @GetMapping("/all")
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }

    // --------------------------
    // GET BY LOCATION
    // --------------------------
    @GetMapping("/by-location")
    public ResponseEntity<List<Holiday>> getHolidaysByLocation(@RequestParam String location) {
        return ResponseEntity.ok(holidayService.getHolidaysByLocation(location));
    }

    // --------------------------
    // GET HOLIDAYS FOR EMPLOYEE
    // --------------------------
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Object> getHolidaysForEmployee(@PathVariable String employeeId) {

        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElse(null);

        if (emp == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Employee not found");
        }

        if (emp.getWorkLocation() == null || emp.getWorkLocation().trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Holiday> holidays = holidayService.getHolidaysByLocationAndTenant(
            emp.getWorkLocation().trim(), 
            emp.getTenantId()
        );

        return ResponseEntity.ok(holidays);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHoliday(@PathVariable Long id) {
        try {
            holidayService.delete(id);
            return ResponseEntity.ok("Holiday deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}