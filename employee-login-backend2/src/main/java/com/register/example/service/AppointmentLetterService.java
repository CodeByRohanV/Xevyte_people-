package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.text.DecimalFormat;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import com.register.example.dto.CalcComponentDTO;

@Service
public class AppointmentLetterService {

    @Autowired
    private ApplicantRepository applicantRepo;
    @Autowired
    private PreOnboardingPersonalRepository personalRepo;
    @Autowired
    private PreOnboardingAddressRepository addressRepo;
    @Autowired
    private ApplicantDocumentsRepository documentsRepo;
    @Autowired
    private PdfConversionService pdfConversionService;
    @Autowired
    private CalcStructureService calcStructureService;

    // ============================================================
    // ⭐ UNIVERSAL DATE FORMATTER — ALWAYS RETURNS dd-MM-yyyy
    // ============================================================
    private String formatToDDMMYYYY(String date) {
        if (date == null || date.trim().isEmpty())
            return "-"; 
        try {
            return LocalDate.parse(date.trim())
                    .format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e) {
            return date; // already formatted or invalid
        }
    }

    public byte[] generateAppointmentLetter(String applicantId, String appointmentLetterFileName) throws Exception {

        // 🔹 Fetch applicant details
        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found for ID: " + applicantId));

        // 🔹 Fetch pre-onboarding personal & address data
        PreOnboardingPersonalDetails personal = personalRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingPersonalDetails());
        PreOnboardingAddressDetails address = addressRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingAddressDetails());

        // 🔹 Fetch appointment letter template from DB
        String tenantId = applicant.getTenantId();
        Optional<ApplicantDocuments> templateOpt = Optional.empty();
        if (tenantId != null && !tenantId.isEmpty()) {
            templateOpt = documentsRepo
                    .findTopByTenantIdAndAppointmentLetterFileNameOrderByIdDesc(tenantId, appointmentLetterFileName);
        }
        if (templateOpt.isEmpty()) {
            templateOpt = documentsRepo
                    .findTopByAppointmentLetterFileNameOrderByIdDesc(appointmentLetterFileName);
        }

        if (templateOpt.isEmpty() || templateOpt.get().getAppointmentLetter() == null) {
            throw new RuntimeException(
                    "Appointment letter template not found in database: " + appointmentLetterFileName);
        }

        byte[] templateBytes = templateOpt.get().getAppointmentLetter();
        InputStream templateStream = new ByteArrayInputStream(templateBytes);
        XWPFDocument document = new XWPFDocument(templateStream);

        // 🔹 Fill placeholders (final formatted data)
        fillPlaceholders(document, applicant, personal, address);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.write(baos);
        document.close();
        return baos.toByteArray();
    }

    // ============================================================
    // ⭐ PDF GENERATION
    // ============================================================
    public byte[] generateAppointmentLetterPdf(String applicantId, String appointmentLetterFileName) throws Exception {
        byte[] docxBytes = generateAppointmentLetter(applicantId, appointmentLetterFileName);
        return pdfConversionService.convertToPdf(docxBytes);
    }

    // ============================================================
    // PDF GENERATION WITH CALCULATION TEMPLATE
    // ============================================================
    public byte[] generateAppointmentLetterPdf(String applicantId, String appointmentLetterFileName, Long calcTemplateId) throws Exception {
        try {
            System.out.println("===== PDF GENERATION START =====");
            byte[] docxBytes = generateAppointmentLetter(applicantId, appointmentLetterFileName, calcTemplateId);
            byte[] pdf = pdfConversionService.convertToPdf(docxBytes);
            System.out.println("PDF generated successfully");
            return pdf;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    // ============================================================
    // APPOINTMENT LETTER GENERATION WITH CALCULATION TEMPLATE
    // ============================================================
    public byte[] generateAppointmentLetter(String applicantId, String appointmentLetterFileName, Long calcTemplateId) throws Exception {
        System.out.println("===== DOCX GENERATION WITH CALC TEMPLATE START =====");
        System.out.println("Applicant ID: " + applicantId);
        System.out.println("Template Name: " + appointmentLetterFileName);
        System.out.println("Calc Template ID: " + calcTemplateId);

        // 🔹 Fetch applicant details
        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found for ID: " + applicantId));

        // 🔹 Fetch pre-onboarding personal & address data
        PreOnboardingPersonalDetails personal = personalRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingPersonalDetails());
        PreOnboardingAddressDetails address = addressRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingAddressDetails());

        // 🔹 Fetch appointment letter template from DB
        String tenantId = applicant.getTenantId();
        Optional<ApplicantDocuments> templateOpt = Optional.empty();
        if (tenantId != null && !tenantId.isEmpty()) {
            templateOpt = documentsRepo
                    .findTopByTenantIdAndAppointmentLetterFileNameOrderByIdDesc(tenantId, appointmentLetterFileName);
        }
        if (templateOpt.isEmpty()) {
            templateOpt = documentsRepo
                    .findTopByAppointmentLetterFileNameOrderByIdDesc(appointmentLetterFileName);
        }

        if (templateOpt.isEmpty() || templateOpt.get().getAppointmentLetter() == null) {
            throw new RuntimeException(
                    "Appointment letter template not found in database: " + appointmentLetterFileName);
        }

        byte[] templateBytes = templateOpt.get().getAppointmentLetter();
        InputStream templateStream = new ByteArrayInputStream(templateBytes);
        XWPFDocument document = new XWPFDocument(templateStream);

        // 🔹 Fill placeholders with calculation template
        fillPlaceholdersWithTemplate(document, applicant, personal, address, calcTemplateId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.write(baos);
        document.close();

        byte[] docxBytes = baos.toByteArray();
        System.out.println("DOCX generated successfully. Size: " + docxBytes.length);
        return docxBytes;
    }

    // ============================================================
    // ⭐ PLACEHOLDER REPLACEMENT (DATE FORMAT INCLUDED)
    // ============================================================
    private void fillPlaceholders(XWPFDocument doc,
            Applicant applicant,
            PreOnboardingPersonalDetails personal,
            PreOnboardingAddressDetails address) {
 
        String fullName = ((personal.getFirstName() != null ? personal.getFirstName() : "") + " " +
                (personal.getLastName() != null ? personal.getLastName() : "")).trim();
 
        String designation = applicant.getPosition();
        String doj = formatToDDMMYYYY(applicant.getApprovedDoj());
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        String baseLocation = applicant.getApprovedLocation();
        String noticePeriod = applicant.getNoticePeriod() != null ? applicant.getNoticePeriod() : "-";
 
        String addressValue = formatAddress(address);
 
        // ⭐ Format CTC
        double fixedCtc = 0;
        try {
            if (applicant.getFixedCtc() != null)
                fixedCtc = Double.parseDouble(applicant.getFixedCtc());
        } catch (Exception ignored) {
        }
 
        String formattedCTC = new DecimalFormat("#,##0").format(fixedCtc);
        String ctcInText = convertNumberToWords((long) fixedCtc);
 
        replaceInParagraphsAndTables(doc, currentDate, fullName, addressValue, designation, doj, baseLocation,
                formattedCTC, ctcInText, noticePeriod);
    }

    private String formatAddress(PreOnboardingAddressDetails address) {
        StringBuilder addr = new StringBuilder();
        
        if (address.getPermanentAddressLine() != null && !address.getPermanentAddressLine().isEmpty()) {
            addr.append(address.getPermanentAddressLine()).append("\n");
        }
        
        if (address.getPermanentCity() != null && !address.getPermanentCity().isEmpty()) {
            addr.append("         ").append(address.getPermanentCity()).append("\n");
        } 
 
        if (address.getPermanentState() != null || address.getPermanentPincode() != null) {
            addr.append("         ");
            
            if (address.getPermanentState() != null) {
                addr.append(address.getPermanentState());
            }
            
            if (address.getPermanentPincode() != null) {
                if (address.getPermanentState() != null) {
                    addr.append(", ");
                }
                addr.append(address.getPermanentPincode());
            }
        }
 
        String addressValue = addr.toString().trim(); 
        return addressValue.isEmpty() ? "-" : addressValue;
    }

    private void replaceInParagraphsAndTables(XWPFDocument doc, String currentDate, String fullName, String addressValue,
            String designation, String doj, String baseLocation, String formattedCTC, String ctcInText, String noticePeriod) {
        for (XWPFParagraph p : doc.getParagraphs()) {
            replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC,
                    ctcInText, noticePeriod);
        }
 
        for (XWPFTable table : doc.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph p : cell.getParagraphs()) {
                        replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation,
                                formattedCTC, ctcInText, noticePeriod);
                    }
                }
            }
        }
    }
 
    /**
     * Helper to keep the loops clean
     */
    private void replaceAllPlaceholders(XWPFParagraph p, String currentDate, String fullName, String addressValue,
            String designation, String doj, String baseLocation, String formattedCTC, String ctcInText, String noticePeriod) {
        replaceRuns(p, "{Current Date}", currentDate);
        replaceRuns(p, "{Full Name}", fullName);
        replaceRuns(p, "{Address}", addressValue);
        replaceRuns(p, "{Designation}", designation);
        replaceRuns(p, "{DOJ}", doj);
        replaceRuns(p, "{Base Location}", baseLocation);
        replaceRuns(p, "{Overall CTC}", formattedCTC);
        replaceRuns(p, "{Overall CTC in text}", ctcInText);
        replaceRuns(p, "{notice_period}", noticePeriod);
    }
 
    // ============================================================
    // ⭐ Replace Placeholder in Word Runs (Updated for Multi-line)
    // ============================================================
    private void replaceRuns(XWPFParagraph paragraph, String placeholder, String value) {
        if (paragraph.getRuns() == null || paragraph.getRuns().isEmpty())
            return;
 
        String fullContent = getParagraphText(paragraph);
        if (!fullContent.contains(placeholder))
            return;
 
        if ("{Current Date}".equals(placeholder)) {
            paragraph.setAlignment(ParagraphAlignment.RIGHT);
        }
 
        String replaced = fullContent.replace(placeholder, value != null ? value : "");
 
        XWPFRun styleRun = paragraph.getRuns().get(0);
        
        // Extract styles before removing the runs
        String font = styleRun != null ? styleRun.getFontFamily() : null;
        int size = styleRun != null ? styleRun.getFontSize() : -1;
        boolean bold = styleRun != null && styleRun.isBold();
        boolean italic = styleRun != null && styleRun.isItalic();
        String color = styleRun != null ? styleRun.getColor() : null;
 
        // Clear all old runs
        for (int i = paragraph.getRuns().size() - 1; i >= 0; i--) {
            paragraph.removeRun(i);
        }
 
        XWPFRun newRun = paragraph.createRun();
        addNewRunsWithBreaks(newRun, replaced);
        
        // Apply extracted styles
        if (font != null)
            newRun.setFontFamily(font);
        if (size > 0)
            newRun.setFontSize(size);
        newRun.setBold(bold);
        newRun.setItalic(italic);
        if (color != null)
            newRun.setColor(color);
    }

    private String getParagraphText(XWPFParagraph paragraph) {
        StringBuilder text = new StringBuilder();
        for (XWPFRun run : paragraph.getRuns()) {
            if (run.getText(0) != null) {
                text.append(run.getText(0));
            }
        }
        return text.toString();
    }

    private void addNewRunsWithBreaks(XWPFRun newRun, String replaced) {
        if (replaced.contains("\n")) {
            String[] lines = replaced.split("\n");
            for (int i = 0; i < lines.length; i++) {
                newRun.setText(lines[i]);
                if (i < lines.length - 1) {
                    newRun.addBreak();
                }
            }
        } else {
            newRun.setText(replaced);
        }
    }

    // ============================================================
    // ⭐ Number → Words
    // ============================================================
    private String convertNumberToWords(long number) {
        if (number == 0)
            return "Zero Rupees Only";

        String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine" };
        String[] teens = { "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
                "Seventeen", "Eighteen", "Nineteen" };
        String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
                "Eighty", "Ninety" };

        StringBuilder words = new StringBuilder();

        if (number / 100000 > 0) {
            words.append(convertNumberToWords(number / 100000)).append(" Lakh ");
            number %= 100000;
        }
        if (number / 1000 > 0) {
            words.append(convertNumberToWords(number / 1000)).append(" Thousand ");
            number %= 1000;
        }
        if (number / 100 > 0) {
            words.append(convertNumberToWords(number / 100)).append(" Hundred ");
            number %= 100;
        }
        if (number > 0) {
            if (number < 10) 
                words.append(units[(int) number]);
            else if (number < 20)
                words.append(teens[(int) (number - 10)]);
            else
                words.append(tens[(int) (number / 10)]).append(" ")
                        .append(units[(int) (number % 10)]);
        }

        return words.toString().trim() + " Rupees Only";
    }

    // ============================================================
    // FILL PLACEHOLDERS WITH CALCULATION TEMPLATE
    // ============================================================
    private void fillPlaceholdersWithTemplate(XWPFDocument doc,
            Applicant applicant,
            PreOnboardingPersonalDetails personal,
            PreOnboardingAddressDetails address,
            Long calcTemplateId) {

        String fullName = ((personal.getFirstName() != null ? personal.getFirstName() : "") + " " +
                (personal.getLastName() != null ? personal.getLastName() : "")).trim();

        String designation = applicant.getPosition();
        String doj = formatToDDMMYYYY(applicant.getApprovedDoj());
        String baseLocation = applicant.getApprovedLocation();
        String noticePeriod = applicant.getNoticePeriod() != null ? applicant.getNoticePeriod() : "-";

        String addressValue = formatAddress(address);

        // Get CTC from fixed_ctc + variable_pay
        double fixedCtc = parseDoubleSafe(applicant.getFixedCtc());
        double variablePay = parseDoubleSafe(applicant.getVariablePay());
        double totalCtc = fixedCtc + variablePay;
        String formattedCTC = new DecimalFormat("#,##0").format(totalCtc);
        String ctcInText = convertNumberToWords((long) totalCtc);
        
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        // REPLACE ALL PLACEHOLDERS IN PARAGRAPHS
        for (XWPFParagraph p : doc.getParagraphs()) {
            replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC, ctcInText, noticePeriod);
        }

        // REPLACE ALL PLACEHOLDERS IN TABLES
        for (XWPFTable table : doc.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph p : cell.getParagraphs()) {
                        replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC, ctcInText, noticePeriod);
                    }
                }
            }

            // Fill the CTC table logic with calculation template
            if (table.getText().toLowerCase().contains("earnings") &&
                    table.getText().toLowerCase().contains("deductions")) {
                double applicantCtc = parseDoubleSafe(applicant.getFixedCtc());
                fillCtcTableFromTemplate(table, calcTemplateId, applicantCtc);
            }
        }
    }

    // ============================================================
    // FILL CTC TABLE FROM CALCULATION TEMPLATE
    // ============================================================
    private void fillCtcTableFromTemplate(XWPFTable table, Long calcTemplateId, double baseValue) {
        // Get the calculation structure with executed components (resolves formulas)
        var structureDTO = calcStructureService.executeCalculation(calcTemplateId, baseValue);

        if (structureDTO == null || structureDTO.getComponents() == null || structureDTO.getComponents().isEmpty()) {
            throw new RuntimeException("No components found in calculation template: " + calcTemplateId);
        }

        // Clear existing table rows except header
        while (table.getNumberOfRows() > 1) {
            table.removeRow(1);
        }

        // Separate Earnings and Deductions for side-by-side display
        List<CalcComponentDTO> earnings = new ArrayList<>();
        List<CalcComponentDTO> deductions = new ArrayList<>();

        double totalEarningsPM = 0;
        double totalDeductionsPM = 0;

        for (var comp : structureDTO.getComponents()) {
            if ("EARNINGS".equals(comp.getSection())) {
                Double monthlyValue = comp.getComputedPerMonth();
                earnings.add(comp);
                if (monthlyValue != null) {
                    totalEarningsPM += monthlyValue;
                }
            } else if ("DEDUCTIONS".equals(comp.getSection())) {
                Double monthlyValue = comp.getComputedPerMonth();
                deductions.add(comp);
                if (monthlyValue != null) {
                    totalDeductionsPM += monthlyValue;
                }
            }
        }

        // Add computed totals to the structure for formula evaluation
        Map<String, Double> computedValues = new HashMap<>();
        computedValues.put("Monthly_Total", totalEarningsPM);
        computedValues.put("Monthly_Total".toUpperCase(), totalEarningsPM);
        computedValues.put("MONTHLY_TOTAL", totalEarningsPM);
        computedValues.put("Total_Earnings", totalEarningsPM);
        computedValues.put("Total_Earnings".toUpperCase(), totalEarningsPM);
        computedValues.put("TOTAL_EARNINGS", totalEarningsPM);
        computedValues.put("Total_Deductions", totalDeductionsPM);
        computedValues.put("Total_Deductions".toUpperCase(), totalDeductionsPM);
        computedValues.put("TOTAL_DEDUCTIONS", totalDeductionsPM);

        // Fill side-by-side rows
        int maxRows = Math.max(earnings.size(), deductions.size());
        for (int i = 0; i < maxRows; i++) {
            XWPFTableRow row = table.createRow();
            ensureColumns(row, 6); // Ensure 6 columns (Earnings Name, PM, PA, Deductions Name, PM, PA)

            // Fill Earnings column (0, 1, 2)
            if (i < earnings.size()) {
                CalcComponentDTO e = earnings.get(i);
                setCell(row, 0, e.getComponentName());
                if ("AS_APPLICABLE".equals(e.getComponentType())) {
                    setCell(row, 1, "As applicable");
                    setCell(row, 2, "As applicable");
                } else {
                    Double pm = e.getComputedPerMonth();
                    setCell(row, 1, pm != null ? pm : 0.0);
                    setCell(row, 2, pm != null ? pm * 12 : 0.0);
                }
            }

            // Fill Deductions column (3, 4, 5)
            if (i < deductions.size()) {
                CalcComponentDTO d = deductions.get(i);
                setCell(row, 3, d.getComponentName());
                if ("AS_APPLICABLE".equals(d.getComponentType())) {
                    setCell(row, 4, "As applicable");
                    setCell(row, 5, "As applicable");
                } else {
                    Double pm = d.getComputedPerMonth();
                    setCell(row, 4, pm != null ? pm : 0.0);
                    setCell(row, 5, pm != null ? pm * 12 : 0.0);
                }
            }
        }
    }

    private void setCell(XWPFTableRow row, int cellIndex, Object value) {
        ensureColumns(row, cellIndex + 1);
        XWPFTableCell cell = row.getCell(cellIndex);
        if (cell == null) return;
        
        XWPFParagraph para;
        if (cell.getParagraphs() == null || cell.getParagraphs().isEmpty()) {
            para = cell.addParagraph();
        } else {
            para = cell.getParagraphs().get(0);
            for (int i = para.getRuns().size() - 1; i >= 0; i--) {
                para.removeRun(i);
            }
        }
        
        XWPFRun run = para.createRun();
        if (value instanceof Number) {
            run.setText(new DecimalFormat("#,##0").format(value));
        } else if (value instanceof String) {
            run.setText((String) value);
        } else {
            run.setText(String.valueOf(value));
        }
    }

    private void ensureColumns(XWPFTableRow row, int requiredCells) {
        while (row.getTableCells().size() < requiredCells) {
            row.addNewTableCell();
        }
        for (XWPFTableCell cell : row.getTableCells()) {
            if (cell != null && cell.getCTTc().getTcPr() == null) {
                cell.getCTTc().addNewTcPr();
            }
        }
    }

    private double parseDoubleSafe(String value) {
        if (value == null || value.trim().isEmpty())
            return 0;
        try {
            return Double.parseDouble(value.replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return 0;
        }
    }
}
