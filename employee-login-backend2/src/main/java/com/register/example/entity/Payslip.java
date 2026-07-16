package com.register.example.entity;

import com.register.example.util.HashMapConverter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Map;
import java.util.Set;
import java.util.Collections;
import java.math.BigDecimal;

@Entity
@Table(name = "payslips", uniqueConstraints = {
		@UniqueConstraint(columnNames = { "employeeId", "salaryMonth", "salaryYear" })
})
public class Payslip {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "employee_id", length = 50)
private String employeeId;

@Column(name = "employee_name", length = 50)
private String employeeName;

@Column(name = "salary_month", length = 50)
private String salaryMonth;
	private Integer salaryYear;

	private Integer payDays;
	private Integer presentDays;

	@Column(name = "bank_account_no", length = 50)
private String bankAccountNo;

@Column(name = "bank_name", length = 50)
private String bankName;
	private String pfNo;
	@Column(name = "designation", length = 50)
private String designation;

	private LocalDate dateOfJoining;

	private LocalDate generatedDate;

	// meta
	@Column(name = "location")
	private String location;

@Column(name = "tax_regime", length = 50)
private String taxRegime;

	@Column(name = "pf_uan")
	private String pfUan;

	@Column(name = "esi_number", length = 50)
private String esiNumber;

	// LOP
	@Column(name = "lop_days")
	private Integer lopDays;

	@Column(name = "lop_deduction")
	private BigDecimal lopDeduction;

	// -----------------------------
	// JSON COLUMN FOR SALARY INFO
	// -----------------------------
	@Convert(converter = HashMapConverter.class)
	@Column(columnDefinition = "JSON")
	private Map<String, Object> salaryJson = new HashMap<>();

	// -----------------------------
	// PDF (optional)
	// -----------------------------
	@Lob
	private byte[] payslipPdf;
@Column(name = "payslip_pdf_name", length = 50)
private String payslipPdfName;

@Column(name = "payslip_pdf_type", length = 50)
private String payslipPdfType;

	// =============================
	// JSON HELPERS
	// =============================
	public void put(String key, Object value) {
		salaryJson.put(key, value);
	}

	public Object get(String key) {
		return salaryJson.get(key);
	}

	/** Returns salaryJson[key] as BigDecimal safely */
	public BigDecimal getDecimal(String key) {
		Object val = salaryJson.get(key);
		if (val == null)
			return BigDecimal.ZERO;

		try {
			if (val instanceof BigDecimal)
				return (BigDecimal) val;
			if (val instanceof Number)
				return BigDecimal.valueOf(((Number) val).doubleValue());
			return new BigDecimal(val.toString().replace(",", "").replace("₹", ""));
		} catch (Exception ex) {
			return BigDecimal.ZERO;
		}
	}

	// =============================
	// GETTERS + SETTERS
	// =============================
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getEmployeeId() {
		return employeeId;
	}

	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}

	public String getEmployeeName() {
		return employeeName;
	}

	public void setEmployeeName(String employeeName) {
		this.employeeName = employeeName;
	}

	public String getSalaryMonth() {
		return salaryMonth;
	}

	public void setSalaryMonth(String salaryMonth) {
		this.salaryMonth = salaryMonth;
	}

	public Integer getSalaryYear() {
		return salaryYear;
	}

	public void setSalaryYear(Integer salaryYear) {
		this.salaryYear = salaryYear;
	}

	public Integer getPayDays() {
		return payDays;
	}

	public void setPayDays(Integer payDays) {
		this.payDays = payDays;
	}

	public Integer getPresentDays() {
		return presentDays;
	}

	public void setPresentDays(Integer presentDays) {
		this.presentDays = presentDays;
	}

	public String getBankAccountNo() {
		return bankAccountNo;
	}

	public void setBankAccountNo(String bankAccountNo) {
		this.bankAccountNo = bankAccountNo;
	}

	public String getBankName() {
		return bankName;
	}

	public void setBankName(String bankName) {
		this.bankName = bankName;
	}

	public String getPfNo() {
		return pfNo;
	}

	public void setPfNo(String pfNo) {
		this.pfNo = pfNo;
	}

	public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

	public LocalDate getDateOfJoining() {
		return dateOfJoining;
	}

	public void setDateOfJoining(LocalDate dateOfJoining) {
		this.dateOfJoining = dateOfJoining;
	}

	public LocalDate getGeneratedDate() {
		return generatedDate;
	}

	public void setGeneratedDate(LocalDate generatedDate) {
		this.generatedDate = generatedDate;
	}

	public Map<String, Object> getSalaryJson() {
		return salaryJson;
	}

	public void setSalaryJson(Map<String, Object> salaryJson) {
		this.salaryJson = salaryJson;
	}

	public byte[] getPayslipPdf() {
		return payslipPdf;
	}

	public void setPayslipPdf(byte[] payslipPdf) {
		this.payslipPdf = payslipPdf;
	}

	public String getPayslipPdfName() {
		return payslipPdfName;
	}

	public void setPayslipPdfName(String payslipPdfName) {
		this.payslipPdfName = payslipPdfName;
	}

	public String getPayslipPdfType() {
		return payslipPdfType;
	}

	public void setPayslipPdfType(String payslipPdfType) {
		this.payslipPdfType = payslipPdfType;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getTaxRegime() {
		return taxRegime;
	}

	public void setTaxRegime(String taxRegime) {
		this.taxRegime = taxRegime;
	}

	public String getPfUan() {
		return pfUan;
	}

	public void setPfUan(String pfUan) {
		this.pfUan = pfUan;
	}

	public String getEsiNumber() {
		return esiNumber;
	}

	public void setEsiNumber(String esiNumber) {
		this.esiNumber = esiNumber;
	}

	public Integer getLopDays() {
		return lopDays;
	}

	public void setLopDays(Integer lopDays) {
		this.lopDays = lopDays;
	}

	public BigDecimal getLopDeduction() {
		return lopDeduction;
	}

	public void setLopDeduction(BigDecimal lopDeduction) {
		this.lopDeduction = lopDeduction;
	}

	// ⭐ MUST BE ADDED IN Payslip.java
	public Set<String> getAllKeys() {
		if (this.getSalaryJson() == null) {
			return Collections.emptySet();
		}
		return this.getSalaryJson().keySet();
	}

}
