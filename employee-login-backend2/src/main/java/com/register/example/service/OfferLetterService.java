package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.register.example.dto.CalcComponentDTO;

@Service
public class OfferLetterService {

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
    // UNIVERSAL DATE FORMATTER - DD-MM-YYYY
    // ============================================================
    private String formatToDDMMYYYY(String inputDate) {
        if (inputDate == null || inputDate.trim().isEmpty())
            return "-"; 

        try {
            LocalDate date = LocalDate.parse(inputDate.trim());
            return date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e) {
            return inputDate; 
        }
    }

    // ============================================================
    // MAIN OFFER LETTER GENERATION
    // ============================================================
    public byte[] generateOfferLetter(String applicantId, String offerLetterFileName) throws Exception {

        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found for ID: " + applicantId));

        PreOnboardingPersonalDetails personal = personalRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingPersonalDetails());

        PreOnboardingAddressDetails address = addressRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingAddressDetails());

        String tenantId = applicant.getTenantId();
        Optional<ApplicantDocuments> templateOpt = Optional.empty();
        if (tenantId != null && !tenantId.isEmpty()) {
            templateOpt = documentsRepo.findTopByTenantIdAndOfferLetterFileNameOrderByIdDesc(tenantId, offerLetterFileName);
        }
        if (templateOpt.isEmpty()) {
            templateOpt = documentsRepo.findTopByOfferLetterFileNameOrderByIdDesc(offerLetterFileName);
        }

        if (templateOpt.isEmpty() || templateOpt.get().getOfferLetter() == null) {
            throw new RuntimeException("Offer letter template not found: " + offerLetterFileName);
        }

        byte[] templateBytes = templateOpt.get().getOfferLetter();
        InputStream templateStream = new ByteArrayInputStream(templateBytes);
        XWPFDocument document = new XWPFDocument(templateStream);

        fillPlaceholders(document, applicant, personal, address);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.write(baos);
        document.close();

        return baos.toByteArray();
    }

    // ============================================================
    // PDF GENERATION
    // ============================================================
    public byte[] generateOfferLetterPdf(String applicantId, String offerLetterFileName) throws Exception {
        byte[] docxBytes = generateOfferLetter(applicantId, offerLetterFileName);
        return pdfConversionService.convertToPdf(docxBytes);
    } 

    // ============================================================
    // PDF GENERATION WITH CALCULATION TEMPLATE
    // ============================================================
    public byte[] generateOfferLetterPdf(String applicantId, String offerLetterFileName, Long calcTemplateId) throws Exception {
        byte[] docxBytes = generateOfferLetter(applicantId, offerLetterFileName, calcTemplateId);
        return pdfConversionService.convertToPdf(docxBytes);
    }

    // ============================================================
    // MAIN OFFER LETTER GENERATION WITH CALCULATION TEMPLATE
    // ============================================================
    public byte[] generateOfferLetter(String applicantId, String offerLetterFileName, Long calcTemplateId) throws Exception {

        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found for ID: " + applicantId));

        PreOnboardingPersonalDetails personal = personalRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingPersonalDetails());

        PreOnboardingAddressDetails address = addressRepo.findByApplicantId(applicantId)
                .orElse(new PreOnboardingAddressDetails());

        String tenantId = applicant.getTenantId();
        Optional<ApplicantDocuments> templateOpt = Optional.empty();
        if (tenantId != null && !tenantId.isEmpty()) {
            templateOpt = documentsRepo.findTopByTenantIdAndOfferLetterFileNameOrderByIdDesc(tenantId, offerLetterFileName);
        }
        if (templateOpt.isEmpty()) {
            templateOpt = documentsRepo.findTopByOfferLetterFileNameOrderByIdDesc(offerLetterFileName);
        }

        if (templateOpt.isEmpty() || templateOpt.get().getOfferLetter() == null) {
            throw new RuntimeException("Offer letter template not found: " + offerLetterFileName);
        }

        byte[] templateBytes = templateOpt.get().getOfferLetter();
        InputStream templateStream = new ByteArrayInputStream(templateBytes);
        XWPFDocument document = new XWPFDocument(templateStream);

        fillPlaceholdersWithTemplate(document, applicant, personal, address, calcTemplateId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.write(baos);
        document.close();

        return baos.toByteArray();
    } 

    // ============================================================
    // FILL PLACEHOLDERS IN DOCX TEMPLATE + DATE FORMATTING
    // ============================================================
    private void fillPlaceholders(XWPFDocument doc,
            Applicant applicant,
            PreOnboardingPersonalDetails personal,
            PreOnboardingAddressDetails address) {

        String fullName = ((personal.getFirstName() != null ? personal.getFirstName() : "") + " " +
                (personal.getLastName() != null ? personal.getLastName() : "")).trim();

        String designation = applicant.getPosition();
        String doj = formatToDDMMYYYY(applicant.getApprovedDoj());
        String baseLocation = applicant.getApprovedLocation();

        // Prepare Address in 3 lines with indentation
        StringBuilder addr = new StringBuilder();
        
        if (address.getPermanentAddressLine() != null && !address.getPermanentAddressLine().isEmpty()) {
            addr.append(address.getPermanentAddressLine()).append("\n");
        }
        
        if (address.getPermanentCity() != null && !address.getPermanentCity().isEmpty()) {
            addr.append("").append(address.getPermanentCity()).append("\n");
        }
 
        if (address.getPermanentState() != null || address.getPermanentPincode() != null) {
            addr.append(""); 
            
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
        if (addressValue.isEmpty()) addressValue = "-";

        // VARIABLE PAY & CTC CALCULATION
        double fixedCtc = parseDoubleSafe(applicant.getFixedCtc());
        double variablePay = parseDoubleSafe(applicant.getVariablePay());
        boolean hasVariablePay = variablePay > 0;

        double totalCtc = fixedCtc + variablePay;

        String formattedCTC = new DecimalFormat("#,##0").format(totalCtc);
        String ctcInText = convertNumberToWords((long) totalCtc);
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        // REPLACE ALL PLACEHOLDERS IN PARAGRAPHS
        for (XWPFParagraph p : doc.getParagraphs()) {
            replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC, ctcInText);
        }

        // REPLACE ALL PLACEHOLDERS IN TABLES
        for (XWPFTable table : doc.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph p : cell.getParagraphs()) {
                        replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC, ctcInText);
                    }
                }
            }

            // Fill the CTC table logic
            if (table.getText().toLowerCase().contains("earnings") &&
                    table.getText().toLowerCase().contains("deductions")) {
                fillCtcTable(table, fixedCtc, variablePay, hasVariablePay);
            }
        }
    }

    private void replaceAllPlaceholders(XWPFParagraph p, String currentDate, String fullName, String addressValue,
            String designation, String doj, String baseLocation, String formattedCTC, String ctcInText) {
        replaceRuns(p, "{Current Date}", currentDate);
        replaceRuns(p, "{Full Name}", fullName);
        replaceRuns(p, "{Address}", addressValue);
        replaceRuns(p, "{Designation}", designation);
        replaceRuns(p, "{DOJ}", doj);
        replaceRuns(p, "{Base Location}", baseLocation);
        replaceRuns(p, "{Overall CTC}", formattedCTC);
        replaceRuns(p, "{Overall CTC in text}", ctcInText);
    }

    // ============================================================
    // CTC TABLE LOGIC
    // ============================================================
    private void fillCtcTable(XWPFTable table, double fixedCtc, double variablePay, boolean hasVariablePay) {

        double employerPF = 1950;
        double conveyance = 1600;
        double medicalAllowance = 1250;
        double employeePF = 1800;
        double pt = 200;

        double monthlyTotal = fixedCtc / 12;
        double subTotal = monthlyTotal - employerPF;
        double basic = subTotal * 0.40;
        double hra = basic / 2;
        double specialAllowance = subTotal - (basic + hra + conveyance + medicalAllowance);

        double totalDeductions = employeePF + pt;

        for (int i = 0; i < table.getRows().size(); i++) {
            XWPFTableRow row = table.getRow(i);
            String text = row.getCell(0).getText().toLowerCase();

            if (text.contains("basic")) {
                setCell(row, 1, basic);
                setCell(row, 2, basic * 12);
            } else if (text.contains("hra")) {
                setCell(row, 1, hra);
                setCell(row, 2, hra * 12);
            } else if (text.contains("conveyance")) {
                setCell(row, 1, conveyance);
                setCell(row, 2, conveyance * 12);
            } else if (text.contains("medical")) {
                setCell(row, 1, medicalAllowance);
                setCell(row, 2, medicalAllowance * 12);
            } else if (text.contains("special")) {
                setCell(row, 1, specialAllowance);
                setCell(row, 2, specialAllowance * 12);
            } else if (text.contains("sub total")) {
                setCell(row, 1, subTotal);
                setCell(row, 2, subTotal * 12);
            } else if (text.contains("employer pf")) {
                setCell(row, 1, employerPF);
                setCell(row, 2, employerPF * 12);
            } else if (text.contains("monthly total")) {
                setCell(row, 1, monthlyTotal);
                setCell(row, 2, fixedCtc);
            } else if (text.contains("variable pay")) {
                if (!hasVariablePay) {
                    table.removeRow(i);
                    i--;
                } else {
                    setCell(row, 1, 0);
                    setCell(row, 2, variablePay);
                }
            } else if (text.contains("cost to company")) {
                double ctcFinal = fixedCtc + (hasVariablePay ? variablePay : 0);
                setCell(row, 1, 0);
                setCell(row, 2, ctcFinal);
            } else if (text.equals("pt")) {
                ensureColumns(row, 6);
                setCell(row, 4, pt);
                setCell(row, 5, pt * 12);
            } else if (text.contains("pf") && !text.contains("employer")) {
                ensureColumns(row, 6);
                setCell(row, 4, employeePF);
                setCell(row, 5, employeePF * 12);
            } else if (text.contains("total deductions")) {
                ensureColumns(row, 6);
                setCell(row, 4, totalDeductions);
                setCell(row, 5, totalDeductions * 12);
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

    private void replaceRuns(XWPFParagraph paragraph, String placeholder, String value) {
        if (paragraph.getRuns() == null || paragraph.getRuns().isEmpty())
            return;

        StringBuilder text = new StringBuilder();
        for (XWPFRun run : paragraph.getRuns()) {
            if (run.getText(0) != null)
                text.append(run.getText(0));
        }
        if (!text.toString().contains(placeholder))
            return;

        if (placeholder.equals("{Current Date}")) {
            paragraph.setAlignment(ParagraphAlignment.RIGHT);
        }

        String replaced = text.toString().replace(placeholder, value != null ? value : "");

        XWPFRun styleRun = paragraph.getRuns().get(0);
        String font = styleRun.getFontFamily();
        int size = styleRun.getFontSize();
        boolean bold = styleRun.isBold();
        boolean italic = styleRun.isItalic();
        String color = styleRun.getColor();

        for (int i = paragraph.getRuns().size() - 1; i >= 0; i--)
            paragraph.removeRun(i);

        XWPFRun newRun = paragraph.createRun();
        
        // Handle multi-line address breaks
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

        if (font != null) newRun.setFontFamily(font);
        if (size > 0) newRun.setFontSize(size);
        newRun.setBold(bold);
        newRun.setItalic(italic);
        if (color != null) newRun.setColor(color);
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

    private String convertNumberToWords(long number) {
        if (number == 0) return "Zero Rupees Only";
        String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine" };
        String[] teens = { "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
        String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };
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
            if (number < 10) words.append(units[(int) number]);
            else if (number < 20) words.append(teens[(int) (number - 10)]);
            else words.append(tens[(int) (number / 10)]).append(" ").append(units[(int) (number % 10)]);
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

        // Prepare Address in 3 lines with indentation
        StringBuilder addr = new StringBuilder();
        
        if (address.getPermanentAddressLine() != null && !address.getPermanentAddressLine().isEmpty()) {
            addr.append(address.getPermanentAddressLine()).append("\n");
        }
        
        if (address.getPermanentCity() != null && !address.getPermanentCity().isEmpty()) {
            addr.append("").append(address.getPermanentCity()).append("\n");
        }
 
        if (address.getPermanentState() != null || address.getPermanentPincode() != null) {
            addr.append(""); 
            
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
        if (addressValue.isEmpty()) addressValue = "-";

        // Get CTC from fixed_ctc + variable_pay
        double fixedCtc = parseDoubleSafe(applicant.getFixedCtc());
        double variablePay = parseDoubleSafe(applicant.getVariablePay());
        double totalCtc = fixedCtc + variablePay;
        String formattedCTC = new DecimalFormat("#,##0").format(totalCtc);
        String ctcInText = convertNumberToWords((long) totalCtc);
        
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        // REPLACE ALL PLACEHOLDERS IN PARAGRAPHS
        for (XWPFParagraph p : doc.getParagraphs()) {
            replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC, ctcInText);
        }

        // REPLACE ALL PLACEHOLDERS IN TABLES
        for (XWPFTable table : doc.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph p : cell.getParagraphs()) {
                        replaceAllPlaceholders(p, currentDate, fullName, addressValue, designation, doj, baseLocation, formattedCTC, ctcInText);
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

    private void addSummaryRow(XWPFTable table, String label, double monthlyValue) {
        XWPFTableRow row = table.createRow();
        ensureColumns(row, 6);
        
        setCell(row, 0, label);
        setCell(row, 1, monthlyValue);
        setCell(row, 2, monthlyValue * 12);
        
        // Make the row bold
        for (XWPFTableCell cell : row.getTableCells()) {
            for (XWPFParagraph p : cell.getParagraphs()) {
                for (XWPFRun run : p.getRuns()) {
                    run.setBold(true);
                }
            }
        }
    }

}
