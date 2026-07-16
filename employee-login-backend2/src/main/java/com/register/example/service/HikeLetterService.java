package com.register.example.service;

import com.register.example.entity.CompensationDetails;
import com.register.example.entity.CompensationTemplate;
import com.register.example.entity.Employee;
import com.register.example.entity.SalaryComponent;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.SalaryComponentRepository;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigInteger;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

@Service
public class HikeLetterService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SalaryComponentRepository salaryComponentRepository;

    @Autowired
    private PdfConversionService pdfConversionService;

    private static final DecimalFormat df = new DecimalFormat("#,##,##0.00");
    private static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public byte[] generateHikeLetter(CompensationDetails comp,
            CompensationTemplate template,
            Map<String, Object> salaryBreakup) throws Exception {

        // 1️⃣ Load template
        byte[] templateBytes = template.getContent();
        InputStream templateStream = new ByteArrayInputStream(templateBytes);
        XWPFDocument document = new XWPFDocument(templateStream);

        // 2️⃣ Fetch employee
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(comp.getEmployeeId());
        Employee emp = empOpt.orElse(new Employee());

        // 3️⃣ Prepare dates
        String currentDate = LocalDate.now().format(dtf);
        String effectiveDate = comp.getEffectiveDate() != null
                ? comp.getEffectiveDate().format(dtf)
                : "-";

        // 4️⃣ Prepare salary values FIRST
        double pFixed = comp.getProposedFixedCtc() != null
                ? comp.getProposedFixedCtc()
                : 0.0;

        double pVar = comp.getProposedVariablePay() != null
                ? comp.getProposedVariablePay()
                : 0.0;

        // 5️⃣ Replace text placeholders
        fillPlaceholders(document, emp, comp, effectiveDate, currentDate, salaryBreakup);

        // 6️⃣ Insert dynamic salary breakup table
        insertSalaryBreakupTable(document, pFixed, pVar, salaryBreakup);

        // 7️⃣ Write document
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.write(baos);
        document.close();

        return baos.toByteArray();
    }

    public byte[] generateHikeLetter(CompensationDetails comp, CompensationTemplate template) throws Exception {
        return generateHikeLetter(comp, template, null);
    }

    public byte[] generateHikeLetterPdf(CompensationDetails comp, CompensationTemplate template,
            Map<String, Object> salaryBreakup) throws Exception {
        byte[] docxBytes = generateHikeLetter(comp, template, salaryBreakup);
        return pdfConversionService.convertToPdf(docxBytes);
    }

    public byte[] generateHikeLetterPdf(CompensationDetails comp, CompensationTemplate template) throws Exception {
        byte[] docxBytes = generateHikeLetter(comp, template, null);
        return pdfConversionService.convertToPdf(docxBytes);
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(HikeLetterService.class);

    private void fillPlaceholders(XWPFDocument doc, Employee emp,
            CompensationDetails comp,
            String effectiveDate, String currentDate, Map<String, Object> salaryBreakup) {

        Double currentFixed = comp.getCurrentFixedCtc();
        Double currentVariable = comp.getCurrentVariablePay();
        Double proposedFixed = comp.getProposedFixedCtc();
        Double proposedVariable = comp.getProposedVariablePay();
        Double hikePct = comp.getHikePercentage();
        String revisionType = comp.getRevisionType();

        String fullName = (emp.getFirstName() != null ? emp.getFirstName() : "") + " " +
                (emp.getLastName() != null ? emp.getLastName() : "");
        fullName = fullName.trim();
        String employeeId = emp.getEmployeeId();
        String designation = (comp.getProposedDesignation() != null && !comp.getProposedDesignation().isBlank())
                ? comp.getProposedDesignation()
                : emp.getRole();
        String department = emp.getDepartment();

        Map<String, String> values = new HashMap<>();

        // Log inputs for debugging
        logger.info("Filling placeholders - Emp: {}, Name: {}, Current: {}, Proposed: {}, Effective: {}",
                employeeId, fullName, currentFixed, proposedFixed, effectiveDate);

        // Basic Info and Aliases
        values.put("Full Name", fullName);
        values.put("Employee Name", fullName);
        values.put("Name", fullName);

        values.put("Employee ID", employeeId != null ? employeeId : "");
        values.put("Emp ID", employeeId != null ? employeeId : "");

        values.put("Designation", designation != null ? designation : "");
        values.put("Role", designation != null ? designation : "");

        values.put("Department", department != null ? department : "");

        values.put("Effective Date", effectiveDate);
        values.put("Effective", effectiveDate);
        values.put("Sent Date", currentDate);
        values.put("Current Date", currentDate);
        values.put("Date", currentDate);

        // Promotion Specifics
        values.put("Old Designation", emp.getRole() != null ? emp.getRole() : "-");
        values.put("Current Designation", emp.getRole() != null ? emp.getRole() : "-");
        values.put("New Designation", designation != null ? designation : "-");
        values.put("Proposed Designation", designation != null ? designation : "-");
        values.put("Revised Designation", designation != null ? designation : "-");

        values.put("Revision Type", revisionType != null ? revisionType : "");
        values.put("Hike", hikePct != null ? hikePct.toString() : "0");
        values.put("Hike Percentage", hikePct != null ? hikePct.toString() + "%" : "0%");
        values.put("Hike %", hikePct != null ? hikePct.toString() + "%" : "0%");
        values.put("Fixed Hike %",
                comp.getFixedHikePercentage() != null ? comp.getFixedHikePercentage().toString() + "%" : "0%");
        values.put("Variable Hike %",
                comp.getVariableHikePercentage() != null ? comp.getVariableHikePercentage().toString() + "%" : "0%");

        // New references from Offer/Appointment Letters
        values.put("Address", emp.getAddress() != null ? emp.getAddress()
                : (emp.getPresentAddress() != null ? emp.getPresentAddress() : "-"));
        values.put("Base Location", emp.getWorkLocation() != null ? emp.getWorkLocation() : "-");
        values.put("DOJ", emp.getJoiningDate() != null ? emp.getJoiningDate().format(dtf) : "-");
        values.put("Joining Date", emp.getJoiningDate() != null ? emp.getJoiningDate().format(dtf) : "-");

        values.put("PAN", emp.getPanNo() != null ? emp.getPanNo() : "-");
        values.put("Aadhar", emp.getAadharNo() != null ? emp.getAadharNo() : "-");
        values.put("Gender", emp.getGender() != null ? emp.getGender() : "-");

        // Additional Employee Details
        values.put("Contact No", emp.getContactNo() != null ? emp.getContactNo() : "-");
        values.put("Personal Email", emp.getPersonalMail() != null ? emp.getPersonalMail() : "-");
        values.put("DOB", emp.getDateOfBirth() != null ? emp.getDateOfBirth().format(dtf) : "-");
        values.put("Blood Group", emp.getBloodGroup() != null ? emp.getBloodGroup() : "-");
        values.put("Employee Type", emp.getEmployeeType() != null ? emp.getEmployeeType() : "-");
        values.put("Probation Status", emp.getProbationStatus() != null ? emp.getProbationStatus() : "-");

        // Bank Details
        values.put("Bank Name", emp.getBankName() != null ? emp.getBankName() : "-");
        values.put("Account Number", emp.getBankAccountNumber() != null ? emp.getBankAccountNumber() : "-");
        values.put("IFSC Code", emp.getBankIfscCode() != null ? emp.getBankIfscCode() : "-");
        values.put("Account Holder", emp.getAccountHolderName() != null ? emp.getAccountHolderName() : "-");
        values.put("UAN", emp.getUanNumber() != null ? emp.getUanNumber() : "-");
        values.put("PF ID", emp.getPfMemberId() != null ? emp.getPfMemberId() : "-");
        values.put("ESI No", emp.getEsiNumber() != null ? emp.getEsiNumber() : "-");

        // Salary Calculations
        double cFixed = currentFixed != null ? currentFixed : 0.0;
        double cVar = currentVariable != null ? currentVariable : 0.0;
        double cTotal = cFixed + cVar;

        double pFixed = proposedFixed != null ? proposedFixed : 0.0;
        double pVar = proposedVariable != null ? proposedVariable : 0.0;
        double pTotal = pFixed + pVar;

        // Fetch configured components
        java.util.List<SalaryComponent> components = salaryComponentRepository.findByIsActiveTrueOrderBySortOrderAsc();
        Map<String, Double> currentBreakup = calculateComponents(cFixed, components);
        Map<String, Double> proposedBreakup = calculateComponents(pFixed, components);

        // Annual values and various aliases
        DecimalFormat localDf = new DecimalFormat("#,##,##0.00");

        values.put("Current Fixed", localDf.format(cFixed));
        values.put("Current Fixed CTC", localDf.format(cFixed));
        values.put("current_fixed_ctc", localDf.format(cFixed));
        values.put("Current CTC", localDf.format(cTotal));
        values.put("current_ctc", localDf.format(cTotal));
        values.put("Current Total", localDf.format(cTotal));
        values.put("Current Bonus", localDf.format(cVar));
        values.put("M Current Bonus", localDf.format(cVar / 12.0));
        values.put("Current Variable Pay", localDf.format(cVar));
        values.put("M Current Variable Pay", localDf.format(cVar / 12.0));

        values.put("Proposed Fixed", localDf.format(pFixed));
        values.put("Proposed Fixed CTC", localDf.format(pFixed));
        values.put("proposed_fixed_ctc", localDf.format(pFixed));
        values.put("Proposed CTC", localDf.format(pTotal));
        values.put("proposed_ctc", localDf.format(pTotal));
        values.put("Revised CTC", localDf.format(pTotal));
        values.put("revised_fixed_ctc", localDf.format(pFixed));
        values.put("Revised Total", localDf.format(pTotal));

        // Total CTC in Words (Optional but common)
        values.put("Revised CTC in Words", convertToWords(pTotal));
        values.put("Proposed CTC in Words", convertToWords(pTotal));

        // Add Dynamic Components to Map
        for (Map.Entry<String, Double> entry : currentBreakup.entrySet()) {
            String key = entry.getKey();
            double val = entry.getValue();
            values.put("Current " + key, localDf.format(val));
            values.put("M Current " + key, localDf.format(val / 12.0));
        }
        for (Map.Entry<String, Double> entry : proposedBreakup.entrySet()) {
            String key = entry.getKey();
            double val = entry.getValue();
            values.put("Proposed " + key, localDf.format(val));
            values.put("M Proposed " + key, localDf.format(val / 12.0));
            values.put("Revised " + key, localDf.format(val));
            values.put("M Revised " + key, localDf.format(val / 12.0));
        }

        // Add Bonus and Variable Pay explicit aliases
        values.put("Proposed Bonus", localDf.format(pVar));
        values.put("M Proposed Bonus", localDf.format(pVar / 12.0));
        values.put("Revised Bonus", localDf.format(pVar));
        values.put("M Revised Bonus", localDf.format(pVar / 12.0));
        values.put("Proposed Variable Pay", localDf.format(pVar));
        values.put("M Proposed Variable Pay", localDf.format(pVar / 12.0));
        values.put("Revised Variable Pay", localDf.format(pVar));
        values.put("M Revised Variable Pay", localDf.format(pVar / 12.0));

        // Add Salary Breakup Values from Frontend if available
        if (salaryBreakup != null) {
            try {
                // Add earnings values
                Map<String, Object> earnings = (Map<String, Object>) salaryBreakup.get("earnings");
                if (earnings != null) {
                    values.put("Basic Monthly", formatValue(getNestedValue(earnings, "basic", "perMonth")));
                    values.put("Basic Annual", formatValue(getNestedValue(earnings, "basic", "perAnnum")));
                    values.put("HRA Monthly", formatValue(getNestedValue(earnings, "hra", "perMonth")));
                    values.put("HRA Annual", formatValue(getNestedValue(earnings, "hra", "perAnnum")));
                    values.put("Conveyance Monthly", formatValue(getNestedValue(earnings, "conveyance", "perMonth")));
                    values.put("Conveyance Annual", formatValue(getNestedValue(earnings, "conveyance", "perAnnum")));
                    values.put("Medical Allowance Monthly",
                            formatValue(getNestedValue(earnings, "medicalAllowance", "perMonth")));
                    values.put("Medical Allowance Annual",
                            formatValue(getNestedValue(earnings, "medicalAllowance", "perAnnum")));
                    values.put("Special Allowance Monthly",
                            formatValue(getNestedValue(earnings, "specialAllowance", "perMonth")));
                    values.put("Special Allowance Annual",
                            formatValue(getNestedValue(earnings, "specialAllowance", "perAnnum")));

                    // Extract Bonus/Variable Pay from breakup if present
                    Object bonusM = getNestedValue(earnings, "bonus", "perMonth");
                    if (bonusM == null)
                        bonusM = getNestedValue(earnings, "variablePay", "perMonth");
                    if (bonusM == null)
                        bonusM = getNestedValue(earnings, "performanceBonus", "perMonth");

                    Object bonusA = getNestedValue(earnings, "bonus", "perAnnum");
                    if (bonusA == null)
                        bonusA = getNestedValue(earnings, "variablePay", "perAnnum");
                    if (bonusA == null)
                        bonusA = getNestedValue(earnings, "performanceBonus", "perAnnum");

                    if (bonusM != null) {
                        values.put("Bonus Monthly", formatValue(bonusM));
                        values.put("Variable Pay Monthly", formatValue(bonusM));
                        values.put("M Proposed Bonus", formatValue(bonusM));
                        values.put("M Revised Bonus", formatValue(bonusM));
                        values.put("M Proposed Variable Pay", formatValue(bonusM));
                        values.put("M Revised Variable Pay", formatValue(bonusM));
                    }
                    // Dynamically add all earnings from breakup as placeholders
                    for (String key : earnings.keySet()) {
                        Object mVal = getNestedValue(earnings, key, "perMonth");
                        Object aVal = getNestedValue(earnings, key, "perAnnum");
                        if (mVal != null) {
                            values.put("M Proposed " + key.toUpperCase(), formatValue(mVal));
                            values.put("M Revised " + key.toUpperCase(), formatValue(mVal));
                        }
                        if (aVal != null) {
                            values.put("Proposed " + key.toUpperCase(), formatValue(aVal));
                            values.put("Revised " + key.toUpperCase(), formatValue(aVal));
                        }
                    }

                    if (bonusA != null) {
                        values.put("Bonus Annual", formatValue(bonusA));
                        values.put("Variable Pay Annual", formatValue(bonusA));
                        values.put("Proposed Bonus", formatValue(bonusA));
                        values.put("Revised Bonus", formatValue(bonusA));
                        values.put("Proposed Variable Pay", formatValue(bonusA));
                        values.put("Revised Variable Pay", formatValue(bonusA));
                    }

                    values.put("Sub Total Monthly", formatValue(getNestedValue(earnings, "subTotal", "perMonth")));
                    values.put("Sub Total Annual", formatValue(getNestedValue(earnings, "subTotal", "perAnnum")));
                    values.put("Employer PF Monthly", formatValue(getNestedValue(earnings, "employerPF", "perMonth")));
                    values.put("Employer PF Annual", formatValue(getNestedValue(earnings, "employerPF", "perAnnum")));
                    values.put("Monthly Total", formatValue(getNestedValue(earnings, "monthlyTotal", "perMonth")));
                    values.put("Annual Total", formatValue(getNestedValue(earnings, "monthlyTotal", "perAnnum")));
                }

                // Add deductions values
                Map<String, Object> deductions = (Map<String, Object>) salaryBreakup.get("deductions");
                if (deductions != null) {
                    values.put("PF Monthly", formatValue(getNestedValue(deductions, "pf", "perMonth")));
                    values.put("PF Annual", formatValue(getNestedValue(deductions, "pf", "perAnnum")));
                    values.put("PT Monthly", formatValue(getNestedValue(deductions, "pt", "perMonth")));
                    values.put("PT Annual", formatValue(getNestedValue(deductions, "pt", "perAnnum")));
                    values.put("Total Deductions Monthly",
                            formatValue(getNestedValue(deductions, "totalDeductions", "perMonth")));
                    values.put("Total Deductions Annual",
                            formatValue(getNestedValue(deductions, "totalDeductions", "perAnnum")));
                }
            } catch (Exception e) {
                logger.warn("Error processing salary breakup data: " + e.getMessage());
            }
        }

        // Add Number to Words
        values.put("Amount In Words", convertNumberToWords((long) pTotal));
        values.put("Total In Words", convertNumberToWords((long) pTotal));
        values.put("CTC In Words", convertNumberToWords((long) pTotal));

        processParagraphs(doc.getParagraphs(), values);
        processTables(doc.getTables(), values);

        for (XWPFHeader header : doc.getHeaderList()) {
            processParagraphs(header.getParagraphs(), values);
            processTables(header.getTables(), values);
        }
        for (XWPFFooter footer : doc.getFooterList()) {
            processParagraphs(footer.getParagraphs(), values);
            processTables(footer.getTables(), values);
        }
    }

    private void processParagraphs(java.util.List<XWPFParagraph> paragraphs, Map<String, String> values) {
        for (XWPFParagraph p : paragraphs) {
            replacePlaceholders(p, values);
        }
    }

    private void processTables(java.util.List<XWPFTable> tables, Map<String, String> values) {
        for (XWPFTable table : tables) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    processParagraphs(cell.getParagraphs(), values);
                    processTables(cell.getTables(), values);
                }
            }
        }
    }

    private void replacePlaceholders(XWPFParagraph p, Map<String, String> values) {
        if (p == null || p.getRuns() == null || p.getRuns().isEmpty())
            return;

        StringBuilder fullText = new StringBuilder();
        for (XWPFRun r : p.getRuns()) {
            String text = r.getText(0);
            if (text != null)
                fullText.append(text);
        }

        String paragraphText = fullText.toString();
        if (paragraphText.isEmpty())
            return;

        String[] patterns = {
                "\\{\\{[\\s]*([^\\}]*?)[\\s]*\\}\\}",
                "\\{[\\s]*([^\\}]*?)[\\s]*\\}",
                "\\[[\\s]*([^\\]]*?)[\\s]*\\]",
                "\\b(current_fixed_ctc)\\b",
                "\\b(proposed_fixed_ctc)\\b"
        };

        boolean replaced = false;
        String currentParagraphText = paragraphText;

        for (String patternStr : patterns) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(patternStr);
            java.util.regex.Matcher matcher = pattern.matcher(currentParagraphText);

            StringBuilder sb = new StringBuilder();
            while (matcher.find()) {
                String capturedKey = matcher.groupCount() > 0 ? matcher.group(1).trim() : matcher.group(0).trim();
                String resolvedValue = findValue(capturedKey, values);

                if (resolvedValue != null) {
                    matcher.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(resolvedValue));
                    replaced = true;
                } else {
                    matcher.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(matcher.group(0)));
                }
            }
            matcher.appendTail(sb);
            currentParagraphText = sb.toString();
        }

        if (replaced) {
            XWPFRun styleRun = null;
            for (XWPFRun r : p.getRuns()) {
                if (r.getText(0) != null) {
                    styleRun = r;
                    break;
                }
            }
            if (styleRun == null)
                styleRun = p.getRuns().get(0);

            String font = styleRun.getFontFamily();
            int size = styleRun.getFontSize();
            boolean bold = styleRun.isBold();
            boolean italic = styleRun.isItalic();
            String color = styleRun.getColor();

            for (int i = p.getRuns().size() - 1; i >= 0; i--)
                p.removeRun(i);

            XWPFRun newRun = p.createRun();
            if (currentParagraphText.contains("\n")) {
                String[] lines = currentParagraphText.split("\n");
                for (int i = 0; i < lines.length; i++) {
                    newRun.setText(lines[i]);
                    if (i < lines.length - 1)
                        newRun.addBreak();
                }
            } else {
                newRun.setText(currentParagraphText);
            }

            if (font != null)
                newRun.setFontFamily(font);
            if (size > 0)
                newRun.setFontSize(size);
            newRun.setBold(bold);
            newRun.setItalic(italic);
            if (color != null)
                newRun.setColor(color);
        }
    }

    private String findValue(String capturedKey, Map<String, String> values) {
        if (capturedKey == null || capturedKey.isEmpty())
            return null;
        String normCaptured = capturedKey.toLowerCase().replaceAll("[^a-z0-9]", "");
        for (Map.Entry<String, String> entry : values.entrySet()) {
            String normMapKey = entry.getKey().toLowerCase().replaceAll("[^a-z0-9]", "");
            if (normCaptured.equals(normMapKey))
                return entry.getValue();
        }
        return null;
    }

    private String convertNumberToWords(long number) {
        if (number == 0)
            return "Zero Rupees Only";
        String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine" };
        String[] teens = { "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
                "Eighteen", "Nineteen" };
        String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };
        StringBuilder words = new StringBuilder();
        if (number / 10000000 > 0) {
            words.append(convertNumberToWords(number / 10000000)).append(" Crore ");
            number %= 10000000;
        }
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
                words.append(tens[(int) (number / 10)]).append(" ").append(units[(int) (number % 10)]);
        }
        return words.toString().trim() + " Rupees Only";
    }

    private Map<String, Double> calculateComponents(double fixedCtc, java.util.List<SalaryComponent> components) {
        Map<String, Double> results = new HashMap<>();

        // 1. Initialize Core Context with many aliases
        double annualFixedCtc = fixedCtc;
        double monthlyFixedCtc = annualFixedCtc / 12.0;

        results.put("CTC", annualFixedCtc);
        results.put("FIXED_CTC", annualFixedCtc);
        results.put("ANNUAL_CTC", annualFixedCtc);
        results.put("ANNUAL_FIXED_CTC", annualFixedCtc);

        results.put("MONTHLY_CTC", monthlyFixedCtc);
        results.put("MONTHLY_FIXED_CTC", monthlyFixedCtc);
        results.put("MONTHLY_TOTAL", monthlyFixedCtc);

        // Add cleaned versions
        results.put("FIXEDCTC", annualFixedCtc);
        results.put("MONTHLYCTC", monthlyFixedCtc);
        results.put("MONTHLYTOTAL", monthlyFixedCtc);

        // 2. Fallback Defaults (Only used if no components are defined in DB)
        if (components == null || components.isEmpty()) {
            double mPF = 1800.0;
            double mPT = 200.0;
            double mSub = monthlyFixedCtc - mPF;
            double mBasic = mSub * 0.40;
            double mHRA = mBasic * 0.50;
            double mConv = 1600.0;
            double mMed = 1250.0;
            double mSpec = mSub - (mBasic + mHRA + mConv + mMed);

            results.put("BASIC", mBasic * 12.0);
            results.put("HRA", mHRA * 12.0);
            results.put("CONVEYANCE", mConv * 12.0);
            results.put("MEDICAL", mMed * 12.0);
            results.put("SPECIAL_ALLOWANCE", Math.max(0, mSpec) * 12.0);
            results.put("SUB_TOTAL", mSub * 12.0);
            results.put("EMPLOYER_PF", 1950.0 * 12.0);
            results.put("PF", mPF * 12.0);
            results.put("PT", mPT * 12.0);
            return results;
        }

        // 3. Dynamic Calculation Loop (using Formulas from Frontend/DB)
        SalaryComponent remainderComp = null;
        for (SalaryComponent comp : components) {
            String formula = comp.getFormula();
            if (formula == null || formula.trim().isEmpty()) {
                continue;
            }

            String placeholder = comp.getPlaceholder();
            if (placeholder == null || placeholder.isEmpty()) {
                placeholder = comp.getName().toUpperCase().replace(" ", "_");
            }

            if ("REMAINDER".equalsIgnoreCase(formula) || "REMAINDER".equalsIgnoreCase(comp.getCalculationType())) {
                remainderComp = comp;
                continue;
            }

            double value = evaluateSimpleFormula(formula, results);
            results.put(placeholder, value);
            // Also store clean version
            results.put(placeholder.replace("_", ""), value);

            logger.info("Calculated {} = {} using formula: {}", placeholder, value, formula);
        }

        // 4. Handle Remainder Component (balancing figure)
        if (remainderComp != null) {
            double usedAmount = 0;
            for (SalaryComponent c : components) {
                if (c == remainderComp)
                    continue;

                String cName = c.getName().toUpperCase();
                String p = c.getPlaceholder();
                if (p == null || p.isEmpty())
                    p = c.getName().toUpperCase().replace(" ", "_");

                // Exclude summary components from used earnings to avoid double-counting
                if ("EARNING".equalsIgnoreCase(c.getType()) &&
                        !cName.contains("SUB TOTAL") &&
                        !cName.contains("SUBTOTAL") &&
                        !cName.contains("TOTAL CTC") &&
                        !cName.contains("MONTHLY TOTAL") &&
                        !p.toUpperCase().contains("SUBTOTAL") &&
                        !p.toUpperCase().contains("SUB_TOTAL")) {
                    usedAmount += results.getOrDefault(p, 0.0);
                }
            }
            double remainderValue = Math.max(0, annualFixedCtc - usedAmount);
            String rp = remainderComp.getPlaceholder();
            if (rp == null || rp.isEmpty())
                rp = remainderComp.getName().toUpperCase().replace(" ", "_");
            results.put(rp, remainderValue);
            results.put(rp.replace("_", ""), remainderValue);
            logger.info("Calculated Remainder {} = {}", rp, remainderValue);
        }

        // 5. Calculate Standard Summaries if not explicitly defined
        if (!results.containsKey("SUB_TOTAL")) {
            double subTotal = 0;
            for (SalaryComponent c : components) {
                if ("EARNING".equalsIgnoreCase(c.getType())) {
                    subTotal += results.getOrDefault(c.getPlaceholder(), 0.0);
                }
            }
            results.put("SUB_TOTAL", subTotal);
            results.put("SUBTOTAL", subTotal);
        }

        if (!results.containsKey("MONTHLY_TOTAL")) {
            results.put("MONTHLY_TOTAL", annualFixedCtc);
        }

        return results;
    }

    private double evaluateSimpleFormula(String formula, Map<String, Double> context) {
        if (formula == null || formula.trim().isEmpty())
            return 0.0;

        try {
            // 1. Normalize formula
            String expr = formula.toUpperCase();
            expr = expr.replace("%", "/100.0"); // Handle percentage
            expr = expr.replace(" ", ""); // Remove spaces to match normalized keys

            // 2. Setup SpEL
            ExpressionParser parser = new SpelExpressionParser();
            StandardEvaluationContext evalContext = new StandardEvaluationContext();

            // Add all variables to the context
            for (Map.Entry<String, Double> entry : context.entrySet()) {
                evalContext.setVariable(entry.getKey(), entry.getValue());
                String cleanKey = entry.getKey().replace("_", "");
                if (!cleanKey.equals(entry.getKey())) {
                    evalContext.setVariable(cleanKey, entry.getValue());
                }
            }

            // 3. Identify potential variables
            java.util.regex.Pattern varPattern = java.util.regex.Pattern.compile("\\b[A-Z_][A-Z0-9_]*\\b");
            java.util.regex.Matcher matcher = varPattern.matcher(expr);
            java.util.Set<String> foundVars = new java.util.HashSet<>();
            while (matcher.find()) {
                foundVars.add(matcher.group());
            }

            // Replace variables in expression with #prefix for SpEL
            java.util.List<String> sortedVars = new java.util.ArrayList<>(foundVars);
            sortedVars.sort((a, b) -> b.length() - a.length());

            for (String var : sortedVars) {
                String targetVar = var;
                double varValue = 0.0;
                boolean found = false;

                // Case A: Direct match
                if (context.containsKey(var)) {
                    found = true;
                    varValue = context.get(var);
                }
                // Case B: Clean match (no underscores)
                else if (context.containsKey(var.replace("_", ""))) {
                    found = true;
                    targetVar = var.replace("_", "");
                    varValue = context.get(targetVar);
                }
                // Case C: Handle "PERMONTH" or "MONTHLY" suffix
                else if (var.endsWith("PERMONTH") || var.endsWith("MONTHLY")) {
                    String baseVar = var.replace("PERMONTH", "").replace("MONTHLY", "");
                    if (context.containsKey(baseVar)) {
                        found = true;
                        targetVar = var;
                        varValue = context.get(baseVar) / 12.0;
                        evalContext.setVariable(targetVar, varValue);
                    } else if (context.containsKey(baseVar.replace("_", ""))) {
                        found = true;
                        targetVar = var;
                        varValue = context.get(baseVar.replace("_", "")) / 12.0;
                        evalContext.setVariable(targetVar, varValue);
                    }
                }

                if (found) {
                    expr = expr.replaceAll("\\b" + var + "\\b", "#" + targetVar);
                } else {
                    // Not found, default to 0.0 to avoid SpEL error
                    evalContext.setVariable(var, 0.0);
                    expr = expr.replaceAll("\\b" + var + "\\b", "#" + var);
                }
            }

            // 4. Final cleaning of expression (e.g. unbalanced parens common in user input)
            // If user has (Sub Total)*40%)/2 - the extra ) after 40% will fail SpEL
            // We can try a simple balance check or just catch the error

            // 5. Evaluate
            Double result = parser.parseExpression(expr).getValue(evalContext, Double.class);
            return result != null ? result : 0.0;
        } catch (Exception e) {
            logger.warn("Formula evaluation failed: " + formula + " -> " + e.getMessage());
            // Attempt a very basic recovery: if it's just a number, return it
            try {
                return Double.parseDouble(formula.replaceAll("[^0-9.]", ""));
            } catch (Exception ex) {
                return 0.0;
            }
        }
    }

    // private void fillCtcTable(XWPFTable table, double fixedCtc, double
    // variablePay, boolean hasVariablePay,
    // Map<String, Object> salaryBreakup)
    // {
    // if(table==null||table.getRows()==null)return;

    // // Fetch components from DB to calculate them dynamically
    // List<SalaryComponent> components =
    // salaryComponentRepository.findByIsActiveTrueOrderBySortOrderAsc();
    // Map<String, Double> calculatedValues = calculateComponents(fixedCtc,
    // components);

    // // Normalize calculations into a searchable map (clean name -> monthly value)
    // Map<String, Double> searchMap = new HashMap<>();

    // // Add calculated components
    // for(
    // SalaryComponent comp:components)
    // {
    // String cleanName = comp.getName().toLowerCase().replaceAll("[^a-z]", "");
    // double val = calculatedValues.getOrDefault(comp.getPlaceholder(), 0.0);
    // searchMap.put(cleanName, val);
    // }

    // // Add standard fallbacks if not defined in components
    // if(!searchMap.containsKey("ctc"))searchMap.put("ctc",fixedCtc+variablePay);if(!searchMap.containsKey("monthlytotal"))searchMap.put("monthlytotal",(fixedCtc+variablePay)/12.0);if(!searchMap.containsKey("bonus"))searchMap.put("bonus",variablePay/12.0);if(!searchMap.containsKey("variablepay"))searchMap.put("variablepay",variablePay/12.0);

    // for(
    // int i = 0;i<table.getRows().size();i++)
    // {
    // XWPFTableRow row = table.getRow(i);
    // java.util.List<XWPFTableCell> cells = row.getTableCells();
    // if (cells.size() < 2)
    // continue;

    // for (int j = 0; j < cells.size(); j++) {
    // String rawText = cells.get(j).getText().toLowerCase();
    // String cellText = rawText.replaceAll("[^a-z]", ""); // Strip everything but
    // a-z
    // if (cellText.isEmpty())
    // continue;

    // // --- DYNAMIC MATCHING ---
    // boolean matched = false;

    // // 1. Try exact or fuzzy match with searchMap (calculated components)
    // for (String key : searchMap.keySet()) {
    // if (cellText.equals(key) ||
    // (cellText.length() > 3 && key.contains(cellText)) ||
    // (key.length() > 3 && cellText.contains(key)) ||
    // (cellText.startsWith("basic") && key.equals("basic")) ||
    // (cellText.contains("special") && key.contains("special")) ||
    // (cellText.contains("speacial") && key.contains("special")) || // Handle
    // common typo
    // (cellText.contains("bonus") && key.contains("bonus"))) {

    // double annualVal = searchMap.get(key);
    // double monthlyVal = annualVal / 12.0;

    // // Check if it's a fixed monthly component (e.g. Conveyance 1600)
    // // If annual is < 12 times the monthly expectation, it might already be
    // monthly
    // // But standard logic is: formulas are annual.
    // setCell(row, j + 1, monthlyVal);
    // setCell(row, j + 2, annualVal);
    // matched = true;
    // break;
    // }
    // }

    // if (matched)
    // continue;

    // // 2. Fallback: Try matching from frontend salaryBreakup if available
    // if (salaryBreakup != null) {
    // Map<String, Object> earnings = (Map<String, Object>)
    // salaryBreakup.get("earnings");
    // Map<String, Object> deductions = (Map<String, Object>)
    // salaryBreakup.get("deductions");

    // if (earnings != null) {
    // for (String key : earnings.keySet()) {
    // String cleanKey = key.toLowerCase().replaceAll("[^a-z]", "");
    // if (cellText.equals(cleanKey) || (cellText.length() > 3 &&
    // cleanKey.contains(cellText))) {
    // double val = getDoubleValue(getNestedValue(earnings, key, "perMonth"));
    // setCell(row, j + 1, val);
    // setCell(row, j + 2, val * 12);
    // matched = true;
    // break;
    // }
    // }
    // }

    // if (!matched && deductions != null) {
    // for (String key : deductions.keySet()) {
    // String cleanKey = key.toLowerCase().replaceAll("[^a-z]", "");
    // if (cellText.equals(cleanKey) || (cellText.length() > 3 &&
    // cleanKey.contains(cellText))) {
    // double val = getDoubleValue(getNestedValue(deductions, key, "perMonth"));
    // setCell(row, j + 1, val);
    // setCell(row, j + 2, val * 12);
    // matched = true;
    // break;
    // }
    // }
    // }
    // }

    // if (matched)
    // continue;

    // // 3. Final Fallbacks for static text like "As applicable"
    // if (cellText.contains("it") || cellText.contains("incometax")
    // || cellText.contains("healthinsurance")
    // || cellText.contains("esic") || cellText.contains("lwf") ||
    // cellText.contains("insurance")) {
    // setCell(row, j + 1, "As applicable");
    // setCell(row, j + 2, "As applicable");
    // }
    // }
    // }
    // }

    private void setCell(XWPFTableRow row, int cellIndex, Object value) {
        ensureColumns(row, cellIndex + 1);
        XWPFTableCell cell = row.getCell(cellIndex);
        if (cell == null)
            return;
        for (int i = cell.getParagraphs().size() - 1; i >= 0; i--)
            cell.removeParagraph(i);
        XWPFParagraph para = cell.addParagraph();
        XWPFRun run = para.createRun();
        if (value instanceof Number)
            run.setText(new DecimalFormat("#,##,##0").format(value));
        else
            run.setText(String.valueOf(value));
    }

    private void ensureColumns(XWPFTableRow row, int requiredCells) {
        while (row.getTableCells().size() < requiredCells) {
            row.addNewTableCell();
        }
        // CRITICAL: Initialize EVERY cell's properties (TcPr) to prevent PDF conversion
        // NPE.
        // Some cells might be created automatically by table.createRow() and need
        // initialization.
        for (XWPFTableCell cell : row.getTableCells()) {
            if (cell != null && cell.getCTTc().getTcPr() == null) {
                cell.getCTTc().addNewTcPr();
            }
        }
    }

    private String formatValue(Object value) {
        if (value == null)
            return "0.00";
        String strVal = value.toString();
        // If it's already "As applicable", return it as is
        if ("As applicable".equalsIgnoreCase(strVal)) {
            return strVal;
        }
        try {
            double numValue = Double.parseDouble(strVal.replace(",", ""));
            return new DecimalFormat("#,##,##0.00").format(numValue);
        } catch (Exception e) {
            // If it's not a number, it might be text like "As applicable" - return as is
            return strVal;
        }
    }

    private Object getNestedValue(Map<String, Object> map, String key1, String key2) {
        try {
            Map<String, Object> innerMap = (Map<String, Object>) map.get(key1);
            if (innerMap != null) {
                return innerMap.get(key2);
            }
        } catch (Exception e) {
            logger.debug("Error getting nested value for " + key1 + "." + key2 + ": " + e.getMessage());
        }
        return null;
    }

    private double getDoubleValue(Object value) {
        if (value == null)
            return 0.0;
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String convertToWords(double amount) {
        if (amount <= 0)
            return "Zero";

        long number = (long) amount;
        String[] units = { "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
                "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
        String[] tens = { "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };

        StringBuilder words = new StringBuilder();

        if (number >= 10000000) {
            words.append(convertLessThanOneThousand((int) (number / 10000000), units, tens)).append(" Crore ");
            number %= 10000000;
        }
        if (number >= 100000) {
            words.append(convertLessThanOneThousand((int) (number / 100000), units, tens)).append(" Lakh ");
            number %= 100000;
        }
        if (number >= 1000) {
            words.append(convertLessThanOneThousand((int) (number / 1000), units, tens)).append(" Thousand ");
            number %= 1000;
        }
        if (number > 0) {
            words.append(convertLessThanOneThousand((int) number, units, tens));
        }

        return words.toString().trim() + " Only";
    }

    // ===========================
    // FINAL CLEAN VERSION
    // ===========================

    private void insertSalaryBreakupTable(XWPFDocument document,
            double fixedCtc,
            double variablePay,
            Map<String, Object> salaryBreakup) {

        if (salaryBreakup == null) {
            logger.warn("Salary breakup data is null, skipping table insertion.");
            return;
        }

        logger.info("Starting dynamic table insertion for CTC: {}", fixedCtc);

        // 1. Collect all paragraphs (including those inside tables) to find the
        // placeholder
        List<XWPFParagraph> paragraphsToSearch = new ArrayList<>(document.getParagraphs());
        for (XWPFTable t : document.getTables()) {
            for (XWPFTableRow r : t.getRows()) {
                for (XWPFTableCell c : r.getTableCells()) {
                    paragraphsToSearch.addAll(c.getParagraphs());
                }
            }
        }

        for (XWPFParagraph paragraph : paragraphsToSearch) {
            String text = paragraph.getText();
            if (text == null)
                continue;

            // Check for multiple placeholder formats or the "Salary Break up" text itself
            if (text.contains("{{SALARY_BREAKUP_TABLE}}") ||
                    text.contains("{SALARY_BREAKUP_TABLE}") ||
                    text.contains("[SALARY_BREAKUP_TABLE]") ||
                    text.contains("SALARY_BREAKUP_TABLE") ||
                    (text.contains("Salary Break up") && paragraph.getRuns().size() > 0)) {

                logger.info("Matched placeholder or marker in paragraph: '{}'. Replacing with dynamic table.", text);

                // Clear the placeholder paragraph
                for (int r = paragraph.getRuns().size() - 1; r >= 0; r--) {
                    paragraph.removeRun(r);
                }

                // Insert table exactly at the placeholder's cursor
                XWPFTable table = document.insertNewTbl(paragraph.getCTP().newCursor());

                // CRITICAL: Initialize TblGrid and GridCols to prevent "0 columns" error during PDF conversion
                org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblGrid grid = table.getCTTbl().getTblGrid();
                if (grid == null) {
                    grid = table.getCTTbl().addNewTblGrid();
                }
                for (int i = 0; i < 6; i++) {
                    grid.addNewGridCol().setW(BigInteger.valueOf(1350)); // Total width: 1350 * 6 = 8100
                }

                // Set fixed table width in TWIPS (~5.6 inches) and add manual left indent
                // to center the table and ensure space on both sides
                table.setWidth(8100); 
                table.setTableAlignment(TableRowAlign.LEFT); 
                
                if (table.getCTTbl().getTblPr() == null) {
                    table.getCTTbl().addNewTblPr();
                }
                org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblPr tblPr = table.getCTTbl().getTblPr();
                org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTblWidth tblInd = tblPr.isSetTblInd() ? tblPr.getTblInd() : tblPr.addNewTblInd();
                tblInd.setW(BigInteger.valueOf(630)); // Indent to center an 8100 TWIP table on standard page
                tblInd.setType(org.openxmlformats.schemas.wordprocessingml.x2006.main.STTblWidth.DXA);
                
                table.setCellMargins(60, 100, 60, 100); // Increased horizontal padding for cleaner values

                // Create header
                XWPFTableRow header = table.getRow(0) != null ? table.getRow(0) : table.createRow();
                String[] headers = { "Earnings", "Per Month", "Per Annum", "Deductions", "Per Month", "Per Annum" };
                for (int i = 0; i < headers.length; i++) {
                    XWPFTableCell cell = (i == 0) ? header.getCell(0) : header.addNewTableCell();

                    // CRITICAL: Initialize TcPr for PDF conversion
                    if (cell.getCTTc().getTcPr() == null) {
                        cell.getCTTc().addNewTcPr();
                    }

                    cell.setColor("F4B084"); // Orange background to match design
                    XWPFParagraph p = cell.getParagraphs().get(0);
                    p.setAlignment(ParagraphAlignment.CENTER);
                    XWPFRun run = p.createRun();
                    run.setBold(true);
                    run.setText(headers[i]);
                }

                Map<String, Object> earnings = (Map<String, Object>) salaryBreakup.get("earnings");
                Map<String, Object> deductions = (Map<String, Object>) salaryBreakup.get("deductions");

                List<String> earningKeys = new ArrayList<>();
                if (earnings != null) {
                    earningKeys.addAll(earnings.keySet());
                    earningKeys.sort((k1, k2) -> {
                        Object s1 = getNestedValue(earnings, k1, "sequenceOrder");
                        Object s2 = getNestedValue(earnings, k2, "sequenceOrder");
                        int v1 = s1 instanceof Number ? ((Number) s1).intValue() : 999;
                        int v2 = s2 instanceof Number ? ((Number) s2).intValue() : 999;
                        return Integer.compare(v1, v2);
                    });
                }

                List<String> deductionKeys = new ArrayList<>();
                if (deductions != null) {
                    deductionKeys.addAll(deductions.keySet());
                    deductionKeys.sort((k1, k2) -> {
                        Object s1 = getNestedValue(deductions, k1, "sequenceOrder");
                        Object s2 = getNestedValue(deductions, k2, "sequenceOrder");
                        int v1 = s1 instanceof Number ? ((Number) s1).intValue() : 999;
                        int v2 = s2 instanceof Number ? ((Number) s2).intValue() : 999;
                        return Integer.compare(v1, v2);
                    });
                }

                int maxRows = Math.max(earningKeys.size(), deductionKeys.size());

                for (int i = 0; i < maxRows; i++) {
                    XWPFTableRow row = table.createRow();
                    ensureColumns(row, 6);

                    // --- Earnings ---
                    if (i < earningKeys.size()) {
                        String key = earningKeys.get(i);
                        String name = (String) getNestedValue(earnings, key, "name");
                        if (name == null)
                            name = key;

                        Object pmVal = getNestedValue(earnings, key, "perMonth");
                        Object paVal = getNestedValue(earnings, key, "perAnnum");
                        String componentType = (String) getNestedValue(earnings, key, "componentType");

                        String pmText;
                        String paText;
                        if ("AS_APPLICABLE".equalsIgnoreCase(componentType) || 
                            (pmVal != null && pmVal.equals(0.0) && "As applicable".equalsIgnoreCase(getNestedValue(earnings, key, "displayPerMonth") != null ? getNestedValue(earnings, key, "displayPerMonth").toString() : ""))) {
                            pmText = "As applicable";
                            paText = "As applicable";
                        } else {
                            pmText = (pmVal instanceof String && !isNumeric(pmVal.toString())) ? pmVal.toString()
                                    : formatNumber(getDoubleValue(pmVal));
                            paText = (paVal instanceof String && !isNumeric(paVal.toString())) ? paVal.toString()
                                    : formatNumber(getDoubleValue(paVal));
                        }

                        String section = (String) getNestedValue(earnings, key, "section");
                        boolean isSummary = "Summary".equalsIgnoreCase(section) || key.toLowerCase().contains("total");
                        setFormattedCell(row, 0, name, isSummary, ParagraphAlignment.LEFT);
                        setFormattedCell(row, 1, pmText, isSummary, ParagraphAlignment.RIGHT);
                        setFormattedCell(row, 2, paText, isSummary, ParagraphAlignment.RIGHT);
                    }

                    // --- Deductions ---
                    if (i < deductionKeys.size()) {
                        String key = deductionKeys.get(i);
                        String name = (String) getNestedValue(deductions, key, "name");
                        if (name == null)
                            name = key;

                        Object pmVal = getNestedValue(deductions, key, "perMonth");
                        Object paVal = getNestedValue(deductions, key, "perAnnum");
                        String componentType = (String) getNestedValue(deductions, key, "componentType");

                        String pmText;
                        String paText;
                        if ("AS_APPLICABLE".equalsIgnoreCase(componentType) || 
                            (pmVal != null && pmVal.equals(0.0) && "As applicable".equalsIgnoreCase(getNestedValue(deductions, key, "displayPerMonth") != null ? getNestedValue(deductions, key, "displayPerMonth").toString() : ""))) {
                            pmText = "As applicable";
                            paText = "As applicable";
                        } else {
                            pmText = (pmVal instanceof String && !isNumeric(pmVal.toString().replace(",", ""))) ? pmVal.toString()
                                    : formatNumber(getDoubleValue(pmVal));
                            paText = (paVal instanceof String && !isNumeric(paVal.toString().replace(",", ""))) ? paVal.toString()
                                    : formatNumber(getDoubleValue(paVal));
                        }

                        String section = (String) getNestedValue(deductions, key, "section");
                        boolean isSummary = "Summary".equalsIgnoreCase(section) || key.toLowerCase().contains("total");
                        setFormattedCell(row, 3, name, isSummary, ParagraphAlignment.LEFT);
                        setFormattedCell(row, 4, pmText, isSummary, ParagraphAlignment.RIGHT);
                        setFormattedCell(row, 5, paText, isSummary, ParagraphAlignment.RIGHT);
                    }
                }

                logger.info("Dynamic table insertion completed successfully.");
                return; // Only replace one table
            }
        }
        logger.warn("No {{SALARY_BREAKUP_TABLE}} placeholder found in the document.");
    }

    private boolean isNumeric(String str) {
        if (str == null || str.trim().isEmpty())
            return false;
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private void setFormattedCell(XWPFTableRow row, int index, String text, boolean bold, ParagraphAlignment align) {
        XWPFTableCell cell = row.getCell(index);
        if (cell == null)
            return;

        // CRITICAL: Initialize TcPr to prevent NPE during PDF conversion
        if (cell.getCTTc().getTcPr() == null) {
            cell.getCTTc().addNewTcPr();
        }

        // Clear existing paragraphs
        for (int i = cell.getParagraphs().size() - 1; i >= 0; i--) {
            cell.removeParagraph(i);
        }

        XWPFParagraph p = cell.addParagraph();
        p.setAlignment(align);
        XWPFRun r = p.createRun();
        r.setText(text);
        if (bold)
            r.setBold(true);
        r.setFontFamily("Calibri");
        r.setFontSize(10); // Restored to 10 for better visibility
    }

    private String formatNumber(double value) {
        // Prevent negative values from appearing in salary documents
        if (value < 0) {
            logger.warn("Negative value detected in formatNumber: {}, converting to 0", value);
            value = 0;
        }
        return new DecimalFormat("#,##,##0").format(value);
    }

    private String convertLessThanOneThousand(int number, String[] units, String[] tens) {
        StringBuilder words = new StringBuilder();
        if (number >= 100) {
            words.append(units[number / 100]).append(" Hundred ");
            if (number % 100 > 0)
                words.append("and ");
            number %= 100;
        }
        if (number >= 20) {
            words.append(tens[number / 10]).append(" ");
            number %= 10;
        }
        if (number > 0) {
            words.append(units[number]).append(" ");
        }
        return words.toString().trim();
    }

    // private void fillCtcTable(XWPFTable table, double fixedCtc, double
    // variablePay, boolean hasVariablePay) {
    // fillCtcTable(table, fixedCtc, variablePay, hasVariablePay, null);
    // }
}
