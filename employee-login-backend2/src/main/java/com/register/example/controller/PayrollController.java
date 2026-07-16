package com.register.example.controller;

import com.register.example.entity.Payslip;
import com.register.example.service.PayrollService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.register.example.repository.SalaryConfigurationRepository;
import com.register.example.repository.PayslipRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*", exposedHeaders = "Content-Disposition")

public class PayrollController {

    private static final String CONST_MESSAGE = "message";
    private static final String CONST_COUNT = "count";
    private static final String CONST_ERROR = "error";

    @Autowired
    private PayrollService payrollService;
    @Autowired
    private SalaryConfigurationRepository salaryConfigRepository;
    @Autowired
    private PayslipRepository payslipRepository;



    // =============================================================
    // 1. Generate payslips for ALL employees
    // =============================================================
    @PostMapping("/generate-payslips")
    public ResponseEntity<Object> generatePayslipsForAll(@RequestBody Map<String, Object> body) {
        try {
            String month = body.get("month").toString();
            Integer year = Integer.parseInt(body.get("year").toString());

            List<Payslip> list = payrollService.generatePayslipsForAllEmployees(month, year);

            return ResponseEntity.ok(Map.of(
                    CONST_MESSAGE, "Payslips generated successfully",
                    CONST_COUNT, list.size(),
                    "payslips", list  // ✅ frontend expects "payslips"
            ));

        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of(CONST_ERROR, ex.getMessage()));
        }
    }

    // =============================================================
    // 2. Generate payslip for single employee
    // =============================================================
    @PostMapping("/generate-payslip/{employeeId}")
    public ResponseEntity<Object> generatePayslipForEmployee(
            @PathVariable String employeeId,
            @RequestBody Map<String, Object> body) {

        try {
            String month = body.get("month").toString();
            Integer year = Integer.parseInt(body.get("year").toString());

            Payslip saved = payrollService.generatePayslipForEmployee(employeeId, month, year);
            return ResponseEntity.ok(saved);

        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of(CONST_ERROR, ex.getMessage()));
        }
    }

    // =============================================================
    // 3. Get ALL payslips
    // =============================================================
    @GetMapping("/payslips")
    public ResponseEntity<List<Payslip>> getAllPayslips() {
        return ResponseEntity.ok(payrollService.getAllPayslips());
    }

    // =============================================================
    // 4. Get payslip by ID
    // =============================================================
    @GetMapping("/payslips/{id}")
    public ResponseEntity<Object> getPayslipById(@PathVariable Long id) {
        Optional<Payslip> p = payrollService.getPayslipById(id);
        if (p.isPresent()) {
            return ResponseEntity.ok(p.get());
        }
        return ResponseEntity.notFound().build();
    }

    // =============================================================
    // 5. Get payslips by Employee
    // =============================================================
    @GetMapping("/payslips/employee/{employeeId}")
    public ResponseEntity<List<Payslip>> getPayslipsByEmployee(
            @PathVariable String employeeId) {
        if (employeeId.contains(",")) {
            List<String> ids = Arrays.stream(employeeId.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            return ResponseEntity.ok(payrollService.getPayslipsByEmployees(ids));
        }
        return ResponseEntity.ok(payrollService.getPayslipsByEmployee(employeeId.trim()));
    }

    // =============================================================
    // 6. Get payslips by Month / Year
    // =============================================================
    @GetMapping("/payslips/month/{month}/year/{year}")
    public ResponseEntity<List<Payslip>> getPayslipsByMonthYear(
            @PathVariable String month,
            @PathVariable Integer year) {
        return ResponseEntity.ok(payrollService.getPayslipsByMonthAndYear(month, year));
    }

    // =============================================================
    // 7. Download PDF
    // =============================================================
    @GetMapping("/payslip/{id}/pdf")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable Long id) {

        Optional<Payslip> p = payrollService.getPayslipById(id);

        if (p.isEmpty() || p.get().getPayslipPdf() == null) {
            return ResponseEntity.notFound().build();
        }

        Payslip payslip = p.get();
        String fileName = payslip.getPayslipPdfName() != null
                ? payslip.getPayslipPdfName()
                : "Payslip_" + payslip.getEmployeeId() + "_" +
                payslip.getSalaryMonth() + "_" + payslip.getSalaryYear() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .body(payslip.getPayslipPdf());
    }

    // =============================================================
    // 8. DELETE payslip
    // =============================================================
    @DeleteMapping("/payslips/{id}")
    public ResponseEntity<Object> deletePayslip(@PathVariable Long id) {

        try {
            payrollService.deletePayslip(id);
            return ResponseEntity.noContent().build();

        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of(CONST_ERROR, ex.getMessage()));
        }
    }

    // =============================================================
    // 9. BULK UPLOAD SALARY CONFIG
    // =============================================================
    @PostMapping("/salary-config/bulk-excel")
    public ResponseEntity<Object> uploadSalaryConfigExcel(@RequestParam("file") MultipartFile file) {
        try {
            payrollService.importSalaryConfigExcel(file);

            return ResponseEntity.ok(Map.of(
                    CONST_MESSAGE, "Salary configurations uploaded and updated successfully",
                    CONST_COUNT, "all rows"
            ));

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(CONST_ERROR, ex.getMessage()));
        }
    }

    // =============================================================
    // 10. RELEASE PAYSLIPS (EMAIL)
    // =============================================================
    @PostMapping("/release-payslips")
    public ResponseEntity<Object> releasePayslips(@RequestBody Map<String, List<Long>> request) {
        try {
            // Frontend sends: { "payslipIds": [1, 2, 3] }
            List<Long> payslipIds = request.get("payslipIds");

            if (payslipIds == null || payslipIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, "No payslip IDs provided."));
            }

            int count = payrollService.releasePayslips(payslipIds);

            return ResponseEntity.ok(Map.of(
                    CONST_MESSAGE, "Payslips released successfully.",
                    CONST_COUNT, count
            ));

        } catch (Exception e) {
            System.err.println("Error releasing payslips: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(CONST_ERROR, "Failed to release payslips: " + e.getMessage()));
        }
    }
    
 // Add imports if missing:
 // import org.springframework.http.HttpHeaders;
 // import org.springframework.http.MediaType;

 @PostMapping("/payslip/{id}/open")
 public ResponseEntity<Object> openPayslipWithPassword(
         @PathVariable Long id,
         @RequestBody Map<String, String> body
 ) {
     try {
         String password = body.get("password");
         if (password == null || password.isBlank()) {
             return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, "Password is required."));
         }

         byte[] pdf = payrollService.verifyAndGetPayslipPdf(id, password);

         String fileName = "Payslip_" + id + ".pdf"; // or derive from payslip if needed

         return ResponseEntity.ok()
                 .contentType(MediaType.APPLICATION_PDF)
                 .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                 .body(pdf);

     } catch (SecurityException se) {
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(CONST_ERROR, "Invalid password."));
     } catch (IllegalArgumentException iae) {
         return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, iae.getMessage()));
     } catch (Exception ex) {
         ex.printStackTrace();
         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                 .body(Map.of(CONST_ERROR, "Failed to open payslip: " + ex.getMessage()));
     }
 }
 
 // =============================================================
 // 11. DOWNLOAD SALARY CONFIG EXCEL TEMPLATE
 // =============================================================
 @GetMapping("/salary-config/template")
 public ResponseEntity<byte[]> downloadSalaryConfigTemplate() {
     try {
         byte[] bytes = payrollService.generateSalaryConfigTemplate();

         return ResponseEntity.ok()
                 .contentType(MediaType.parseMediaType(
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                 .header(HttpHeaders.CONTENT_DISPOSITION,
                         "attachment; filename=\"Salary_Config_Template.xlsx\"")
                 .body(bytes);

     } catch (Exception ex) {
         ex.printStackTrace();
         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                 .body(null);
     }
 }
 @GetMapping("/salary-config/exist")
 public boolean configExistsForMonthYear(
         @RequestParam String month,
         @RequestParam Integer year
 ) {
     return salaryConfigRepository.existsBySalaryMonthAndSalaryYear(month, year);
 }
 @GetMapping("/payslips/exist")
 public boolean doPayslipsExist(
         @RequestParam String month,
         @RequestParam Integer year
 ) {
     return !payslipRepository.findBySalaryMonthAndSalaryYear(month, year).isEmpty();
 }


}
