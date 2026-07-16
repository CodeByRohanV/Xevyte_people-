package com.register.example.service;

import java.text.NumberFormat;
import java.util.Locale;

import java.time.format.DateTimeFormatter;
import java.util.function.BiConsumer;
import com.register.example.entity.DailyEntry;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import java.util.Arrays; // Must be present
import java.util.List;
import java.time.LocalDate;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import com.register.example.entity.Employee;
import com.register.example.entity.Payslip;
import com.register.example.entity.SalaryConfiguration;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PayslipRepository;
import com.register.example.repository.SalaryConfigurationRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.math.RoundingMode;
import java.time.Month;
import java.util.*;

@Service
@Transactional
public class PayrollService {

    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private PayslipRepository payslipRepository;
    @Autowired
    private SalaryConfigurationRepository salaryConfigRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.register.example.repository.TenantRepository tenantRepository;

    @Autowired
    private com.register.example.repository.DailyEntryRepository dailyEntryRepository;

    @Autowired
    private com.register.example.repository.LeaveRequestRepository leaveRequestRepository;

    private BigDecimal safe(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO;
        // Salary components should not be negative - return zero for negative values
        return v.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : v;
    }

    private void drawText(PDPageContentStream cs, PDFont font, float size,
            float x, float y, String txt, String align) throws Exception {

        if (txt == null)
            txt = "";

        cs.beginText();
        cs.setFont(font, size);

        float w = font.getStringWidth(txt) / 1000 * size;

        if ("CENTER".equalsIgnoreCase(align)) {
            cs.newLineAtOffset(x - (w / 2), y);
        } else if ("RIGHT".equalsIgnoreCase(align)) {
            cs.newLineAtOffset(x - w, y);
        } else {
            cs.newLineAtOffset(x, y);
        }

        cs.showText(txt);
        cs.endText();
    }

    private List<String> getWrappedLines(String text, float width, PDFont font, float fontSize) throws IOException {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            return lines;
        }

        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();

