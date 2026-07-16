//package com.register.example.service;
//
//import com.register.example.entity.Employee;
//import com.register.example.entity.Payslip;
//import com.register.example.entity.Timesheet;
//import com.register.example.repository.EmployeeRepository;
//import com.register.example.repository.PayslipRepository;
//import com.register.example.repository.TimesheetRepository;
//import org.apache.poi.ss.usermodel.*;
//import org.apache.poi.xssf.usermodel.XSSFWorkbook;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.io.ByteArrayOutputStream;
//import java.io.IOException;
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.time.Month;
//import java.time.YearMonth;
//import java.util.List;
//import java.util.Optional;
//
//@Service
//public class PayslipService {
//
//    @Autowired
//    private PayslipRepository payslipRepository;
//
//    @Autowired
//    private TimesheetRepository timesheetRepository;
//
//    @Autowired
//    private EmployeeRepository employeeRepository;
//
//    public List<Payslip> getAllPayslips() {
//        return payslipRepository.findAll();
//    }
//
//    public List<Payslip> getPayslipsByEmployee(String employeeId) {
//        return payslipRepository.findByEmployeeId(employeeId);
//    }
//
//    public List<Payslip> getPayslipsByMonthAndYear(String month, Integer year) {
//        return payslipRepository.findBySalaryMonthAndSalaryYear(month, year);
//    }
//
//    public Optional<Payslip> getPayslipByEmployeeAndMonth(String employeeId, String month, Integer year) {
//        return payslipRepository.findByEmployeeIdAndSalaryMonthAndSalaryYear(employeeId, month, year);
//    }
//
//    public Payslip createOrUpdatePayslip(Payslip payslip) {
//        // Get employee details
//    	Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(payslip.getEmployeeId());
//        if (employeeOpt.isPresent()) {
//            Employee employee = employeeOpt.get();
//            payslip.setEmployeeName(employee.getName());   // ✔ Correct field
//
//            payslip.setBankAccountNo(employee.getBankAccountNumber());
//            payslip.setBankName(employee.getBankName());
//            payslip.setDateOfJoining(employee.getJoiningDate());
//            payslip.setPfNo(employee.getPfMemberId());
//        }
//
//        // Calculate present days from timesheet
//        int monthValue = Month.valueOf(payslip.getSalaryMonth().toUpperCase()).getValue();
//        Long presentDays = timesheetRepository.countPresentDaysByEmployeeAndMonth(
//            payslip.getEmployeeId(), monthValue, payslip.getSalaryYear());
//        payslip.setPresentDays(presentDays != null ? presentDays.intValue() : 0);
//
//        // Set pay days (total days in month)
//        YearMonth yearMonth = YearMonth.of(payslip.getSalaryYear(), monthValue);
//        payslip.setPayDays(yearMonth.lengthOfMonth());
//
//        // Calculate totals
//        payslip.calculateTotals();
//
//        return payslipRepository.save(payslip);
//    }
//
//    public void deletePayslip(Long id) {
//        payslipRepository.deleteById(id);
//    }
//
//    public byte[] generatePayslipExcel(String month, Integer year) throws IOException {
//        List<Payslip> payslips = getPayslipsByMonthAndYear(month, year);
//        
//        try (Workbook workbook = new XSSFWorkbook()) {
//            Sheet sheet = workbook.createSheet("Payslips - " + month + " " + year);
//            
//            // Create header style
//            CellStyle headerStyle = workbook.createCellStyle();
//            Font headerFont = workbook.createFont();
//            headerFont.setBold(true);
//            headerFont.setFontHeightInPoints((short) 12);
//            headerStyle.setFont(headerFont);
//            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
//            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
//            headerStyle.setBorderBottom(BorderStyle.THIN);
//            headerStyle.setBorderTop(BorderStyle.THIN);
//            headerStyle.setBorderRight(BorderStyle.THIN);
//            headerStyle.setBorderLeft(BorderStyle.THIN);
//
//            // Create data style
//            CellStyle dataStyle = workbook.createCellStyle();
//            dataStyle.setBorderBottom(BorderStyle.THIN);
//            dataStyle.setBorderTop(BorderStyle.THIN);
//            dataStyle.setBorderRight(BorderStyle.THIN);
//            dataStyle.setBorderLeft(BorderStyle.THIN);
//
//            // Create currency style
//            CellStyle currencyStyle = workbook.createCellStyle();
//            currencyStyle.cloneStyleFrom(dataStyle);
//            currencyStyle.setDataFormat(workbook.createDataFormat().getFormat("₹#,##0.00"));
//
//            // Create header row
//            Row headerRow = sheet.createRow(0);
//            String[] headers = {
//                "Employee ID", "Employee Name", "Bank Account No", "Bank Name", 
//                "Pay Days", "Present Days", "Designation", "PF No", "Date of Joining",
//                "Basic Allowance", "HRA", "Conveyance", "Food Allowance", "Medical Allowance",
//                "Driver Allowance", "Advance Bonus", "Telephone Allowance", "Shift Allowance",
//                "LTC", "Statutory Bonus", "Special Allowance", "SPL Allowance", "EPF Earnings", "NSA",
//                "Total Earnings", "Income Tax", "Medical Insurance", "PF Deduction", 
//                "ESI Deduction", "Other Deductions", "Total Deductions", "Net Pay"
//            };
//
//            for (int i = 0; i < headers.length; i++) {
//                Cell cell = headerRow.createCell(i);
//                cell.setCellValue(headers[i]);
//                cell.setCellStyle(headerStyle);
//            }
//
//            // Fill data rows
//            int rowNum = 1;
//            for (Payslip payslip : payslips) {
//                Row row = sheet.createRow(rowNum++);
//                
//                row.createCell(0).setCellValue(payslip.getEmployeeId());
//                row.createCell(1).setCellValue(payslip.getEmployeeName());
//                row.createCell(2).setCellValue(payslip.getBankAccountNo());
//                row.createCell(3).setCellValue(payslip.getBankName());
//                row.createCell(4).setCellValue(payslip.getPayDays());
//                row.createCell(5).setCellValue(payslip.getPresentDays());
//                row.createCell(6).setCellValue(payslip.getDesignation());
//                row.createCell(7).setCellValue(payslip.getPfNo());
//                row.createCell(8).setCellValue(payslip.getDateOfJoining() != null ? payslip.getDateOfJoining().toString() : "");
//
//                // Earnings
//                setCurrencyCell(row, 9, payslip.getBasicAllowance(), currencyStyle);
//                setCurrencyCell(row, 10, payslip.getHouseRentAllowance(), currencyStyle);
//                setCurrencyCell(row, 11, payslip.getConveyanceAllowance(), currencyStyle);
//                setCurrencyCell(row, 12, payslip.getFoodAllowance(), currencyStyle);
//                setCurrencyCell(row, 13, payslip.getMedicalAllowance(), currencyStyle);
//                setCurrencyCell(row, 14, payslip.getDriverAllowance(), currencyStyle);
//                setCurrencyCell(row, 15, payslip.getAdvanceBonusEstimate(), currencyStyle);
//                setCurrencyCell(row, 16, payslip.getTelephoneBroadbandAllowance(), currencyStyle);
//                setCurrencyCell(row, 17, payslip.getShiftAllowance(), currencyStyle);
//                setCurrencyCell(row, 18, payslip.getLeaveTravelConcession(), currencyStyle);
//                setCurrencyCell(row, 19, payslip.getStatutoryBonus(), currencyStyle);
//                setCurrencyCell(row, 20, payslip.getSpecialAllowance(), currencyStyle);
//                setCurrencyCell(row, 21, payslip.getSplAllowance(), currencyStyle);
//                setCurrencyCell(row, 22, payslip.getEpfEarnings(), currencyStyle);
//                setCurrencyCell(row, 23, payslip.getNsa(), currencyStyle);
//                setCurrencyCell(row, 24, payslip.getTotalEarnings(), currencyStyle);
//
//                // Deductions
//                setCurrencyCell(row, 25, payslip.getIncomeTax(), currencyStyle);
//                setCurrencyCell(row, 26, payslip.getMedicalInsurance(), currencyStyle);
//                setCurrencyCell(row, 27, payslip.getPfDeduction(), currencyStyle);
//                setCurrencyCell(row, 28, payslip.getEsiDeduction(), currencyStyle);
//                setCurrencyCell(row, 29, payslip.getOtherDeductions(), currencyStyle);
//                setCurrencyCell(row, 30, payslip.getTotalDeductions(), currencyStyle);
//                setCurrencyCell(row, 31, payslip.getNetPay(), currencyStyle);
//
//                // Apply data style to non-currency cells
//                for (int i = 0; i <= 8; i++) {
//                    row.getCell(i).setCellStyle(dataStyle);
//                }
//            }
//
//            // Auto-size columns
//            for (int i = 0; i < headers.length; i++) {
//                sheet.autoSizeColumn(i);
//            }
//
//            // Write to byte array
//            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
//            workbook.write(outputStream);
//            return outputStream.toByteArray();
//        }
//    }
//
//    private void setCurrencyCell(Row row, int cellIndex, BigDecimal value, CellStyle style) {
//        Cell cell = row.createCell(cellIndex);
//        if (value != null) {
//            cell.setCellValue(value.doubleValue());
//        } else {
//            cell.setCellValue(0.0);
//        }
//        cell.setCellStyle(style);
//    }
//
//    public byte[] generateIndividualPayslipExcel(String employeeId, String month, Integer year) throws IOException {
//        Optional<Payslip> payslipOpt = getPayslipByEmployeeAndMonth(employeeId, month, year);
//
//        if (payslipOpt.isEmpty()) {
//            throw new RuntimeException("Payslip not found for employee " + employeeId + " for " + month + " " + year);
//        }
//
//        Payslip payslip = payslipOpt.get();
//
//        try (Workbook workbook = new XSSFWorkbook()) {
//            Sheet sheet = workbook.createSheet("Payslip - " + payslip.getEmployeeName());
//
//            // Common fonts/styles
//            Font titleFont = workbook.createFont();
//            titleFont.setBold(true);
//            titleFont.setFontHeightInPoints((short) 14);
//
//            Font headerFont = workbook.createFont();
//            headerFont.setBold(true);
//
//            CellStyle titleStyle = workbook.createCellStyle();
//            titleStyle.setFont(titleFont);
//            titleStyle.setAlignment(HorizontalAlignment.CENTER);
//
//            CellStyle headerStyle = workbook.createCellStyle();
//            headerStyle.setFont(headerFont);
//            headerStyle.setAlignment(HorizontalAlignment.CENTER);
//            headerStyle.setBorderBottom(BorderStyle.THIN);
//            headerStyle.setBorderTop(BorderStyle.THIN);
//            headerStyle.setBorderLeft(BorderStyle.THIN);
//            headerStyle.setBorderRight(BorderStyle.THIN);
//
//            CellStyle infoLabelStyle = workbook.createCellStyle();
//            infoLabelStyle.setFont(headerFont);
//            infoLabelStyle.setBorderBottom(BorderStyle.THIN);
//            infoLabelStyle.setBorderTop(BorderStyle.THIN);
//            infoLabelStyle.setBorderLeft(BorderStyle.THIN);
//            infoLabelStyle.setBorderRight(BorderStyle.THIN);
//
//            CellStyle infoValueStyle = workbook.createCellStyle();
//            infoValueStyle.setBorderBottom(BorderStyle.THIN);
//            infoValueStyle.setBorderTop(BorderStyle.THIN);
//            infoValueStyle.setBorderLeft(BorderStyle.THIN);
//            infoValueStyle.setBorderRight(BorderStyle.THIN);
//
//            CellStyle amountStyle = workbook.createCellStyle();
//            amountStyle.setBorderBottom(BorderStyle.THIN);
//            amountStyle.setBorderTop(BorderStyle.THIN);
//            amountStyle.setBorderLeft(BorderStyle.THIN);
//            amountStyle.setBorderRight(BorderStyle.THIN);
//            amountStyle.setDataFormat(workbook.createDataFormat().getFormat("₹#,##0.00"));
//
//            CellStyle textCellStyle = workbook.createCellStyle();
//            textCellStyle.setBorderBottom(BorderStyle.THIN);
//            textCellStyle.setBorderTop(BorderStyle.THIN);
//            textCellStyle.setBorderLeft(BorderStyle.THIN);
//            textCellStyle.setBorderRight(BorderStyle.THIN);
//
//            // Header
//            Row companyRow = sheet.createRow(0);
//            Cell companyCell = companyRow.createCell(0);
//            companyCell.setCellValue("Xevyte Technologies Pvt. Ltd.");
//            companyCell.setCellStyle(titleStyle);
//            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 4));
//
//            Row titleRow = sheet.createRow(2);
//            Cell titleCell = titleRow.createCell(0);
//            titleCell.setCellValue("Salary Slip for the Month of " + month + "/" + year);
//            titleCell.setCellStyle(titleStyle);
//            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(2, 2, 0, 4));
//
//            // Employee info grid (two columns of label/value)
//            int rowIdx = 4;
//
//            // Optionally fetch PAN from Employee if available
//            String pan = null;
//            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(payslip.getEmployeeId());
//            if (empOpt.isPresent()) {
//                pan = empOpt.get().getPanNo();
//            }
//
//            rowIdx = createInfoRow(sheet, rowIdx, "Employee ID", payslip.getEmployeeId(), "Employee Name", payslip.getEmployeeName(), infoLabelStyle, infoValueStyle);
//            rowIdx = createInfoRow(sheet, rowIdx, "PAN", pan, "Bank Account No", payslip.getBankAccountNo(), infoLabelStyle, infoValueStyle);
//            rowIdx = createInfoRow(sheet, rowIdx, "PF No.", payslip.getPfNo(), "Bank Name", payslip.getBankName(), infoLabelStyle, infoValueStyle);
//            rowIdx = createInfoRow(sheet, rowIdx, "Present Days", String.valueOf(payslip.getPresentDays()), "Pay Days", String.valueOf(payslip.getPayDays()), infoLabelStyle, infoValueStyle);
//            rowIdx = createInfoRow(sheet, rowIdx,
//                    "Date Of Joining", payslip.getDateOfJoining() != null ? payslip.getDateOfJoining().toString() : "",
//                    "Designation", payslip.getDesignation(), infoLabelStyle, infoValueStyle);
//
//            rowIdx += 1; // blank row before earnings/deductions table
//
//            // Table header: Pay & Allowances vs Deductions
//            Row tableHeader = sheet.createRow(rowIdx++);
//            String[] headerTexts = {"Pay & Allowances", "Monthly", "Yearly", "Deductions", "Amounts (INR)"};
//            for (int i = 0; i < headerTexts.length; i++) {
//                Cell c = tableHeader.createCell(i);
//                c.setCellValue(headerTexts[i]);
//                c.setCellStyle(headerStyle);
//            }
//
//            // Earnings (left) and deductions (right)
//            class RowItem {
//                final String label;
//                final BigDecimal amount;
//                RowItem(String label, BigDecimal amount) { this.label = label; this.amount = amount != null ? amount : BigDecimal.ZERO; }
//            }
//
//            RowItem[] earnings = new RowItem[] {
//                new RowItem("Basic & Dearness Allowance", payslip.getBasicAllowance()),
//                new RowItem("House Rent Allowance", payslip.getHouseRentAllowance()),
//                new RowItem("Conveyance Allowance", payslip.getConveyanceAllowance()),
//                new RowItem("Food Allowance", payslip.getFoodAllowance()),
//                new RowItem("CHILDREN EDUCN SCHOOL", payslip.getAdvanceBonusEstimate()),
//                new RowItem("Driver Allowance", payslip.getDriverAllowance()),
//                new RowItem("Med. Allowance", payslip.getMedicalAllowance()),
//                new RowItem("Statutory Bonus", payslip.getStatutoryBonus()),
//                new RowItem("Telephone & Broadband Allowance", payslip.getTelephoneBroadbandAllowance()),
//                new RowItem("Spl. Allowance", payslip.getSplAllowance()),
//                new RowItem("EPF", payslip.getEpfEarnings()),
//                new RowItem("NSA", payslip.getNsa())
//            };
//
//            RowItem[] deductions = new RowItem[] {
//                new RowItem("PF", payslip.getPfDeduction()),
//                new RowItem("PT", payslip.getOtherDeductions()),
//                new RowItem("Income Tax", payslip.getIncomeTax()),
//                new RowItem("Medical Insurance", payslip.getMedicalInsurance())
//            };
//
//            int maxRows = Math.max(earnings.length, deductions.length);
//            BigDecimal totalEarnings = BigDecimal.ZERO;
//            BigDecimal totalDeductions = BigDecimal.ZERO;
//
//            for (int i = 0; i < maxRows; i++) {
//                Row r = sheet.createRow(rowIdx++);
//
//                if (i < earnings.length) {
//                    RowItem e = earnings[i];
//                    BigDecimal monthly = e.amount;
//                    BigDecimal yearly = monthly.multiply(BigDecimal.valueOf(12));
//                    totalEarnings = totalEarnings.add(monthly);
//
//                    Cell l = r.createCell(0);
//                    l.setCellValue(e.label);
//                    l.setCellStyle(textCellStyle);
//
//                    Cell mCell = r.createCell(1);
//                    mCell.setCellValue(monthly.doubleValue());
//                    mCell.setCellStyle(amountStyle);
//
//                    Cell yCell = r.createCell(2);
//                    yCell.setCellValue(yearly.doubleValue());
//                    yCell.setCellStyle(amountStyle);
//                } else {
//                    for (int c = 0; c <= 2; c++) {
//                        Cell empty = r.createCell(c);
//                        empty.setCellStyle(textCellStyle);
//                    }
//                }
//
//                if (i < deductions.length) {
//                    RowItem d = deductions[i];
//                    BigDecimal amt = d.amount;
//                    totalDeductions = totalDeductions.add(amt);
//
//                    Cell dl = r.createCell(3);
//                    dl.setCellValue(d.label);
//                    dl.setCellStyle(textCellStyle);
//
//                    Cell da = r.createCell(4);
//                    da.setCellValue(amt.doubleValue());
//                    da.setCellStyle(amountStyle);
//                } else {
//                    for (int c = 3; c <= 4; c++) {
//                        Cell empty = r.createCell(c);
//                        empty.setCellStyle(textCellStyle);
//                    }
//                }
//            }
//
//            // Part A - Earnings and Total Deductions row
//            Row totalsRow = sheet.createRow(rowIdx++);
//
//            Cell partALabel = totalsRow.createCell(0);
//            partALabel.setCellValue("Part A - Earnings");
//            partALabel.setCellStyle(infoLabelStyle);
//
//            Cell partAMonthly = totalsRow.createCell(1);
//            partAMonthly.setCellValue(totalEarnings.doubleValue());
//            partAMonthly.setCellStyle(amountStyle);
//
//            Cell partAYearly = totalsRow.createCell(2);
//            partAYearly.setCellValue(totalEarnings.multiply(BigDecimal.valueOf(12)).doubleValue());
//            partAYearly.setCellStyle(amountStyle);
//
//            Cell totalDedLabel = totalsRow.createCell(3);
//            totalDedLabel.setCellValue("Total Deductions");
//            totalDedLabel.setCellStyle(infoLabelStyle);
//
//            Cell totalDedValue = totalsRow.createCell(4);
//            totalDedValue.setCellValue(totalDeductions.doubleValue());
//            totalDedValue.setCellStyle(amountStyle);
//
//            // Net Pay row
//            Row netRow = sheet.createRow(rowIdx++);
//            Cell netLabel = netRow.createCell(3);
//            netLabel.setCellValue("Net Pay");
//            netLabel.setCellStyle(infoLabelStyle);
//
//            Cell netVal = netRow.createCell(4);
//            netVal.setCellValue(payslip.getNetPay().doubleValue());
//            netVal.setCellStyle(amountStyle);
//
//            for (int c = 0; c <= 4; c++) {
//                sheet.autoSizeColumn(c);
//            }
//
//            ByteArrayOutputStream bos = new ByteArrayOutputStream();
//            workbook.write(bos);
//            return bos.toByteArray();
//        }
//    }
//
//    private void createLabelValueRow(Sheet sheet, int rowNum, String label, String value, CellStyle labelStyle) {
//        Row row = sheet.createRow(rowNum);
//        Cell labelCell = row.createCell(0);
//        labelCell.setCellValue(label);
//        labelCell.setCellStyle(labelStyle);
//        Cell valueCell = row.createCell(1);
//        valueCell.setCellValue(value != null ? value : "");
//    }
//
//    private int addEarningsRows(Sheet sheet, Payslip payslip, int startRow, CellStyle currencyStyle) {
//        int currentRow = startRow;
//        
//        if (payslip.getBasicAllowance().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "Basic & Dearness Allowance", payslip.getBasicAllowance(), currencyStyle);
//        }
//        if (payslip.getHouseRentAllowance().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "House Rent Allowance", payslip.getHouseRentAllowance(), currencyStyle);
//        }
//        if (payslip.getConveyanceAllowance().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "Conveyance Allowance", payslip.getConveyanceAllowance(), currencyStyle);
//        }
//        if (payslip.getFoodAllowance().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "Food Allowance", payslip.getFoodAllowance(), currencyStyle);
//        }
//        if (payslip.getMedicalAllowance().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "Medical Allowance", payslip.getMedicalAllowance(), currencyStyle);
//        }
//        
//        return currentRow;
//    }
//
//    private int addDeductionsRows(Sheet sheet, Payslip payslip, int startRow, CellStyle currencyStyle) {
//        int currentRow = startRow;
//        
//        if (payslip.getIncomeTax().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "Income Tax", payslip.getIncomeTax(), currencyStyle);
//        }
//        if (payslip.getMedicalInsurance().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "Medical Insurance", payslip.getMedicalInsurance(), currencyStyle);
//        }
//        if (payslip.getPfDeduction().compareTo(BigDecimal.ZERO) > 0) {
//            addAmountRow(sheet, currentRow++, "PF Deduction", payslip.getPfDeduction(), currencyStyle);
//        }
//        
//        return currentRow;
//    }
//
//    private void addAmountRow(Sheet sheet, int rowNum, String label, BigDecimal amount, CellStyle currencyStyle) {
//        Row row = sheet.createRow(rowNum);
//        Cell labelCell = row.createCell(0);
//        labelCell.setCellValue(label);
//        Cell amountCell = row.createCell(2);
//        amountCell.setCellValue(amount.doubleValue());
//        amountCell.setCellStyle(currencyStyle);
//    }
//    
//    /**
//     * Creates a row in the sheet with two columns of label/value pairs.
//     * Columns are Label1 (0), Value1 (1), Label2 (3), Value2 (4).
//     * @return The next row index.
//     */
//    private int createInfoRow(Sheet sheet, int startRow, String label1, String value1, String label2, String value2, CellStyle labelStyle, CellStyle valueStyle) {
//        Row row = sheet.createRow(startRow);
//
//        // Label 1
//        Cell cellL1 = row.createCell(0);
//        cellL1.setCellValue(label1);
//        cellL1.setCellStyle(labelStyle);
//
//        // Value 1
//        Cell cellV1 = row.createCell(1);
//        cellV1.setCellValue(value1 != null ? value1 : "");
//        cellV1.setCellStyle(valueStyle);
//        
//        // Merge regions for label/value pairs (optional, but standard for this layout)
//        // sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow, startRow, 0, 0)); // Label 1
//        // sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow, startRow, 1, 2)); // Value 1
//        
//        // Label 2
//        Cell cellL2 = row.createCell(3);
//        cellL2.setCellValue(label2);
//        cellL2.setCellStyle(labelStyle);
//
//        // Value 2
//        Cell cellV2 = row.createCell(4);
//        cellV2.setCellValue(value2 != null ? value2 : "");
//        cellV2.setCellStyle(valueStyle);
//
//        // sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow, startRow, 3, 3)); // Label 2
//        // sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow, startRow, 4, 4)); // Value 2
//        
//        return startRow + 1;
//    }
//}
