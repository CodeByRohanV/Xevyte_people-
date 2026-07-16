//package com.register.example.controller;
//
//import com.register.example.payload.PayslipRequest;
//import com.register.example.entity.Employee;
//import com.register.example.entity.Payslip;
//import com.register.example.repository.EmployeeRepository;
//import com.register.example.repository.PayslipRepository;
//import com.register.example.service.PayslipService;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import org.apache.poi.ss.usermodel.*;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.InputStream;
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.time.format.DateTimeFormatter;
//import java.util.*;
//
//@RestController
//@RequestMapping("/api/v1/payslips")
//public class PayslipController {
//
//    private final PayslipService payslipService;
//    private final EmployeeRepository employeeRepository;
//    private final PayslipRepository payslipRepository;
//    private final ObjectMapper objectMapper = new ObjectMapper();
//
//    public PayslipController(PayslipService payslipService,
//                             EmployeeRepository employeeRepository,
//                             PayslipRepository payslipRepository) {
//        this.payslipService = payslipService;
//        this.employeeRepository = employeeRepository;
//        this.payslipRepository = payslipRepository;
//    }
//
//    // --------------------------
//    // Save Payslip (Manual UI Save)
//    // --------------------------
//    @PostMapping("/save")
//    public ResponseEntity<?> savePayslip(@RequestBody PayslipRequest r) {
//        try {
//            Payslip p = map(r);
//            p.setGeneratedOn(LocalDate.now());
//            return ResponseEntity.ok(payslipService.savePayslip(p));
//        } catch (Exception ex) {
//            ex.printStackTrace();
//            return ResponseEntity.status(500).body("Error: " + ex.getMessage());
//        }
//    }
//
//    private Payslip map(PayslipRequest r) {
//        Payslip p = new Payslip();
//
//        p.setEmployeeId(r.employeeId);
//        p.setEmployeeName(r.employeeName);
//        p.setPan(r.pan);
//        p.setPfNo(r.pfNo);
//        p.setBankAccountNo(r.bankAccountNo);
//        p.setBankName(r.bankName);
//        p.setDateOfJoining(r.dateOfJoining);
//        p.setDesignation(r.designation);
//        p.setPresentDays(r.presentDays);
//        p.setPayDays(r.payDays != null ? r.payDays : 30);
//        p.setMonthYear(r.monthYear);
//
//        p.setBasicDA(r.basicDA);
//        p.setHra(r.hra);
//        p.setConveyance(r.conveyance);
//        p.setFoodAllowance(r.foodAllowance);
//        p.setChildrenEdu(r.childrenEdu);
//        p.setDriverAllowance(r.driverAllowance);
//        p.setAdvanceBonus(r.advanceBonus);
//        p.setTelephoneBroadband(r.telephoneBroadband);
//        p.setShiftAllowance(r.shiftAllowance);
//        p.setLeaveTravel(r.leaveTravel);
//        p.setStatutoryBonus(r.statutoryBonus);
//        p.setVariablePay(r.variablePay);
//        p.setSpecialAllowance(r.specialAllowance);
//        p.setEpfEarning(r.epfEarning);
//        p.setNsa(r.nsa);
//
//        p.setPf(r.pf);
//        p.setPt(r.pt);
//        p.setIncomeTax(r.incomeTax);
//        p.setMedicalInsurance(r.medicalInsurance);
//
//        p.setExcelJson(r.excelJson);
//
//        return p;
//    }
//
//    // --------------------------
//    // Helpers
//    // --------------------------
//    private BigDecimal toBig(Row row, int index) {
//        try {
//            DataFormatter fmt = new DataFormatter();
//            String v = fmt.formatCellValue(row.getCell(index))
//                    .replace(",", "")
//                    .trim();
//            if (v.isEmpty()) return BigDecimal.ZERO;
//            return new BigDecimal(v);
//        } catch (Exception e) {
//            return BigDecimal.ZERO;
//        }
//    }
//
//    private String normalize(String s) {
//        if (s == null) return "";
//        return s
//                .replace("\u200B", "")
//                .replace("\u200C", "")
//                .replace("\u200D", "")
//                .replace("\uFEFF", "")
//                .trim()
//                .toUpperCase();
//    }
//
//    private int findColumn(Row header, String... keys) {
//        DataFormatter fmt = new DataFormatter();
//
//        for (int i = 0; i < header.getLastCellNum(); i++) {
//            String h = fmt.formatCellValue(header.getCell(i))
//                    .replace("\t", "")
//                    .replace("\u200B", "")
//                    .replace("\u200C", "")
//                    .replace("\u200D", "")
//                    .replace("\uFEFF", "")
//                    .trim()
//                    .toUpperCase();
//
//            for (String key : keys) {
//                if (key == null) continue;
//                if (h.contains(key.toUpperCase())) {
//                    return i;
//                }
//            }
//        }
//        return -1; // not found
//    }
//
//    // --------------------------
//    // Excel Upload → Auto generate payslips (store excelJson with exact headers)
//    // --------------------------
//    @PostMapping("/upload")
//    public ResponseEntity<?> uploadPayslipExcel(
//            @RequestParam("file") MultipartFile file,
//            @RequestParam(required = false) String month) {
//
//        try {
//            if (month == null || month.isBlank()) {
//                month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
//            }
//
//            if (file.isEmpty()) {
//                return ResponseEntity.badRequest().body("File is empty.");
//            }
//
//            InputStream is = file.getInputStream();
//            Workbook wb = WorkbookFactory.create(is);
//            Sheet sheet = wb.getSheetAt(0);
//            DataFormatter fmt = new DataFormatter();
//
//            Row header = sheet.getRow(0);
//            if (header == null) {
//                wb.close();
//                return ResponseEntity.badRequest().body("Excel has no header row.");
//            }
//
//            int generatedCount = 0;
//
//            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
//                Row row = sheet.getRow(r);
//                if (row == null) continue;
//
//                // Build exact header->value map for this row
//                Map<String, String> excelMap = new LinkedHashMap<>();
//                for (int c = 0; c < header.getLastCellNum(); c++) {
//                    String rawKey = fmt.formatCellValue(header.getCell(c));
//                    if (rawKey == null) rawKey = "";
//                    String key = rawKey.replace("\t", "").replace("\uFEFF", "").trim();
//                    String value = fmt.formatCellValue(row.getCell(c)).trim();
//                    excelMap.put(key, value);
//                }
//
//                // employee id detection (common header variants)
//                String empId = "";
//                // try common keys
//                List<String> idKeys = Arrays.asList("employee_id", "employee id", "emp id", "employeeid", "empid", "employee");
//                for (String k : idKeys) {
//                    for (String existingKey : excelMap.keySet()) {
//                        if (existingKey == null) continue;
//                        if (existingKey.toLowerCase().replaceAll("\\s+|\\uFEFF", "").contains(k.replaceAll("\\s+",""))) {
//                            String v = excelMap.get(existingKey);
//                            if (v != null && !v.trim().isEmpty()) {
//                                empId = v.trim();
//                                break;
//                            }
//                        }
//                    }
//                    if (!empId.isEmpty()) break;
//                }
//
//                if (empId.isEmpty()) continue; // skip rows without id
//
//                // normalize detected id
//                String normEmpId = normalize(empId);
//
//                if (payslipService.exists(normEmpId, month)) continue;
//
//                // lookup employee by id (case-insensitive)
//                Optional<Employee> empOpt = employeeRepository.findByEmployeeIdIgnoreCase(normEmpId);
//                if (!empOpt.isPresent()) {
//                    // try trimmed variations
//                    empOpt = employeeRepository.findByEmployeeIdIgnoreCase(normEmpId.replaceAll("\\s+",""));
//                }
//                if (!empOpt.isPresent()) continue;
//
//                Employee emp = empOpt.get();
//                Payslip p = new Payslip();
//
//                // EMP META
//                p.setEmployeeId(emp.getEmployeeId());
//                // if Excel has a name column, use it; otherwise fallback to DB name
//                String excelName = null;
//                for (String k : excelMap.keySet()) {
//                    if (k == null) continue;
//                    String lk = k.toLowerCase();
//                    if (lk.contains("employee name") || lk.equals("name") || lk.contains("employee")) {
//                        String v = excelMap.get(k);
//                        if (v != null && !v.trim().isEmpty()) {
//                            excelName = v.trim();
//                            break;
//                        }
//                    }
//                }
//                p.setEmployeeName(excelName != null ? excelName : emp.getName());
//                p.setPan(emp.getPanNo());
//                p.setPfNo(emp.getPfMemberId());
//                p.setBankAccountNo(emp.getBankAccountNumber());
//                p.setBankName(emp.getBankName());
//                p.setDateOfJoining(emp.getJoiningDate() != null ? emp.getJoiningDate().toString() : "");
//                p.setDesignation(emp.getRole());
//                p.setPresentDays(30);
//                p.setPayDays(30);
//                p.setMonthYear(month);
//
//                // Try to map some common numeric fields into typed columns (optional)
//                // We'll use fuzzy header matching to populate typed BigDecimal fields if possible
//                // This is best-effort — typed fields remain useful for numeric UI and calculations.
//
//                // helper: find value by header substring
//                java.util.function.Function<String[], String> findValue = (keys) -> {
//                    for (String k : excelMap.keySet()) {
//                        if (k == null) continue;
//                        String kk = k.toLowerCase();
//                        for (String keyCandidate : keys) {
//                            if (kk.contains(keyCandidate.toLowerCase())) {
//                                String v = excelMap.get(k);
//                                if (v != null && !v.trim().isEmpty()) return v.trim();
//                            }
//                        }
//                    }
//                    return "";
//                };
//
//                // parse helper
//                java.util.function.Function<String, BigDecimal> parseBd = (s) -> {
//                    try {
//                        if (s == null) return BigDecimal.ZERO;
//                        String cleaned = s.replace(",", "").replace("(", "-").replace(")", "").trim();
//                        if (cleaned.isEmpty()) return BigDecimal.ZERO;
//                        return new BigDecimal(cleaned).setScale(2, BigDecimal.ROUND_HALF_UP);
//                    } catch (Exception ex) {
//                        return BigDecimal.ZERO;
//                    }
//                };
//
//                p.setBasicDA(parseBd.apply(findValue.apply(new String[]{"basic", "dearness"})));
//                p.setHra(parseBd.apply(findValue.apply(new String[]{"hra", "house rent"})));
//                p.setConveyance(parseBd.apply(findValue.apply(new String[]{"conveyance"})));
//                p.setFoodAllowance(parseBd.apply(findValue.apply(new String[]{"food"})));
//                p.setChildrenEdu(parseBd.apply(findValue.apply(new String[]{"children", "education"})));
//                p.setDriverAllowance(parseBd.apply(findValue.apply(new String[]{"driver"})));
//                p.setAdvanceBonus(parseBd.apply(findValue.apply(new String[]{"advance", "exgratia", "bonus"})));
//                p.setTelephoneBroadband(parseBd.apply(findValue.apply(new String[]{"telephone", "broadband"})));
//                p.setShiftAllowance(parseBd.apply(findValue.apply(new String[]{"shift"})));
//                p.setLeaveTravel(parseBd.apply(findValue.apply(new String[]{"leave travel", "leave"})));
//                p.setStatutoryBonus(parseBd.apply(findValue.apply(new String[]{"statutory"})));
//                p.setVariablePay(parseBd.apply(findValue.apply(new String[]{"variable"})));
//                p.setSpecialAllowance(parseBd.apply(findValue.apply(new String[]{"spl", "special"})));
//                p.setEpfEarning(parseBd.apply(findValue.apply(new String[]{"epf"})));
//                p.setNsa(parseBd.apply(findValue.apply(new String[]{"nsa"})));
//
//                p.setPf(parseBd.apply(findValue.apply(new String[]{"pf", "provident"})));
//                p.setPt(parseBd.apply(findValue.apply(new String[]{"pt", "professional tax"})));
//                String incomeTaxRaw = findValue.apply(new String[]{"income tax", "tax"});
//                p.setIncomeTax(incomeTaxRaw == null ? "0" : incomeTaxRaw);
//                p.setMedicalInsurance(parseBd.apply(findValue.apply(new String[]{"medical", "insurance"})));
//
//                // store full excel map as JSON (preserve original headers as keys)
//                String excelJson = objectMapper.writeValueAsString(excelMap);
//                p.setExcelJson(excelJson);
//
//                // Save with computed totals
//                payslipService.savePayslip(p);
//                generatedCount++;
//            }
//
//            wb.close();
//            return ResponseEntity.ok("Payslips generated: " + generatedCount);
//
//        } catch (Exception ex) {
//            ex.printStackTrace();
//            return ResponseEntity.status(500).body("Error: " + ex.getMessage());
//        }
//    }
//
//    // --------------------------
//    // OTHER REST APIs
//    // --------------------------
//    @GetMapping("/by-employee/{employeeId}")
//    public ResponseEntity<?> getPayslipByEmployee(@PathVariable String employeeId) {
//        List<Payslip> p = payslipRepository.findByEmployeeId(employeeId);
//        if (p.isEmpty()) return ResponseEntity.notFound().build();
//        return ResponseEntity.ok(p.get(0));
//    }
//
//    @PostMapping("/generate")
//    public ResponseEntity<?> generatePayslips(@RequestParam("month") String month) {
//        int created = payslipService.generatePayslipsForMonth(month);
//        return ResponseEntity.ok(created + " payslips generated for " + month);
//    }
//
//    @GetMapping
//    public ResponseEntity<?> list(@RequestParam("month") String month,
//                                  @RequestParam(required = false) String searchName) {
//        return ResponseEntity.ok(payslipService.getPayslipsForMonth(month, searchName));
//    }
//
//    @GetMapping("/{id}")
//    public ResponseEntity<?> get(@PathVariable Long id) {
//        Payslip p = payslipService.getPayslipById(id);
//        return (p == null) ? ResponseEntity.notFound().build() : ResponseEntity.ok(p);
//    }
//
//    // GET payslip by employee + month
//    @GetMapping("/by-employee/{employeeId}/month/{month}")
//    public ResponseEntity<?> getPayslipByEmployeeAndMonth(
//            @PathVariable String employeeId,
//            @PathVariable String month) {
//
//        List<Payslip> list = payslipRepository.findByEmployeeId(employeeId);
//
//        if (list.isEmpty())
//            return ResponseEntity.notFound().build();
//
//        for (Payslip p : list) {
//            if (p.getMonthYear().equalsIgnoreCase(month)) {
//                return ResponseEntity.ok(p);
//            }
//        }
//
//        return ResponseEntity.status(404).body("No payslip found for month " + month);
//    }
//}