        for (String word : words) {
            String testLine = line.length() == 0 ? word : line + " " + word;
            float w = font.getStringWidth(testLine) / 1000 * fontSize;
            if (w < width - 4) { // 4px padding
                line = new StringBuilder(testLine);
            } else {
                if (line.length() > 0)
                    lines.add(line.toString());
                line = new StringBuilder(word);
            }
        }
        if (line.length() > 0)
            lines.add(line.toString());
        return lines;
    }

    private float sum(float[] arr) {
        float s = 0;
        for (float a : arr)
            s += a;
        return s;
    }

    private String fmt(LocalDate d) {
        if (d == null)
            return "";
        return d.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
    }

    private String val(Integer i) {
        if (i == null)
            return "0";
        return i.toString();
    }

    // Updated helper to safely parse cell content into a BigDecimal
    private BigDecimal parseNum(Cell cell) {
        if (cell == null)
            return BigDecimal.ZERO;

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            }
            if (cell.getCellType() == CellType.STRING) {
                String raw = cell.getStringCellValue()
                        .replace("₹", "")
                        .replace(",", "")
                        .trim();
                return raw.isBlank() ? BigDecimal.ZERO : new BigDecimal(raw);
            }
        } catch (Exception e) {
            // Log or handle conversion error if needed
        }
        return BigDecimal.ZERO;
    }

    // --------------------------------------------------------------------
    // MAIN GENERATION FOR ONE EMPLOYEE
    // --------------------------------------------------------------------

    public Payslip generatePayslipForEmployee(String employeeId, String month, Integer year) {

        // --- 1. Fetch Existing Payslip or Create New ---
        Optional<Payslip> existingOpt = payslipRepository.findByEmployeeIdAndSalaryMonthAndSalaryYear(employeeId, month,
                year);

        Payslip p;
        if (existingOpt.isPresent()) {
            p = existingOpt.get();
            System.out.println(
                    "Updating existing payslip for Employee: " + employeeId + ", Month: " + month + ", Year: " + year);
        } else {
            p = new Payslip();
            p.setEmployeeId(employeeId);
            p.setSalaryMonth(month);
            p.setSalaryYear(year);
            p.setGeneratedDate(LocalDate.now());
            System.out.println(
                    "Generating new payslip for Employee: " + employeeId + ", Month: " + month + ", Year: " + year);
        }

        // --- 2. Fetch Salary Configuration for the specific month/year ---
        SalaryConfiguration cfg = salaryConfigRepository
                .findByEmployeeIdAndSalaryMonthAndSalaryYear(employeeId, month, year)
                .orElse(null);

        // --- 3. Validate Salary Configuration (Crucial Check) ---
        if (cfg == null ||
                cfg.getSalaryMonth() == null ||
                cfg.getSalaryYear() == null ||
                !cfg.getSalaryMonth().equalsIgnoreCase(month) ||
                !cfg.getSalaryYear().equals(year)) {

            throw new RuntimeException(
                    "❌ Cannot generate payslip for Employee: " + employeeId +
                            ". Salary configuration is missing for " + month + " " + year +
                            ". Please import or update the salary configuration before generating.");
        }

        // --- 4. Fetch Employee Details ---
        Employee emp = employeeRepository.findByEmployeeId(employeeId).orElse(null);

        if (emp != null) {

            String firstName = emp.getFirstName() != null ? emp.getFirstName().trim() : "";
            String lastName = emp.getLastName() != null ? emp.getLastName().trim() : "";

            String fullName = (firstName + " " + lastName).trim();

            p.setEmployeeName(fullName); // ✅ FIRSTNAME + LASTNAME

            p.setBankAccountNo(emp.getBankAccountNumber());
            p.setBankName(emp.getBankName());
            p.setPfNo(emp.getPfMemberId());
            p.setDesignation(emp.getRole());
            p.setDateOfJoining(emp.getJoiningDate());
            p.setLocation(emp.getWorkLocation());
            p.setTaxRegime(emp.getTaxRegime());
            p.setPfUan(emp.getUanNumber());
            p.setEsiNumber(emp.getEsiNumber());
        }

        // --- 5. Calculate Pay Days / Present Days / LOP ---
        try {
            int m = Month.valueOf(month.toUpperCase()).getValue();
            LocalDate monthStart = LocalDate.of(year, m, 1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, monthStart,
                    monthEnd);

            double payableDays = 0;
            double lopDaysTotal = 0;

            for (DailyEntry entry : entries) {
                String remarksRaw = entry.getRemarks();
                String remarks = (remarksRaw != null) ? remarksRaw.toLowerCase() : "";
                double hours = entry.getTotalHours();
                boolean isFrozen = entry.isFrozen();

                boolean isWork = hours > 0;
                boolean isWeekend = remarks.contains("weekend");
                boolean isHoliday = remarks.contains("holiday");
                boolean isLOP = (remarks.contains("lop") || remarks.contains("loss of pay"));

                boolean isPaidLeave = (!remarks.isEmpty() && !remarks.equals("-") &&
                        !isWeekend && !isHoliday && !isLOP);

                // LOGIC:
                // - Count Holidays, Weekends, and Paid Leaves ALWAYS (unless they are LOP)
                // - Count Work ONLY if Frozen (manager approved)
                if ((isHoliday || isWeekend || isPaidLeave || (isWork && isFrozen)) && !isLOP) {
                    payableDays++;
                }

                if (isLOP) {
                    lopDaysTotal++;
                }
            }

            // Cross-check with LeaveRequest table for any LOPs not in DailyEntry
            List<com.register.example.entity.LeaveRequest> leaves = leaveRequestRepository
                    .findByEmployeeIdAndStatus(employeeId, "Approved");
            for (com.register.example.entity.LeaveRequest leave : leaves) {
                if ("LOP".equalsIgnoreCase(leave.getType()) || "Loss of Pay".equalsIgnoreCase(leave.getType())) {
                    LocalDate lStart = leave.getStartDate();
                    LocalDate lEnd = leave.getEndDate();
                    for (LocalDate d = lStart; !d.isAfter(lEnd); d = d.plusDays(1)) {
                        final LocalDate currentD = d;
                        if (!d.isBefore(monthStart) && !d.isAfter(monthEnd)) {
                            boolean alreadyCounted = entries.stream()
                                    .anyMatch(e -> e.getDate().equals(currentD) &&
                                            (e.getRemarks() != null && (e.getRemarks().equalsIgnoreCase("LOP") ||
                                                    e.getRemarks().equalsIgnoreCase("Loss of Pay") ||
                                                    e.getRemarks().equalsIgnoreCase("LOSS OF PAY"))));
                            if (!alreadyCounted) {
                                lopDaysTotal++;
                            }
                        }
                    }
                }
            }

            p.setPayDays((int) payableDays);
            p.setLopDays((int) lopDaysTotal);
            p.setPresentDays(Math.max(0, (int) payableDays));

        } catch (Exception ex) {
            p.setPayDays(0);
            p.setPresentDays(0);
            p.setLopDays(0);
        }

        // --------------------------------------------------
        // --- 6. EARNINGS (Monthly amounts) ---
        // --------------------------------------------------
        BigDecimal basic = safe(cfg.getBasicDaMonthly()).compareTo(BigDecimal.ZERO) > 0 ? safe(cfg.getBasicDaMonthly())
                : safe(cfg.getBasicSalary());

        p.put("basic", basic);
        p.put("hra", safe(cfg.getHraMonthly()));
        p.put("conveyance", safe(cfg.getConveyanceMonthly()));
        p.put("food", safe(cfg.getFoodMonthly()));
        p.put("childrenEducation", safe(cfg.getChildrenSchoolMonthly()));
        p.put("driverAllowance", safe(cfg.getDriverAllowanceMonthly()));
        p.put("advanceBonus", safe(cfg.getAdvanceBonusMonthly()));
        p.put("telephone", safe(cfg.getTelephoneMonthly()));
        p.put("shiftAllowance", safe(cfg.getShiftMonthly()));
        p.put("ltc", safe(cfg.getLtcMonthly()));
        p.put("statutoryBonus", safe(cfg.getStatBonusMonthly()));
        p.put("variablePay", safe(cfg.getVariablePayMonthly()));
        p.put("specialAllowance", safe(cfg.getSplAllowanceMonthly()));
        p.put("epfEarnings", safe(cfg.getEpfEarningsMonthly()));
        p.put("nsa", safe(cfg.getNsaMonthly()));
        p.put("incentives", safe(cfg.getIncentivesMonthly()));
        p.put("joiningBonus", safe(cfg.getJoiningBonusMonthly()));
        p.put("otherEarnings", safe(cfg.getOtherEarningsMonthly()));
        p.put("leaveEncashments", safe(cfg.getLeaveEncashmentsMonthly()));
        p.put("bonus", safe(cfg.getBonusMonthly()));

        // --------------------------------------------------
        // --- 7. DEDUCTIONS (Monthly amounts) ---
        // --------------------------------------------------
        p.put("pf", safe(cfg.getPfMonthly()));
        p.put("pt", safe(cfg.getPtMonthly()));
        p.put("incomeTax", safe(cfg.getIncomeTaxMonthly()));
        p.put("medicalInsurance", safe(cfg.getMedicalInsuranceMonthly()));
        p.put("lwf", safe(cfg.getLwfMonthly()));
        p.put("esi", safe(cfg.getEsiMonthly()));
        p.put("loans", safe(cfg.getLoansMonthly()));

        // --------------------------------------------------
        // --- 8. YTD (Yearly amounts for Earnings & Deductions) ---
        // --------------------------------------------------
        p.put("basic_ytd", safe(cfg.getBasicDaYearly()));
        p.put("hra_ytd", safe(cfg.getHraYearly()));
        p.put("conveyance_ytd", safe(cfg.getConveyanceYearly()));
        p.put("food_ytd", safe(cfg.getFoodYearly()));
        p.put("childrenEducation_ytd", safe(cfg.getChildrenSchoolYearly()));
        p.put("driverAllowance_ytd", safe(cfg.getDriverAllowanceYearly()));
        p.put("advanceBonus_ytd", safe(cfg.getAdvanceBonusYearly()));
        p.put("telephone_ytd", safe(cfg.getTelephoneYearly()));
        p.put("shiftAllowance_ytd", safe(cfg.getShiftYearly()));
        p.put("ltc_ytd", safe(cfg.getLtcYearly()));
        p.put("statutoryBonus_ytd", safe(cfg.getStatBonusYearly()));
        p.put("variablePay_ytd", safe(cfg.getVariablePayYearly()));
        p.put("specialAllowance_ytd", safe(cfg.getSplAllowanceYearly()));
        p.put("epfEarnings_ytd", safe(cfg.getEpfEarningsYearly()));
        p.put("nsa_ytd", safe(cfg.getNsaYearly()));
        p.put("incentives_ytd", safe(cfg.getIncentivesYearly())); // Item 6
        p.put("joiningBonus_ytd", safe(cfg.getJoiningBonusYearly()));
        p.put("otherEarnings_ytd", safe(cfg.getOtherEarningsYearly()));
        p.put("leaveEncashments_ytd", safe(cfg.getLeaveEncashmentsYearly()));
        p.put("bonus_ytd", safe(cfg.getBonusYearly()));

        // Deductions YTD
        p.put("pf_ytd", safe(cfg.getPfYearly()));
        p.put("pt_ytd", safe(cfg.getPtYearly()));
        p.put("incomeTax_ytd", safe(cfg.getIncomeTaxYearly()));
        p.put("medicalInsurance_ytd", safe(cfg.getMedicalInsuranceYearly()));
        p.put("lwf_ytd", safe(cfg.getLwfYearly()));
        p.put("esi_ytd", safe(cfg.getEsiYearly()));
        p.put("loans_ytd", safe(cfg.getLoansYearly()));
        p.put("totalDeductions_ytd", safe(cfg.getTotalDeductionsYearly()));

        // --------------------------------------------------
        // --- 9A. Part A – Earnings YEARLY (CALCULATED) ---
        // --------------------------------------------------

        // // ===============================
        // BELOW YTD – SUMMARY VALUES (PASSTHROUGH)
        // ===============================
        p.put("pfEmployerContribution_ytd", safe(cfg.getPfEmployerContributionYearly()));
        p.put("totalGross_ytd", safe(cfg.getTotalGrossYearly()));

        p.put("incentives_ytd", safe(cfg.getIncentivesYearly()));
        p.put("netPay_ytd", safe(cfg.getNetPayYearly()));

        // --------------------------------------------------
        // --- 10. Totals / Net / TDS / LOP (Direct from Excel - NO CALCULATIONS) ---
        // --------------------------------------------------
        // User requirement: "I don't want any calculation for the values,
        // only the data should reflect as it is from the excel to payslip"

        // Use TDS value directly from config (no calculation)
        BigDecimal tds = safe(cfg.getTdsPercentage()); // This is the actual TDS amount from Excel
        p.put("tds", tds);

        // LOP Deduction - can be calculated if needed, or taken from config
        BigDecimal lopDeduction = BigDecimal.ZERO;
        if (p.getLopDays() != null && p.getLopDays() > 0 && p.getPayDays() != null && p.getPayDays() > 0) {
            // Calculate LOP based on total earnings from config
            BigDecimal totalEarningsFromConfig = safe(cfg.getBasicDaMonthly())
                    .add(safe(cfg.getHraMonthly()))
                    .add(safe(cfg.getConveyanceMonthly()))
                    .add(safe(cfg.getFoodMonthly()))
                    .add(safe(cfg.getChildrenSchoolMonthly()))
                    .add(safe(cfg.getDriverAllowanceMonthly()))
                    .add(safe(cfg.getAdvanceBonusMonthly()))
                    .add(safe(cfg.getTelephoneMonthly()))
                    .add(safe(cfg.getShiftMonthly()))
                    .add(safe(cfg.getLtcMonthly()))
                    .add(safe(cfg.getStatBonusMonthly()))
                    .add(safe(cfg.getVariablePayMonthly()))
                    .add(safe(cfg.getSplAllowanceMonthly()))
                    .add(safe(cfg.getEpfEarningsMonthly()))
                    .add(safe(cfg.getNsaMonthly()))
                    .add(safe(cfg.getIncentivesMonthly()))
                    .add(safe(cfg.getJoiningBonusMonthly()))
                    .add(safe(cfg.getOtherEarningsMonthly()))
                    .add(safe(cfg.getLeaveEncashmentsMonthly()))
                    .add(safe(cfg.getBonusMonthly()));

            BigDecimal daysInMonthBD = BigDecimal.valueOf(p.getPayDays());
            BigDecimal perDayGross = totalEarningsFromConfig.divide(daysInMonthBD, 2, RoundingMode.HALF_UP);
            lopDeduction = perDayGross.multiply(BigDecimal.valueOf(p.getLopDays())).setScale(2, RoundingMode.HALF_UP);
        }
        p.setLopDeduction(lopDeduction);
        p.put("lopDeduction", lopDeduction);

        // NEW: Monthly Projected Tax
        p.put("monthlyProjectedTax", safe(cfg.getMonthlyProjectedTaxMonthly()));

        // Use total deductions directly from config (monthly value)
        BigDecimal totalDeduction = safe(cfg.getTotalDeductionsMonthly());

        // Calculate total earnings from all monthly fields (NOW USING DIRECT EXCEL
        // VALUE)
        BigDecimal totalEarnings = safe(cfg.getPartAEarningsMonthly());

        // Set Final Monthly Totals (all from Excel data)
        p.put("totalEarnings", totalEarnings);
        p.put("totalDeductions", totalDeduction);

        // Set Yearly Totals (from Excel)
        p.put("partAEarningsYearly", safe(cfg.getPartAEarningsYearly()));
        p.put("totalDeductionsYearly", safe(cfg.getTotalDeductionsYearly()));

        // Incentives & Net Pay (Yearly) - DIRECTLY FROM EXCEL
        p.put("incentivesYearly", safe(cfg.getIncentivesYearly()));
        p.put("netPayYearly", safe(cfg.getNetPayYearly()));

        // Net Pay (Monthly) - Calculated as check, but user wants Excel values.
        // We will store it for reference, but PDF will favor requested fields.
        p.put("netPay", totalEarnings.subtract(totalDeduction));

        // --------------------------------------------------
        // --- 11. TAX VALUES (Monthly Tax Summary) ---
        // --------------------------------------------------
        p.put("incomeAfterSection10", safe(cfg.getIncomeAfterSection10()));
        p.put("professionTax", safe(cfg.getProfessionTax()));
        p.put("stdDeduction", safe(cfg.getStandardDeduction()));
        p.put("totalVIA", safe(cfg.getTotalViaDeduction()));
        p.put("taxableIncome", safe(cfg.getTaxableIncome()));
        p.put("totalTax", safe(cfg.getTotalTax()));
        p.put("cess", safe(cfg.getEducationCess()));
        p.put("taxPrevEmployer", safe(cfg.getTaxPrevEmployer()));
        p.put("taxTillDate", safe(cfg.getTaxTillDate()));
        p.put("taxToBeDeducted", safe(cfg.getTaxToBeDeducted()));
        p.put("projectedTax", safe(cfg.getProjectedTax()));

        // --------------------------------------------------
        // --- 12. Gross/Exempt/Taxable fields from config ---
        // --------------------------------------------------
        p.put("basicDaGross", safe(cfg.getBasicDaGross()));
        p.put("basicDaExempt", safe(cfg.getBasicDaExempt()));
        p.put("basicDaTaxable", safe(cfg.getBasicDaTaxable()));

        p.put("hraGross", safe(cfg.getHraGross()));
        p.put("hraExempt", safe(cfg.getHraExempt()));
        p.put("hraTaxable", safe(cfg.getHraTaxable()));

        p.put("conveyanceGross", safe(cfg.getConveyanceGross()));
        p.put("conveyanceExempt", safe(cfg.getConveyanceExempt()));
        p.put("conveyanceTaxable", safe(cfg.getConveyanceTaxable()));

        p.put("specialAllowanceGross", safe(cfg.getSpecialAllowanceGross()));
        p.put("specialAllowanceExempt", safe(cfg.getSpecialAllowanceExempt()));
        p.put("specialAllowanceTaxable", safe(cfg.getSpecialAllowanceTaxable()));

        p.put("bonusGross", safe(cfg.getBonusGross()));
        p.put("bonusExempt", safe(cfg.getBonusExempt()));
        p.put("bonusTaxable", safe(cfg.getBonusTaxable()));

        p.put("pfGross", safe(cfg.getPfGross()));
        p.put("pfExempt", safe(cfg.getPfExempt()));
        p.put("pfTaxable", safe(cfg.getPfTaxable()));

        // --------------------------------------------------
        // --- 13. Generate PDF and Save ---
        // --------------------------------------------------
        try {
            byte[] pdfBytes = generatePayslipPDF(p, emp);
            p.setPayslipPdf(pdfBytes);
            p.setPayslipPdfName("Payslip_" + employeeId + "_" + month + "_" + year + ".pdf");
            p.setPayslipPdfType("application/pdf");
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("PDF generation failed: " + e.getMessage());
        }

        return payslipRepository.saveAndFlush(p);
    }

    private String beautify(String key) {
        switch (key) {
            case "basic":
                return "Basic & DA";
            case "hra":
                return "HRA";
            case "conveyance":
                return "Conveyance";
            case "specialAllowance":
                return "Special Allowance";
            case "statutoryBonus":
                return "Statutory Bonus";
            case "telephone":
                return "Telephone & Broadband";
            case "food":
                return "Food Allowance";
            case "childrenEducation":
                return "Children Education";
            case "driverAllowance":
                return "Driver Allowance";
            case "monthlyProjectedTax":
                return "Monthly Projected Tax";
            case "advanceBonus":
                return "Advance Bonus";
            case "shiftAllowance":
                return "Shift Allowance";
            case "ltc":
                return "Leave Travel Concession";
            case "variablePay":
                return "Variable Pay";
            case "incentives":
                return "Incentives";
            case "joiningBonus":
                return "Joining Bonus";
            case "otherEarnings":
                return "Other Earnings";
            case "leaveEncashments":
                return "Leave Encashments";
            case "splAllowance":
                return "Special Allowance (Extra)";
            case "epfEarnings":
                return "EPF Earnings";
            case "nsa":
                return "NSA";
            case "bonus":
                return "Bonus";
            // Deductions
            case "pf":
                return "PF";
            case "pt":
                return "Professional Tax";
            case "incomeTax":
                return "Income Tax";
            case "medicalInsurance":
                return "Medical Insurance";
            case "lwf":
                return "LWF";
            case "esi":
                return "ESI";
            case "loans":
                return "Loans";
        }
        return key;
    }

    private String convertToWords(BigDecimal amount) {
        if (amount == null)
            return "";
        return amount.toPlainString() + " Only";
    }

    // --------------------------------------------------------------------
    // PDF GENERATION WITH BACKGROUND IMAGE TEMPLATE (FIXED)
    // --------------------------------------------------------------------
    private byte[] generatePayslipPDF(Payslip p, Employee emp) throws Exception {

        NumberFormat nf = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);

            final var FONT = PDType1Font.HELVETICA;
            final var BOLD = PDType1Font.HELVETICA_BOLD;
            final var BOLD_ITALIC = PDType1Font.HELVETICA_BOLD_OBLIQUE;

            float pageW = page.getMediaBox().getWidth();
            float pageH = page.getMediaBox().getHeight();
            float margin = 30f;
            float borderMargin = 20f;

            float x = margin;
            float y = pageH - margin; // Initial placeholder y

            String tenantId = emp != null ? emp.getTenantId() : null;
            com.register.example.entity.Tenant tenant = null;
            if (tenantId != null && !tenantId.isEmpty() && tenantRepository != null) {
                tenant = tenantRepository.findByTenantId(tenantId).orElse(null);
            }
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "Xevyte Technologies Private Limited";

            // =======================
            // ⭐ ADD COMPANY LOGO ⭐
            // =======================
            try {
                if (tenant == null || tenant.getTenantId().equalsIgnoreCase("xevyte")) {
                    String logoPath = System.getProperty("user.dir") + "/Xevyte.png";

                    PDImageXObject logo = PDImageXObject.createFromFile(logoPath, doc);

                    float logoWidth = 120f;
                    float logoHeight = 40f;

                    float logoX = margin; // 30px from left
                    float logoY = pageH - margin - 40; // aligned to top-left

                    cs.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                }

            } catch (Exception ex) {
                System.err.println("⚠ Failed to load logo: " + ex.getMessage());
            }

            // =========================================================
            // ⭐⭐ 1. COMPANY HEADER (ADJUSTED FOR TOP MARGIN) ⭐⭐
            // =========================================================
            float headerBlockY = pageH - 50; // Creates space under logo

            drawText(cs, BOLD, 13f, pageW - margin, headerBlockY,
                    resolvedCompanyName, "RIGHT");

            float headerEnd_Y;
            if (tenant != null && !tenant.getTenantId().equalsIgnoreCase("xevyte")) {
                if (tenant.getAdminEmail() != null) {
                    drawText(cs, FONT, 9f, pageW - margin, headerBlockY - 16,
                            "Contact: " + tenant.getAdminEmail(),
                            "RIGHT");
                }
                headerEnd_Y = headerBlockY - 16;
            } else {
                drawText(cs, FONT, 9f, pageW - margin, headerBlockY - 16,
                        "B No 270, 3rd Cross Road, Coffee Board Layout, Kempapura, Bengaluru, Karnataka - 560024",
                        "RIGHT");
                drawText(cs, FONT, 9f, pageW - margin, headerBlockY - 29,
                        "Ph: 080-41284021 | www.xevyte.com",
                        "RIGHT");
                headerEnd_Y = headerBlockY - 29;
            }

            // =========================================================
            // ⭐⭐ 2. ADJUSTED FULL PAGE BORDER (MOVED DOWN) ⭐⭐
            // =========================================================
            float topBorder_Y = headerEnd_Y - 15;

            cs.setLineWidth(1f);

            // Draw the main border line
            cs.moveTo(borderMargin, borderMargin);
            cs.lineTo(pageW - borderMargin, borderMargin);
            cs.lineTo(pageW - borderMargin, topBorder_Y);
            cs.lineTo(borderMargin, topBorder_Y);
            cs.closeAndStroke();

            // =========================================================
            // ⭐⭐ 3. MOVE PAYSLIP CONTENT BELOW BORDER (KEY FIX) ⭐⭐
            // =========================================================
            y = topBorder_Y - 20;

            // =========================================================
            // ⭐ EXISTING PAYSLIP TITLE
            // =========================================================
            drawText(cs, BOLD, 11f, pageW / 2, y,
                    "Payslip for the month of " + p.getSalaryMonth() + " " + p.getSalaryYear(), "CENTER");

            y -= 25;

            // =========================================================
            // ⭐ EMPLOYEE INFO TABLE BLOCK (UNCHANGED)
            // =========================================================

            float[] empColWidths = { 140, 120, 140, 120 };
            List<String[]> empRows = new ArrayList<>();

            empRows.add(new String[] { "Name", p.getEmployeeName(), "Employee No", p.getEmployeeId() });
            empRows.add(new String[] { "Joining Date", fmt(p.getDateOfJoining()), "Bank Name", p.getBankName() });
            empRows.add(new String[] { "Designation", p.getDesignation(), "Bank Account No", p.getBankAccountNo() });
            empRows.add(new String[] { "Location", p.getLocation(), "PAN Number", emp != null ? emp.getPanNo() : "" });
            empRows.add(new String[] { "Effective Work Days", val(p.getPresentDays()), "PF No", p.getPfNo() });
            empRows.add(new String[] { "LOP", val(p.getLopDays()), "PF UAN", p.getPfUan() });
            empRows.add(new String[] { "Employee Tax Regime", p.getTaxRegime(), "ESI Number", p.getEsiNumber() });

            float empTableHeight = drawTable(cs, x, y, empColWidths, empRows, FONT, 8.5f);
            y -= empTableHeight + 20;

            // =========================================================
            // ⭐ MERGED EARNINGS/DEDUCTIONS TABLE (BOLD HEADER)
            // =========================================================

            // --- Prepare Earnings Data (Left Side) ---
            List<String[]> earnData = new ArrayList<>();

            // explicit core earnings (these will appear with Amount and YTD)
            String[] explicitEarnings = {
                    "basic", "hra", "conveyance", "specialAllowance", "statutoryBonus",
                    "advanceBonus", "childrenEducation", "driverAllowance", "epfEarnings",
                    "food", "incentives", "joiningBonus", "leaveEncashments", "ltc",
                    "nsa", "otherEarnings", "shiftAllowance", "variablePay", "telephone", "bonus",
            };
            for (String k : explicitEarnings) {
                BigDecimal monthly = p.getDecimal(k);
                BigDecimal yearly = p.getDecimal(k + "_ytd");

                // Skip incentives here - will be shown in summary section
                if ("incentives".equals(k)) {
                    continue;
                }

                // Show if either monthly or yearly has value
                if ((monthly != null && monthly.compareTo(BigDecimal.ZERO) > 0) ||
                        (yearly != null && yearly.compareTo(BigDecimal.ZERO) > 0)) {
                    earnData.add(new String[] {
                            beautify(k),
                            nf.format(safe(monthly)),
                            nf.format(safe(yearly))
                    });
                }
            }

            // include any other earning keys that exist dynamically
            for (String key : p.getAllKeys()) {
                BigDecimal v = p.getDecimal(key);
                if (v == null || v.compareTo(BigDecimal.ZERO) == 0)
                    continue;
                if (isEarning(key) && !containsStatic(earnData, beautify(key)) && !key.equals("incentives")) {
                    BigDecimal ytd = p.getDecimal(key + "_ytd");
                    earnData.add(new String[] { beautify(key), nf.format(safe(v)), nf.format(safe(ytd)) });
                }
            }
            earnData.sort((a, b) -> a[0].compareToIgnoreCase(b[0]));

            // Add Part A - Earnings to the table (Last Row)
            BigDecimal partAMonthly = p.getDecimal("totalEarnings");
            BigDecimal partAYearly = p.getDecimal("partAEarningsYearly");
            earnData.add(
                    new String[] { "Part A - Earnings", nf.format(safe(partAMonthly)), nf.format(safe(partAYearly)) });

            // --- Prepare Deductions Data (Right Side) ---
            List<String[]> dedData = new ArrayList<>();

            String[] explicitDeductions = { "pf", "pt", "medicalInsurance", "lwf", "esi", "loans", "incomeTax" };

            for (String k : explicitDeductions) {
                BigDecimal monthly = p.getDecimal(k);
                BigDecimal yearly = p.getDecimal(k + "_ytd");
                if ((monthly != null && monthly.compareTo(BigDecimal.ZERO) > 0) ||
                        (yearly != null && yearly.compareTo(BigDecimal.ZERO) > 0)) {
                    dedData.add(new String[] { beautify(k), nf.format(safe(monthly)), nf.format(safe(yearly)) });
                }
            }

            for (String key : p.getAllKeys()) {
                BigDecimal v = p.getDecimal(key);
                if (v == null || v.compareTo(BigDecimal.ZERO) == 0)
                    continue;
                if (isDeduction(key) && !containsStatic(dedData, beautify(key))) {
                    BigDecimal ytd = p.getDecimal(key + "_ytd");
                    dedData.add(new String[] { beautify(key), nf.format(safe(v)), nf.format(safe(ytd)) });
                }
            }
            dedData.sort((a, b) -> a[0].compareToIgnoreCase(b[0]));

            // Add Total Deductions to the table (Last Row)
            BigDecimal totalDedMonthly = p.getDecimal("totalDeductions");
            BigDecimal totalDedYearly = p.getDecimal("totalDeductionsYearly");
            dedData.add(new String[] { "Total Deductions", nf.format(safe(totalDedMonthly)),
                    nf.format(safe(totalDedYearly)) });

            // --- Construct Merged Rows ---
            String[] edHeader = new String[] {
                    "Pay & Allowances", "Monthly", "Yearly",
                    "Deductions", "Monthly", "Yearly"
            };
            List<String[]> mergedEdBodyRows = new ArrayList<>();

            int maxItems = Math.max(earnData.size(), dedData.size());
            int earnSize = earnData.size();
            int dedSize = dedData.size();

            for (int i = 0; i < maxItems; i++) {
                String[] earnRow = (i < earnSize) ? earnData.get(i) : new String[] { "", "", "" };
                String[] dedRow = (i < dedSize) ? dedData.get(i) : new String[] { "", "", "" };

                String[] merged = new String[6];
                System.arraycopy(earnRow, 0, merged, 0, 3);
                System.arraycopy(dedRow, 0, merged, 3, 3);
                mergedEdBodyRows.add(merged);
            }

            // Compute totals YTD fallback: try p.getDecimal("totalEarnings_ytd"), else sum
            // earnings ytd

            float[] mergedEdColW = {
                    135, 68, 68, // Earnings = 271
                    115, 72, 75 // Deductions = 262
            };
            // TOTAL = 533 px ✅ SAFE

            // Draw Header Row in BOLD
            List<String[]> edHeaderRow = new ArrayList<>();
            edHeaderRow.add(edHeader);
            float headerHEd = drawTable(cs, x, y, mergedEdColW, edHeaderRow, BOLD, 8.5f);
            y -= headerHEd;

            float edH = drawTable(cs, x, y, mergedEdColW, mergedEdBodyRows, FONT, 8.5f);

            y -= (edH + 35);
            ; // Ensure gap between Main Table and Summary

            // =========================================================
            // ⭐ SUMMARY SECTION (Part A, Part B, Totals)
            // =========================================================

            float summaryStartY = y;

            // Summary Split Lists
            List<String[]> summaryLeft = new ArrayList<>();
            List<String[]> summaryRight = new ArrayList<>();

            // --- LEFT SIDE CONTENT (Earnings / Contributions) ---

            // Part B - PF Employer Contribution
            BigDecimal pfEmployer = p.getDecimal("pfEmployerContribution_ytd");
            // Always show if it's conceptually relevant or just check value like others
            if (pfEmployer != null && pfEmployer.compareTo(BigDecimal.ZERO) > 0) {
                summaryLeft.add(new String[] { "Part B – PF Employer Contribution", nf.format(safe(pfEmployer)) });
            }

            // Total Gross (A+B)
            BigDecimal totalGross = p.getDecimal("totalGross_ytd");
            if (totalGross != null && totalGross.compareTo(BigDecimal.ZERO) > 0) {
                summaryLeft.add(new String[] { "Total Gross (A+B)", nf.format(safe(totalGross)) });
            }

            // --- RIGHT SIDE CONTENT (Deductions / Net Pay) ---

            // Incentives
            BigDecimal incentives = p.getDecimal("incentivesYearly");
            if (incentives != null && incentives.compareTo(BigDecimal.ZERO) > 0) {
                summaryRight.add(new String[] { "Incentives (Yearly)", nf.format(safe(incentives)) });
            }

            // Net Pay
            BigDecimal netPay = p.getDecimal("netPayYearly");
            if (netPay != null && netPay.compareTo(BigDecimal.ZERO) > 0) {
                summaryRight.add(new String[] { "Net Pay (Yearly)", nf.format(safe(netPay)) });
            }

            // Merge Left and Right into 4-column structure
            List<String[]> mergedSummaryRows = new ArrayList<>();
            int maxSummaryItems = Math.max(summaryLeft.size(), summaryRight.size());

            for (int i = 0; i < maxSummaryItems; i++) {
                String[] left = (i < summaryLeft.size()) ? summaryLeft.get(i) : new String[] { "", "" };
                String[] right = (i < summaryRight.size()) ? summaryRight.get(i) : new String[] { "", "" };

                String[] merged = new String[4];
                merged[0] = left[0];
                merged[1] = left[1];
                merged[2] = right[0];
                merged[3] = right[1];
                mergedSummaryRows.add(merged);
            }

            // Column Widths for alignment:
            // Left: 225 (Label) + 75 (Value) = 300 (Matches Main Table Left Half:
            // 150+75+75)
            // Right: 200 (Label) + 75 (Value) = 275 (Matches Main Table Right Half:
            // 125+75+75)
            float[] summaryColW = {
                    203, 68, // Left = 271
                    187, 75 // Right = 262
            };
            // TOTAL = 533 px

            // TOTAL = 555 px

            // Draw summary table
            if (!mergedSummaryRows.isEmpty()) {
                float summaryH = drawTable(cs, x, summaryStartY, summaryColW, mergedSummaryRows, BOLD, 9f);
                y = summaryStartY - summaryH - 25;

            } else {
                y = summaryStartY;
            }

            // =========================================================
            // ⭐ ADD "TDS DETAILS" HEADING WITH BACKGROUND COLOR ⭐
            // =========================================================
            float tdsHeadingHeight = 16f;
            float tdsHeadingWidth = pageW - (2 * margin);
            float tdsHeadingX = x;
            float tdsHeadingY = y - 5; // Use Y from the end of the previous table, then subtract a small amount for
                                       // padding (instead of adding 5). This moves the header immediately below the
                                       // previous table.

            // Background Color (same as sample payslip)
            cs.setNonStrokingColor(220, 220, 220); // light grey background
            cs.addRect(tdsHeadingX, tdsHeadingY, tdsHeadingWidth, tdsHeadingHeight);
            cs.fill();

            // Border
            cs.setStrokingColor(0, 0, 0);
            cs.addRect(tdsHeadingX, tdsHeadingY, tdsHeadingWidth, tdsHeadingHeight);
            cs.stroke();

            // Reset text color to black
            cs.setNonStrokingColor(0, 0, 0);

            // Centered Title: drawText(cs, BOLD, 10f, tdsHeadingX + 5, tdsHeadingY + 4,
            // "TDS DETAILS", "LEFT");
            drawText(cs, BOLD, 10f, tdsHeadingX + (tdsHeadingWidth / 2), tdsHeadingY + 4, "TDS DETAILS", "CENTER"); // <---
                                                                                                                    // MODIFIED
                                                                                                                    // TO
                                                                                                                    // CENTER

            // Move Y below the heading box
            // y = tdsHeadingY - 20; // <--- REMOVE THIS LINE to close the gap

            y = tdsHeadingY - 10;

            // =========================================================
            // ⭐ MERGED TAX TABLE (BOLD HEADER) — 3 columns for specials
            // =========================================================

            // LEFT TABLE — special items use explicit Gross/Exempt/Taxable (from Excel ->
            // SalaryConfiguration -> payslip map)
            List<String[]> taxLeftData = new ArrayList<>();

            BiConsumer<String, String[]> addLeftTriple = (label, keys) -> {
                BigDecimal g = p.getDecimal(keys[0]);
                BigDecimal ex = p.getDecimal(keys[1]);
                BigDecimal ta = p.getDecimal(keys[2]);
                if ((g != null && g.compareTo(BigDecimal.ZERO) > 0) ||
                        (ex != null && ex.compareTo(BigDecimal.ZERO) > 0) ||
                        (ta != null && ta.compareTo(BigDecimal.ZERO) > 0)) {
                    taxLeftData
                            .add(new String[] { label, nf.format(safe(g)), nf.format(safe(ex)), nf.format(safe(ta)) });
                }
            };

            // ADD ONLY IF VALUE > 0 (explicitly using the special Gross/Exempt/Taxable
            // keys)
            addLeftTriple.accept("BASIC + DA", new String[] { "basicDaGross", "basicDaExempt", "basicDaTaxable" });
            addLeftTriple.accept("HRA", new String[] { "hraGross", "hraExempt", "hraTaxable" });
            addLeftTriple.accept("CONVEYANCE",
                    new String[] { "conveyanceGross", "conveyanceExempt", "conveyanceTaxable" });
            // Use specialAllowance keys (matching storage keys)
            addLeftTriple.accept("SPECIAL ALLOWANCE",
                    new String[] { "specialAllowanceGross", "specialAllowanceExempt", "specialAllowanceTaxable" });
            addLeftTriple.accept("BONUS", new String[] { "bonusGross", "bonusExempt", "bonusTaxable" });
            addLeftTriple.accept("PF", new String[] { "pfGross", "pfExempt", "pfTaxable" });

            // RIGHT SIDE: tax summary items (single amount)
            List<String[]> taxRightData = new ArrayList<>();

            BiConsumer<String, BigDecimal> addTaxRow = (label, value) -> {
                if (value != null && value.compareTo(BigDecimal.ZERO) > 0) {
                    taxRightData.add(new String[] { label, nf.format(safe(value)) });
                }
            };

            // ADD ONLY IF VALUE > 0
            addTaxRow.accept("Income after Section 10 Exemption", p.getDecimal("incomeAfterSection10"));
            addTaxRow.accept("Profession Tax", p.getDecimal("professionTax"));
            addTaxRow.accept("Standard Deduction", p.getDecimal("stdDeduction"));
            addTaxRow.accept("Total VI A Deduction", p.getDecimal("totalVIA"));
            addTaxRow.accept("Taxable Income", p.getDecimal("taxableIncome"));
            addTaxRow.accept("Total Tax", p.getDecimal("totalTax"));
            addTaxRow.accept("Education Cess", p.getDecimal("cess"));
            addTaxRow.accept("Tax Deducted (Previous Employer)", p.getDecimal("taxPrevEmployer"));
            addTaxRow.accept("Tax Deducted Till Date", p.getDecimal("taxTillDate"));
            addTaxRow.accept("Tax to be Deducted", p.getDecimal("taxToBeDeducted"));
            addTaxRow.accept("Monthly Projected Tax (Amount)", p.getDecimal("monthlyProjectedTax"));

            taxRightData.sort((a, b) -> a[0].compareToIgnoreCase(b[0]));

            // Construct Merged Rows for Tax Table
            String[] taxHeader = new String[] {
                    "Description", "Gross", "Exempt", "Taxable",
                    "Income Tax Deduction", "Amount"
            };
            List<String[]> mergedTaxBodyRows = new ArrayList<>();

            int maxTaxRows = Math.max(taxLeftData.size(), taxRightData.size());

            for (int i = 0; i < maxTaxRows; i++) {
                String[] left = (i < taxLeftData.size()) ? taxLeftData.get(i) : new String[] { "", "", "", "" };
                String[] right = (i < taxRightData.size()) ? taxRightData.get(i) : new String[] { "", "" };

                String[] merged = new String[6];
                System.arraycopy(left, 0, merged, 0, 4);
                System.arraycopy(right, 0, merged, 4, 2);
                mergedTaxBodyRows.add(merged);
            }

            float[] mergedTaxColW = { 130, 50, 50, 50, 185, 70 };

            // Draw Header Row in BOLD
            List<String[]> taxHeaderRow = new ArrayList<>();
            taxHeaderRow.add(taxHeader);
            float headerHTax = drawTable(cs, x, y, mergedTaxColW, taxHeaderRow, BOLD, 8.5f);
            y -= headerHTax;

            // Draw Body Rows in FONT (standard)
            float taxH = drawTable(cs, x, y, mergedTaxColW, mergedTaxBodyRows, FONT, 8.5f);

            y -= taxH + 15;

            // =========================================================
            // ⭐ TAX PAID DETAILS TABLE (ENTIRE TABLE BOLD)
            // =========================================================

            float taxPaidTableW = 350;
            float taxPaidTableX = pageW - margin - taxPaidTableW;

            List<String[]> taxPaidRows = new ArrayList<>();

            taxPaidRows.add(new String[] { "APR", "MAY", "JUN", "JUL", "AUG", "SEP" });
            taxPaidRows.add(new String[] { "OCT", "NOV", "DEC", "JAN", "FEB", "MAR" });

            float[] taxPaidColW = { 58.33f, 58.33f, 58.33f, 58.33f, 58.33f, 58.35f };

            drawText(cs, BOLD, 9f, taxPaidTableX + (taxPaidTableW / 2), y, "Tax Paid Details", "CENTER");
            y -= 12;

            float taxPaidH = drawTable(cs, taxPaidTableX, y, taxPaidColW, taxPaidRows, BOLD, 8.5f);
            y -= taxPaidH + 20;

            // =========================================================
            // ⭐ TOTALS AND NET PAY SECTION (unchanged layout)
            // =========================================================

            // float totalGrossTableW = 200;
            // float totalGrossTableX = pageW - margin - totalGrossTableW;
            //
            // List<String[]> totalRows = new ArrayList<>();
            // totalRows.add(new String[]{"Total Gross (A+B)",
            // nf.format(p.getDecimal("totalGross"))});
            // totalRows.add(new String[]{"Net Pay", nf.format(p.getDecimal("netPay"))});
            //
            // float[] totalColW = {130, 70};
            // // Drawing this totals table in BOLD for emphasis
            // float totalH = drawTable(cs, totalGrossTableX, y, totalColW, totalRows, BOLD,
            // 9f);
            //
            // y -= totalH + 15;
            //
            // // Amount In Words (aligned to the left side)
            // String amountInWords = "RUPEES AMOUNT IN WORDS ONLY (Placeholder)";
            //
            // drawText(cs, BOLD, 9f, x, y, "Amount In Words:", "LEFT");
            // drawText(cs, BOLD_ITALIC, 9f, x + 85, y, amountInWords, "LEFT");
            //
            // y -= 30;

            // =========================================================
            // ⭐ FINAL REMARKS/SIGNATURE BLOCK (MODIFIED FOR TEXT IN LINE)
            // =========================================================

            drawText(cs, BOLD, 9f, x, y, "Remarks:", "LEFT");

            y -= 15;

            // --- MODIFICATION STARTS HERE ---

            String signatureText = "This is a computer generated payslip and does not require a signature";
            final float fontSize = 7f;

            float textWidth = FONT.getStringWidth(signatureText) / 1000 * fontSize;

            float totalLineWidth = pageW - 2 * margin;

            float lineStart_X = x;

            float gapCenter_X = pageW / 2;
            float gapWidth = textWidth + 10;

            float lineEnd1_X = gapCenter_X - (gapWidth / 2);
            float lineStart2_X = gapCenter_X + (gapWidth / 2);
            // Draw border line
            cs.moveTo(lineStart_X, y);
            cs.lineTo(lineEnd1_X, y);
            cs.stroke();

            // ✅ Move text clearly BELOW the line
            float textY = y - 10; // move down by 10px (safe gap)

            drawText(
                    cs,
                    FONT,
                    fontSize,
                    gapCenter_X,
                    textY,
                    signatureText,
                    "CENTER");

            // Continue right-side line
            cs.moveTo(lineStart2_X, y);
            cs.lineTo(pageW - borderMargin, y);
            cs.stroke();

            // Move Y further down for next content
            y = textY - 10;

            // --- MODIFICATION ENDS HERE ---

            String printDate = "DD Mon YYYY, HH:MM PM (Placeholder)";

            drawText(cs, FONT, 7f, x, borderMargin + 5, "Print Date:" + printDate, "LEFT");

            // =========================================================
            // ⭐ FINISH PDF
            // =========================================================

            cs.close();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    // ======================================================================
    // ⭐⭐ ADDED HELPER: prevents duplicates from static rows
    // ======================================================================
    private boolean containsStatic(List<String[]> list, String label) {
        for (String[] r : list) {
            if (r[0].equalsIgnoreCase(label))
                return true;
        }
        return false;
    }

    // ======================================================================
    // ⭐⭐ ADDED: FIELD CATEGORY CLASSIFIERS (AUTO GROUPING)
    // ======================================================================

    private float drawTable(
            PDPageContentStream cs,
            float startX,
            float startY,
            float[] colWidth,
            List<String[]> rows,
            PDFont font,
            float fontSize) throws Exception {

        float y = startY;
        float totalTableHeight = 0;

        // horizontal line (top)
        float totalW = 0;
        for (float w : colWidth)
            totalW += w;

        cs.setLineWidth(0.5f);
        cs.moveTo(startX, y);
        cs.lineTo(startX + totalW, y);
        cs.stroke();

        for (String[] r : rows) {
            // 1. Calculate max lines for this row
            int maxLines = 1;
            List<List<String>> wrappedCells = new ArrayList<>();

            for (int i = 0; i < r.length; i++) {
                float cellW = colWidth[Math.min(i, colWidth.length - 1)];
                List<String> lines = getWrappedLines(r[i], cellW, font, fontSize);
                if (lines.isEmpty())
                    lines.add(""); // ensure at least one line (empty)
                wrappedCells.add(lines);
                maxLines = Math.max(maxLines, lines.size());
            }

            // 2. Calculate row height
            float lineHeight = fontSize + 3f;
            float rowHeight = (maxLines * lineHeight) + 6f; // + padding

            // 3. Draw Row Content
            float textY = y - lineHeight + 1; // initial text Y position
            float cellX = startX;

            for (int i = 0; i < wrappedCells.size(); i++) {
                List<String> lines = wrappedCells.get(i);
                float currentTextY = textY;
                float cellW = colWidth[Math.min(i, colWidth.length - 1)];

                for (String line : lines) {
                    // Slight X padding
                    drawText(cs, font, fontSize, cellX + 2, currentTextY - 2, line, "LEFT");
                    currentTextY -= lineHeight;
                }
                cellX += cellW;
            }

            // 4. Draw Row Bottom Border
            y -= rowHeight;
            cs.moveTo(startX, y);
            cs.lineTo(startX + totalW, y);
            cs.stroke();

            // 5. Draw Vertical Borders for this row
            float vx = startX;
            cs.moveTo(vx, y + rowHeight);
            cs.lineTo(vx, y);
            cs.stroke();

            for (float w : colWidth) {
                vx += w;
                cs.moveTo(vx, y + rowHeight);
                cs.lineTo(vx, y);
                cs.stroke();
            }

            totalTableHeight += rowHeight;
        }

        return totalTableHeight;
    }

    // --------------------------------------------------------------------
    // OTHER METHODS (Generate all, delete, filter)
    // --------------------------------------------------------------------
    public List<Payslip> getAllPayslips() {
        return payslipRepository.findAll();
    }

    public Optional<Payslip> getPayslipById(Long id) {
        return payslipRepository.findById(id);
    }

    public List<Payslip> getPayslipsByEmployee(String e) {
        return payslipRepository.findByEmployeeId(e);
    }

    public List<Payslip> getPayslipsByMonthAndYear(String m, Integer y) {
        return payslipRepository.findBySalaryMonthAndSalaryYear(m, y);
    }

    public void deletePayslip(Long id) {
        payslipRepository.deleteById(id);
    }

    private boolean printIfPositive(PDPageContentStream cs, float labelX, float valueX, float rowY,
            String label, BigDecimal value, NumberFormat nf) throws Exception {

        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0)
            return false; // skip drawing row

        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8.5f);
        cs.newLineAtOffset(labelX, rowY);
        cs.showText(label);
        cs.endText();

        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8.5f);
        cs.newLineAtOffset(valueX, rowY);
        cs.showText(nf.format(value));
        cs.endText();

        return true; // row printed successfully
    }

    // ===============================================================
    // GENERATE PAYSLIPS FOR ALL EMPLOYEES
    // ===============================================================
    public List<Payslip> generatePayslipsForAllEmployees(String month, Integer year) {

        // ===============================
        // 1) FETCH EMPLOYEE LISTS
        // ===============================
        List<Employee> dbEmployees = employeeRepository.findAll();
        Set<String> dbEmployeeIds = new HashSet<>();

        for (Employee e : dbEmployees) {
            if (e.getEmployeeId() != null && !e.getEmployeeId().trim().isEmpty()) {
                dbEmployeeIds.add(e.getEmployeeId().trim());
            }
        }

        // Optimized: Fetch only configurations that match the selected month and year
        List<SalaryConfiguration> excelConfigs = salaryConfigRepository.findBySalaryMonthAndSalaryYear(month, year);
        Set<String> excelEmployeeIds = new HashSet<>();

        for (SalaryConfiguration c : excelConfigs) {
            if (c.getEmployeeId() != null && !c.getEmployeeId().trim().isEmpty()) {
                excelEmployeeIds.add(c.getEmployeeId().trim());
            }
        }

        // ===============================
        // 2) VALIDATION BLOCK
        // ===============================

        // Rule 1: No longer strictly enforcing count mismatch to allow partial
        // generation.
        // This allows generating payslips even if configurations for some employees are
        // missing.

        // RULE 2: Filter out extra employees found in Excel not present in DB
        // Instead of failing the entire process, we just skip individuals that don't
        // exist in DB
        Set<String> validExcelEmployeeIds = new HashSet<>();
        for (String id : excelEmployeeIds) {
            if (dbEmployeeIds.contains(id)) {
                validExcelEmployeeIds.add(id);
            } else {
                System.err.println("⚠ Skipping generation for extra employee ID found in config: " + id);
            }
        }

        // Rule 3: No longer strictly enforcing missing employees to allow partial
        // generation.
        // The system will generate payslips for all employees who have a configuration.

        // RULE 4: If Excel has corrupted or null IDs
        if (excelEmployeeIds.contains("") || excelEmployeeIds.contains(null)) {
            throw new RuntimeException(
                    "❌ Invalid or blank employee IDs found in Excel. Please correct and re-upload.");
        }

        // ===============================
        // 3) Continue normal generation ONLY IF ALL VALIDATIONS PASS
        // ===============================

        List<Payslip> result = new ArrayList<>();

        for (String employeeId : validExcelEmployeeIds) {
            // Skip if already generated for this month/year
            if (payslipRepository.findByEmployeeIdAndSalaryMonthAndSalaryYear(employeeId, month, year).isPresent()) {
                continue;
            }

            Payslip payslip = generatePayslipForEmployee(employeeId, month, year);

            // ensure ID immediately generated
            payslip = payslipRepository.saveAndFlush(payslip);

            result.add(payslip);
        }

        return result;
    }

    // ===============================================================
    // IMPORT SALARY CONFIG EXCEL (FIXED: Robust Column Mapping)
    // ===============================================================
    public void importSalaryConfigExcel(MultipartFile file) throws Exception {
        InputStream is = file.getInputStream();
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            // ===============================
            // FIXED COLUMN INDICES
            // ===============================
            final int COL_EMPLOYEE_ID = 0;
            final int COL_BASIC_SALARY = 1;
            final int COL_HRA_PERCENTAGE = 2;
            final int COL_DA_PERCENTAGE = 3;
            final int COL_PF_PERCENTAGE = 4;
            final int COL_TDS_PERCENTAGE = 5;
            final int COL_PROFESSIONAL_TAX = 6;
            final int COL_SALARY_MONTH = 7;
            final int COL_SALARY_YEAR = 8;
            final int COL_SEQUENTIAL_AMOUNTS_START = 9;
            final int COL_INCOME_AFTER_SECTION10 = 72;
            final int COL_PROFESSION_TAX_AMOUNT = 73;
            final int COL_STANDARD_DEDUCTION = 74;
            final int COL_TOTAL_VIA = 75;
            final int COL_TAXABLE_INCOME = 76;
            final int COL_TOTAL_TAX = 77;
            final int COL_EDUCATION_CESS = 78;
            final int COL_TAX_PREV_EMPLOYER = 79;
            final int COL_TAX_TILL_DATE = 80;
            final int COL_TAX_TO_BE_DEDUCTED = 81;

            List<BiConsumer<SalaryConfiguration, BigDecimal>> sequentialSetters = Arrays.asList(
                    SalaryConfiguration::setBasicDaMonthly, SalaryConfiguration::setBasicDaYearly,
                    SalaryConfiguration::setHraMonthly, SalaryConfiguration::setHraYearly,
                    SalaryConfiguration::setConveyanceMonthly, SalaryConfiguration::setConveyanceYearly,
                    SalaryConfiguration::setFoodMonthly, SalaryConfiguration::setFoodYearly,
                    SalaryConfiguration::setChildrenSchoolMonthly, SalaryConfiguration::setChildrenSchoolYearly,
                    SalaryConfiguration::setDriverAllowanceMonthly, SalaryConfiguration::setDriverAllowanceYearly,
                    SalaryConfiguration::setAdvanceBonusMonthly, SalaryConfiguration::setAdvanceBonusYearly,
                    SalaryConfiguration::setTelephoneMonthly, SalaryConfiguration::setTelephoneYearly,
                    SalaryConfiguration::setShiftMonthly, SalaryConfiguration::setShiftYearly,
                    SalaryConfiguration::setLtcMonthly, SalaryConfiguration::setLtcYearly,
                    SalaryConfiguration::setStatBonusMonthly, SalaryConfiguration::setStatBonusYearly,
                    SalaryConfiguration::setVariablePayMonthly, SalaryConfiguration::setVariablePayYearly,
                    SalaryConfiguration::setIncentivesMonthly, SalaryConfiguration::setIncentivesYearly,
                    SalaryConfiguration::setJoiningBonusMonthly, SalaryConfiguration::setJoiningBonusYearly,
                    SalaryConfiguration::setOtherEarningsMonthly, SalaryConfiguration::setOtherEarningsYearly,
                    SalaryConfiguration::setLeaveEncashmentsMonthly, SalaryConfiguration::setLeaveEncashmentsYearly,
                    SalaryConfiguration::setSplAllowanceMonthly, SalaryConfiguration::setSplAllowanceYearly,
                    SalaryConfiguration::setBonusMonthly, SalaryConfiguration::setBonusYearly,
                    SalaryConfiguration::setEpfEarningsMonthly, SalaryConfiguration::setEpfEarningsYearly,
                    SalaryConfiguration::setNsaMonthly, SalaryConfiguration::setNsaYearly,
                    SalaryConfiguration::setPfMonthly, SalaryConfiguration::setPfYearly,
                    SalaryConfiguration::setPtMonthly, SalaryConfiguration::setPtYearly,
                    SalaryConfiguration::setLwfMonthly, SalaryConfiguration::setLwfYearly,
                    SalaryConfiguration::setEsiMonthly, SalaryConfiguration::setEsiYearly,
                    SalaryConfiguration::setLoansMonthly, SalaryConfiguration::setLoansYearly,
                    SalaryConfiguration::setIncomeTaxMonthly, SalaryConfiguration::setIncomeTaxYearly,
                    SalaryConfiguration::setMonthlyProjectedTaxMonthly,
                    SalaryConfiguration::setMedicalInsuranceMonthly, SalaryConfiguration::setMedicalInsuranceYearly,
                    SalaryConfiguration::setTotalDeductionsMonthly, SalaryConfiguration::setTotalDeductionsYearly,
                    SalaryConfiguration::setPartAEarningsMonthly, SalaryConfiguration::setPartAEarningsYearly,
                    SalaryConfiguration::setPfEmployerContributionYearly,
                    SalaryConfiguration::setIncentivesYearly, SalaryConfiguration::setTotalGrossYearly,
                    SalaryConfiguration::setNetPayYearly);

            List<Integer> rowsWithMissingIds = new ArrayList<>();
            int totalDataRows = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                totalDataRows++;
                String employeeId = formatter.formatCellValue(row.getCell(COL_EMPLOYEE_ID)).trim();
                if (employeeId.isBlank())
                    rowsWithMissingIds.add(i + 1);
            }

            if (!rowsWithMissingIds.isEmpty()) {
                throw new IllegalArgumentException(
                        "❌ Upload Failed: Missing Employee IDs in rows: " + rowsWithMissingIds);
            }
            if (totalDataRows == 0) {
                throw new IllegalArgumentException("❌ Upload Failed: No data rows found.");
            }

            int processedCount = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                String employeeId = formatter.formatCellValue(row.getCell(COL_EMPLOYEE_ID)).trim();
                if (employeeId.isBlank())
                    continue;

                String monthValue = formatter.formatCellValue(row.getCell(COL_SALARY_MONTH)).trim();
                String yearStr = formatter.formatCellValue(row.getCell(COL_SALARY_YEAR)).trim();
                Integer yearValue = yearStr.isBlank() ? 0 : Integer.parseInt(yearStr);

                SalaryConfiguration cfg = salaryConfigRepository
                        .findByEmployeeIdAndSalaryMonthAndSalaryYear(employeeId, monthValue, yearValue)
                        .orElse(new SalaryConfiguration(employeeId, BigDecimal.ZERO));

                cfg.setBasicSalary(parseNum(row.getCell(COL_BASIC_SALARY)));
                cfg.setHraPercentage(parseNum(row.getCell(COL_HRA_PERCENTAGE)));
                cfg.setDaPercentage(parseNum(row.getCell(COL_DA_PERCENTAGE)));
                cfg.setPfPercentage(parseNum(row.getCell(COL_PF_PERCENTAGE)));
                cfg.setTdsPercentage(parseNum(row.getCell(COL_TDS_PERCENTAGE)));
                cfg.setProfessionalTax(parseNum(row.getCell(COL_PROFESSIONAL_TAX)));
                cfg.setSalaryMonth(monthValue);
                cfg.setSalaryYear(yearValue);

                int col = COL_SEQUENTIAL_AMOUNTS_START;
                for (BiConsumer<SalaryConfiguration, BigDecimal> setter : sequentialSetters) {
                    setter.accept(cfg, parseNum(row.getCell(col++)));
                }

                cfg.setIncomeAfterSection10(parseNum(row.getCell(COL_INCOME_AFTER_SECTION10)));
                cfg.setProfessionTax(parseNum(row.getCell(COL_PROFESSION_TAX_AMOUNT)));
                cfg.setStandardDeduction(parseNum(row.getCell(COL_STANDARD_DEDUCTION)));
                cfg.setTotalViaDeduction(parseNum(row.getCell(COL_TOTAL_VIA)));
                cfg.setTaxableIncome(parseNum(row.getCell(COL_TAXABLE_INCOME)));
                cfg.setTotalTax(parseNum(row.getCell(COL_TOTAL_TAX)));
                cfg.setEducationCess(parseNum(row.getCell(COL_EDUCATION_CESS)));
                cfg.setTaxPrevEmployer(parseNum(row.getCell(COL_TAX_PREV_EMPLOYER)));
                cfg.setTaxTillDate(parseNum(row.getCell(COL_TAX_TILL_DATE)));
                cfg.setTaxToBeDeducted(parseNum(row.getCell(COL_TAX_TO_BE_DEDUCTED)));

                col = 82;
                cfg.setBasicDaGross(parseNum(row.getCell(col++)));
                cfg.setBasicDaExempt(parseNum(row.getCell(col++)));
                cfg.setBasicDaTaxable(parseNum(row.getCell(col++)));
                cfg.setHraGross(parseNum(row.getCell(col++)));
                cfg.setHraExempt(parseNum(row.getCell(col++)));
                cfg.setHraTaxable(parseNum(row.getCell(col++)));
                cfg.setConveyanceGross(parseNum(row.getCell(col++)));
                cfg.setConveyanceExempt(parseNum(row.getCell(col++)));
                cfg.setConveyanceTaxable(parseNum(row.getCell(col++)));
                cfg.setSpecialAllowanceGross(parseNum(row.getCell(col++)));
                cfg.setSpecialAllowanceExempt(parseNum(row.getCell(col++)));
                cfg.setSpecialAllowanceTaxable(parseNum(row.getCell(col++)));
                cfg.setBonusGross(parseNum(row.getCell(col++)));
                cfg.setBonusExempt(parseNum(row.getCell(col++)));
                cfg.setBonusTaxable(parseNum(row.getCell(col++)));
                cfg.setPfGross(parseNum(row.getCell(col++)));
                cfg.setPfExempt(parseNum(row.getCell(col++)));
                cfg.setPfTaxable(parseNum(row.getCell(col++)));

                salaryConfigRepository.save(cfg);
                processedCount++;
            }
            System.out.println("✅ Successfully processed " + processedCount + " salary configurations");
        }
    }

    public int releasePayslips(List<Long> payslipIds) {

        // Fetch payslips
        List<Payslip> payslips = payslipRepository.findAllById(payslipIds);

        if (payslips.isEmpty()) {
            return 0;
        }

        int sentCount = 0;

        for (Payslip p : payslips) {

            // Fetch employee email
            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(p.getEmployeeId());
            if (empOpt.isEmpty()) {
                System.err.println("⚠ No employee found for ID: " + p.getEmployeeId());
                continue;
            }

            String email = empOpt.get().getEmail();

            if (email == null || email.trim().isEmpty()) {
                System.err.println("⚠ Employee has no email: " + p.getEmployeeId());
                continue;
            }

            try {
                // Send payslip with PDF attachment
                emailService.sendPayslipEmail(p, email);
                sentCount++;

            } catch (Exception e) {
                System.err.println("❌ Failed to send payslip to: " + email + " - " + e.getMessage());
            }
        }

        return sentCount;
    }

    // Add import if missing:
    // import org.apache.pdfbox.pdmodel.PDDocument;

    public byte[] verifyAndGetPayslipPdf(Long payslipId, String userPassword) throws Exception {
        Optional<Payslip> pOpt = payslipRepository.findById(payslipId);
        if (pOpt.isEmpty()) {
            throw new IllegalArgumentException("Payslip not found for id: " + payslipId);
        }

        Payslip p = pOpt.get();
        byte[] pdfBytes = p.getPayslipPdf();

        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalStateException("Payslip PDF is not available.");
        }

        // Try to load PDF with the provided userPassword
        try (PDDocument doc = PDDocument.load(pdfBytes, userPassword)) {
            // If no exception, password is correct.
            // Optionally you can inspect doc.getNumberOfPages() or other things.
            return pdfBytes;
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException ive) {
            // Wrong password
            throw new SecurityException("Invalid password for payslip.");
        } catch (Exception ex) {
            // Some other error while trying to open the PDF
            throw new RuntimeException("Failed to validate payslip password: " + ex.getMessage(), ex);
        }
    }

    public byte[] generateSalaryConfigTemplate() throws Exception {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("SalaryConfigTemplate");

            Row header = sheet.createRow(0);

            String[] columns = new String[] {
                    "Employee ID", // 0
                    "Basic Salary", // 1
                    "HRA %", // 2
                    "DA %", // 3
                    "PF %", // 4
                    "TDS %", // 5
                    "Professional Tax", // 6
                    "Salary Month", // 7
                    "Salary Year", // 8
    
                    // Sequential Monthly/Yearly columns (starting index 9)
                    "Basic+DA (Monthly)",
                    "Basic+DA (Yearly)",
                    "HRA (Monthly)",
                    "HRA (Yearly)",
                    "Conveyance (Monthly)",
                    "Conveyance (Yearly)",
                    "Food Allowance (Monthly)",
                    "Food Allowance (Yearly)",
                    "Children Education (Monthly)",
                    "Children Education (Yearly)",
                    "Driver Allowance (Monthly)",
                    "Driver Allowance (Yearly)",
                    "Advance Bonus (Monthly)",
                    "Advance Bonus (Yearly)",
                    "Telephone & Broadband (Monthly)",
                    "Telephone & Broadband (Yearly)",
                    "Shift Allowance (Monthly)",
                    "Shift Allowance (Yearly)",
                    "Leave Travel Concession (Monthly)",
                    "Leave Travel Concession (Yearly)",
                    "Statutory Bonus (Monthly)",
                    "Statutory Bonus (Yearly)",
                    "Variable Pay (Monthly)",
                    "Variable Pay (Yearly)",
                    "Incentives (Monthly)",
                    "Incentives (Yearly)",
                    "Joining Bonus (Monthly)",
                    "Joining Bonus (Yearly)",
                    "Other earnings (Reimbursements) (Monthly)",
                    "Other earnings (Reimbursements) (Yearly)",
                    "Leave encashments (Monthly)",
                    "Leave encashments (Yearly)",
                    "Spl. Allowance (Monthly)",
                    "Spl. Allowance (Yearly)",
                    "Bonus (Monthly)",
                    "Bonus (Yearly)",
                    "EPF (Earnings) (Monthly)",
                    "EPF (Earnings) (Yearly)",
                    "NSA (Monthly)",
                    "NSA (Yearly)",
                    "PF (Monthly)",
                    "PF (Yearly)",
                    "PROF TAX (Monthly)",
                    "PROF TAX (Yearly)",
                    "LWF (Monthly)",
                    "LWF (Yearly)",
                    "ESI (Monthly)",
                    "ESI (Yearly)",
                    "Loans (Monthly)",
                    "Loans (Yearly)",
                    "Income Tax (Monthly)",
                    "Income Tax (Yearly)",
                    // NEW: Monthly Projected Tax
                    "Monthly Projected Tax (Amount)",
                    "Medical Insurance (Monthly)",
                    "Medical Insurance (Yearly)",
                    "Total Deductions (Monthly)",
                    "Total Deductions (Yearly)",
    
                    "Part A – Earnings (Monthly)",
                    "Part A – Earnings (Yearly)",
    
                    "PF – Employer Contribution (Yearly)",
                    "Incentives (Yearly)",
                    "Total Gross (A+B) (Yearly)",
                    "Net Pay (Yearly)",
    
                    "Income after Section 10 Exemption (Amount)",
                    "Profession Tax (Amount)",
                    "Standard Deduction (Amount)",
                    "Total VIA Deduction (Amount)",
                    "Taxable Income (Amount)",
                    "Total Tax (Amount)",
                    "Education Cess (Amount)",
                    "Tax Deducted (Previous Employer) (Amount)",
                    "Tax Deducted Till Date (Amount)",
                    "Tax to be Deducted (Amount)",
    
                    // ⭐ NEW 18 COLUMNS (Gross / Exempt / Taxable)
                    "Basic + DA (Gross)",
                    "Basic + DA (Exempt)",
                    "Basic + DA (Taxable)",
    
                    "HRA (Gross)",
                    "HRA (Exempt)",
                    "HRA (Taxable)",
    
                    "Conveyance (Gross)",
                    "Conveyance (Exempt)",
                    "Conveyance (Taxable)",
    
                    "Spl Allowance (Gross)",
                    "Spl Allowance (Exempt)",
                    "Spl Allowance (Taxable)",
    
                    "Bonus (Gross)",
                    "Bonus (Exempt)",
                    "Bonus (Taxable)",
    
                    "PF (Gross)",
                    "PF (Exempt)",
                    "PF (Taxable)"
            };

            for (int i = 0; i < columns.length; i++) {
                Cell c = header.createCell(i);
                c.setCellValue(columns[i]);
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        }
    }

    private boolean isEarning(String key) {
        return List.of(
                "basic", "hra", "conveyance", "food", "childrenEducation", "driverAllowance",
                "advanceBonus", "telephone", "shiftAllowance", "ltc", "statutoryBonus",
                "variablePay", "specialAllowance", "epfEarnings", "nsa", "incentives",
                "joiningBonus", "otherEarnings", "leaveEncashments", "bonus").contains(key);
    }

    private boolean isDeduction(String key) {
        return List.of(
                "pf", "pt", "incomeTax", "medicalInsurance", "lwf", "esi", "loans", "lopDeduction").contains(key);
    }

    private boolean isTaxField(String key) {
        return List.of(
                "incomeAfterSection10", "professionTax", "stdDeduction", "totalVIA",
                "taxableIncome", "totalTax", "taxPrevEmployer", "taxTillDate",
                "taxToBeDeducted", "monthlyProjectedTax").contains(key);
    }

    public List<Payslip> getPayslipsByEmployees(List<String> employeeIds) {
        return payslipRepository.findByEmployeeIdIn(employeeIds);
    }
}
