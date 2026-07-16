package com.register.example.payload;

import java.math.BigDecimal;

public class PayslipRequest {

    public String employeeId;
    public String employeeName;
    public String pan;
    public String pfNo;
    public String bankAccountNo;
    public String bankName;
    public String dateOfJoining;
    public String designation;
    public Integer presentDays;
    public Integer payDays;
    public String monthYear;

    public BigDecimal basicDA;
    public BigDecimal hra;
    public BigDecimal conveyance;
    public BigDecimal foodAllowance;
    public BigDecimal childrenEdu;
    public BigDecimal driverAllowance;
    public BigDecimal advanceBonus;
    public BigDecimal telephoneBroadband;
    public BigDecimal shiftAllowance;
    public BigDecimal leaveTravel;
    public BigDecimal statutoryBonus;
    public BigDecimal variablePay;
    public BigDecimal specialAllowance;
    public BigDecimal epfEarning;
    public BigDecimal nsa;

    public BigDecimal pf;
    public BigDecimal pt;
    public String incomeTax;
    public BigDecimal medicalInsurance;

    // Raw excel JSON (optional)
    public String excelJson;
}
