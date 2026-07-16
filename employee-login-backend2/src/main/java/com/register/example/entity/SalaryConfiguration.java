package com.register.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
// FIX APPLIED: Added a Unique Constraint on the logical key to enforce data
// integrity.
@Table(name = "salary_configuration", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employee_id", "salary_month", "salary_year" })
})
public class SalaryConfiguration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    // keep existing fields (kept for backward compatibility)
    @Column(name = "basic_salary", precision = 10, scale = 2)
    private BigDecimal basicSalary;

    // Existing percentage fields (optional)
    @Column(name = "hra_percentage", precision = 10, scale = 2)
    private BigDecimal hraPercentage;

    @Column(name = "da_percentage", precision = 10, scale = 2)
    private BigDecimal daPercentage;

    @Column(name = "pf_percentage", precision = 10, scale = 2)
    private BigDecimal pfPercentage;

    @Column(name = "tds_percentage", precision = 10, scale = 2)
    private BigDecimal tdsPercentage;

    @Column(name = "professional_tax", precision = 10, scale = 2)
    private BigDecimal professionalTax;

    // -----------------------
    // NEW: Monthly and Yearly fields (direct mapping from Excel)
    // -----------------------
    @Column(name = "salary_month")
    private String salaryMonth; // Example: "JANUARY"

    @Column(name = "salary_year")
    private Integer salaryYear;

    @Column(name = "basic_da_monthly", precision = 10, scale = 2)
    private BigDecimal basicDaMonthly;

    @Column(name = "basic_da_yearly", precision = 10, scale = 2)
    private BigDecimal basicDaYearly;

    @Column(name = "hra_monthly", precision = 10, scale = 2)
    private BigDecimal hraMonthly;

    @Column(name = "hra_yearly", precision = 10, scale = 2)
    private BigDecimal hraYearly;

    @Column(name = "conveyance_monthly", precision = 10, scale = 2)
    private BigDecimal conveyanceMonthly;

    @Column(name = "conveyance_yearly", precision = 10, scale = 2)
    private BigDecimal conveyanceYearly;

    @Column(name = "food_monthly", precision = 10, scale = 2)
    private BigDecimal foodMonthly;

    @Column(name = "food_yearly", precision = 10, scale = 2)
    private BigDecimal foodYearly;

    @Column(name = "children_school_monthly", precision = 10, scale = 2)
    private BigDecimal childrenSchoolMonthly;

    @Column(name = "children_school_yearly", precision = 10, scale = 2)
    private BigDecimal childrenSchoolYearly;

    @Column(name = "driver_allowance_monthly", precision = 10, scale = 2)
    private BigDecimal driverAllowanceMonthly;

    @Column(name = "driver_allowance_yearly", precision = 10, scale = 2)
    private BigDecimal driverAllowanceYearly;

    @Column(name = "advance_bonus_monthly", precision = 10, scale = 2)
    private BigDecimal advanceBonusMonthly;

    @Column(name = "advance_bonus_yearly", precision = 10, scale = 2)
    private BigDecimal advanceBonusYearly;

    @Column(name = "telephone_monthly", precision = 10, scale = 2)
    private BigDecimal telephoneMonthly;

    @Column(name = "telephone_yearly", precision = 10, scale = 2)
    private BigDecimal telephoneYearly;

    @Column(name = "shift_monthly", precision = 10, scale = 2)
    private BigDecimal shiftMonthly;

    @Column(name = "shift_yearly", precision = 10, scale = 2)
    private BigDecimal shiftYearly;

    @Column(name = "ltc_monthly", precision = 10, scale = 2)
    private BigDecimal ltcMonthly;

    @Column(name = "ltc_yearly", precision = 10, scale = 2)
    private BigDecimal ltcYearly;

    @Column(name = "stat_bonus_monthly", precision = 10, scale = 2)
    private BigDecimal statBonusMonthly;

    @Column(name = "stat_bonus_yearly", precision = 10, scale = 2)
    private BigDecimal statBonusYearly;

    @Column(name = "variable_pay_monthly", precision = 10, scale = 2)
    private BigDecimal variablePayMonthly;

    @Column(name = "variable_pay_yearly", precision = 10, scale = 2)
    private BigDecimal variablePayYearly;

    @Column(name = "spl_allowance_monthly", precision = 10, scale = 2)
    private BigDecimal splAllowanceMonthly;

    @Column(name = "spl_allowance_yearly", precision = 10, scale = 2)
    private BigDecimal splAllowanceYearly;

    @Column(name = "epf_earnings_monthly", precision = 10, scale = 2)
    private BigDecimal epfEarningsMonthly;

    @Column(name = "epf_earnings_yearly", precision = 10, scale = 2)
    private BigDecimal epfEarningsYearly;

    @Column(name = "nsa_monthly", precision = 10, scale = 2)
    private BigDecimal nsaMonthly;

    @Column(name = "nsa_yearly", precision = 10, scale = 2)
    private BigDecimal nsaYearly;

    @Column(name = "pf_monthly", precision = 10, scale = 2)
    private BigDecimal pfMonthly;

    @Column(name = "pf_yearly", precision = 10, scale = 2)
    private BigDecimal pfYearly;

    @Column(name = "pt_monthly", precision = 10, scale = 2)
    private BigDecimal ptMonthly;

    @Column(name = "pt_yearly", precision = 10, scale = 2)
    private BigDecimal ptYearly;

    @Column(name = "income_tax_monthly", precision = 10, scale = 2)
    private BigDecimal incomeTaxMonthly;

    @Column(name = "income_tax_yearly", precision = 10, scale = 2)
    private BigDecimal incomeTaxYearly;

    @Column(name = "medical_insurance_monthly", precision = 10, scale = 2)
    private BigDecimal medicalInsuranceMonthly;

    @Column(name = "medical_insurance_yearly", precision = 10, scale = 2)
    private BigDecimal medicalInsuranceYearly;

    @Column(name = "total_deductions_monthly", precision = 10, scale = 2)
    private BigDecimal totalDeductionsMonthly;

    @Column(name = "total_deductions_yearly", precision = 10, scale = 2)
    private BigDecimal totalDeductionsYearly;

    // --- NEW Earnings fields ---
    @Column(name = "incentives_monthly", precision = 10, scale = 2)
    private BigDecimal incentivesMonthly;

    @Column(name = "incentives_yearly", precision = 10, scale = 2)
    private BigDecimal incentivesYearly;

    @Column(name = "joining_bonus_monthly", precision = 10, scale = 2)
    private BigDecimal joiningBonusMonthly;

    @Column(name = "joining_bonus_yearly", precision = 10, scale = 2)
    private BigDecimal joiningBonusYearly;

    @Column(name = "other_earnings_monthly", precision = 10, scale = 2)
    private BigDecimal otherEarningsMonthly;

    @Column(name = "other_earnings_yearly", precision = 10, scale = 2)
    private BigDecimal otherEarningsYearly;

    @Column(name = "leave_encashments_monthly", precision = 10, scale = 2)
    private BigDecimal leaveEncashmentsMonthly;

    @Column(name = "leave_encashments_yearly", precision = 10, scale = 2)
    private BigDecimal leaveEncashmentsYearly;

    // --- NEW Deduction fields ---
    @Column(name = "lwf_monthly", precision = 10, scale = 2)
    private BigDecimal lwfMonthly;

    @Column(name = "lwf_yearly", precision = 10, scale = 2)
    private BigDecimal lwfYearly;

    @Column(name = "esi_monthly", precision = 10, scale = 2)
    private BigDecimal esiMonthly;

    @Column(name = "esi_yearly", precision = 10, scale = 2)
    private BigDecimal esiYearly;

    @Column(name = "loans_monthly", precision = 10, scale = 2)
    private BigDecimal loansMonthly;

    @Column(name = "loans_yearly", precision = 10, scale = 2)
    private BigDecimal loansYearly;

    @Column(name = "monthly_projected_tax_monthly", precision = 10, scale = 2)
    private BigDecimal monthlyProjectedTaxMonthly;
    // ================================
    // INCOME TAX DEDUCTION – AMOUNT ONLY
    // ================================

    @Column(name = "income_after_section10", precision = 10, scale = 2)
    private BigDecimal incomeAfterSection10;

    @Column(name = "profession_tax", precision = 10, scale = 2)
    private BigDecimal professionTax;

    @Column(name = "standard_deduction", precision = 10, scale = 2)
    private BigDecimal standardDeduction;

    @Column(name = "total_via_deduction", precision = 10, scale = 2)
    private BigDecimal totalViaDeduction;

    @Column(name = "taxable_income", precision = 10, scale = 2)
    private BigDecimal taxableIncome;

    @Column(name = "total_tax", precision = 10, scale = 2)
    private BigDecimal totalTax;

    @Column(name = "education_cess", precision = 10, scale = 2)
    private BigDecimal educationCess;

    @Column(name = "tax_prev_employer", precision = 10, scale = 2)
    private BigDecimal taxPrevEmployer;

    @Column(name = "tax_till_date", precision = 10, scale = 2)
    private BigDecimal taxTillDate;

    @Column(name = "tax_to_be_deducted", precision = 10, scale = 2)
    private BigDecimal taxToBeDeducted;

    @Column(name = "projected_tax", precision = 10, scale = 2)
    private BigDecimal projectedTax;

    // ===================================
    // ✨ ADDED MISSING FIELDS FOR PAYSLIP CALCULATION/YTD REPORTS ✨
    // ===================================

    // Bonus Fields (Monthly/Yearly)
    @Column(name = "bonus_monthly", precision = 10, scale = 2)
    private BigDecimal bonusMonthly;

    @Column(name = "bonus_yearly", precision = 10, scale = 2)
    private BigDecimal bonusYearly;

    // Yearly Total Fields
    @Column(name = "pf_employer_contribution_yearly", precision = 10, scale = 2)
    private BigDecimal pfEmployerContributionYearly;

    @Column(name = "total_gross_yearly", precision = 10, scale = 2)
    private BigDecimal totalGrossYearly;

    @Column(name = "net_pay_yearly", precision = 10, scale = 2)
    private BigDecimal netPayYearly;
    // =========================
    // Part A – Earnings (Monthly / Yearly)
    // =========================

    @Column(name = "part_a_earnings_monthly", precision = 10, scale = 2)
    private BigDecimal partAEarningsMonthly;

    @Column(name = "part_a_earnings_yearly", precision = 10, scale = 2)
    private BigDecimal partAEarningsYearly;

    public BigDecimal getPartAEarningsMonthly() {
        return partAEarningsMonthly;
    }

    public void setPartAEarningsMonthly(BigDecimal partAEarningsMonthly) {
        this.partAEarningsMonthly = partAEarningsMonthly;
    }

    public BigDecimal getPartAEarningsYearly() {
        return partAEarningsYearly;
    }

    public void setPartAEarningsYearly(BigDecimal partAEarningsYearly) {
        this.partAEarningsYearly = partAEarningsYearly;
    }

    // =========================
    // NEW 6 FIELDS (GROSS/EXEMPT/TAXABLE)
    // =========================

    // BASIC + DA
    @Column(name = "basic_da_gross", precision = 10, scale = 2)
    private BigDecimal basicDaGross;

    @Column(name = "basic_da_exempt", precision = 10, scale = 2)
    private BigDecimal basicDaExempt;

    @Column(name = "basic_da_taxable", precision = 10, scale = 2)
    private BigDecimal basicDaTaxable;

    // HRA
    @Column(name = "hra_gross", precision = 10, scale = 2)
    private BigDecimal hraGross;

    @Column(name = "hra_exempt", precision = 10, scale = 2)
    private BigDecimal hraExempt;

    @Column(name = "hra_taxable", precision = 10, scale = 2)
    private BigDecimal hraTaxable;

    // Conveyance
    @Column(name = "conveyance_gross", precision = 10, scale = 2)
    private BigDecimal conveyanceGross;

    @Column(name = "conveyance_exempt", precision = 10, scale = 2)
    private BigDecimal conveyanceExempt;

    @Column(name = "conveyance_taxable", precision = 10, scale = 2)
    private BigDecimal conveyanceTaxable;

    // Special Allowance
    @Column(name = "special_allowance_gross", precision = 10, scale = 2)
    private BigDecimal specialAllowanceGross;

    @Column(name = "special_allowance_exempt", precision = 10, scale = 2)
    private BigDecimal specialAllowanceExempt;

    @Column(name = "special_allowance_taxable", precision = 10, scale = 2)
    private BigDecimal specialAllowanceTaxable;

    // Bonus
    @Column(name = "bonus_gross", precision = 10, scale = 2)
    private BigDecimal bonusGross;

    @Column(name = "bonus_exempt", precision = 10, scale = 2)
    private BigDecimal bonusExempt;

    @Column(name = "bonus_taxable", precision = 10, scale = 2)
    private BigDecimal bonusTaxable;

    // PF (special table)
    @Column(name = "pf_gross", precision = 10, scale = 2)
    private BigDecimal pfGross;

    @Column(name = "pf_exempt", precision = 10, scale = 2)
    private BigDecimal pfExempt;

    @Column(name = "pf_taxable", precision = 10, scale = 2)
    private BigDecimal pfTaxable;

    // Constructors
    public SalaryConfiguration() {
    }

    public SalaryConfiguration(String employeeId, BigDecimal basicSalary) {
        this.employeeId = employeeId;
        this.basicSalary = basicSalary;
    }

    // Getters & setters for all fields
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getBasicDaMonthly() {
        return basicDaMonthly;
    }

    public void setBasicDaMonthly(BigDecimal basicDaMonthly) {
        this.basicDaMonthly = basicDaMonthly;
    }

    public BigDecimal getBasicDaYearly() {
        return basicDaYearly;
    }

    public void setBasicDaYearly(BigDecimal basicDaYearly) {
        this.basicDaYearly = basicDaYearly;
    }

    public BigDecimal getHraMonthly() {
        return hraMonthly;
    }

    public void setHraMonthly(BigDecimal hraMonthly) {
        this.hraMonthly = hraMonthly;
    }

    public BigDecimal getHraYearly() {
        return hraYearly;
    }

    public void setHraYearly(BigDecimal hraYearly) {
        this.hraYearly = hraYearly;
    }

    public BigDecimal getConveyanceMonthly() {
        return conveyanceMonthly;
    }

    public void setConveyanceMonthly(BigDecimal conveyanceMonthly) {
        this.conveyanceMonthly = conveyanceMonthly;
    }

    public BigDecimal getConveyanceYearly() {
        return conveyanceYearly;
    }

    public void setConveyanceYearly(BigDecimal conveyanceYearly) {
        this.conveyanceYearly = conveyanceYearly;
    }

    public BigDecimal getFoodMonthly() {
        return foodMonthly;
    }

    public void setFoodMonthly(BigDecimal foodMonthly) {
        this.foodMonthly = foodMonthly;
    }

    public BigDecimal getFoodYearly() {
        return foodYearly;
    }

    public void setFoodYearly(BigDecimal foodYearly) {
        this.foodYearly = foodYearly;
    }

    public BigDecimal getChildrenSchoolMonthly() {
        return childrenSchoolMonthly;
    }

    public void setChildrenSchoolMonthly(BigDecimal childrenSchoolMonthly) {
        this.childrenSchoolMonthly = childrenSchoolMonthly;
    }

    public BigDecimal getChildrenSchoolYearly() {
        return childrenSchoolYearly;
    }

    public void setChildrenSchoolYearly(BigDecimal childrenSchoolYearly) {
        this.childrenSchoolYearly = childrenSchoolYearly;
    }

    public BigDecimal getDriverAllowanceMonthly() {
        return driverAllowanceMonthly;
    }

    public void setDriverAllowanceMonthly(BigDecimal driverAllowanceMonthly) {
        this.driverAllowanceMonthly = driverAllowanceMonthly;
    }

    public BigDecimal getDriverAllowanceYearly() {
        return driverAllowanceYearly;
    }

    public void setDriverAllowanceYearly(BigDecimal driverAllowanceYearly) {
        this.driverAllowanceYearly = driverAllowanceYearly;
    }

    public BigDecimal getAdvanceBonusMonthly() {
        return advanceBonusMonthly;
    }

    public void setAdvanceBonusMonthly(BigDecimal advanceBonusMonthly) {
        this.advanceBonusMonthly = advanceBonusMonthly;
    }

    public BigDecimal getAdvanceBonusYearly() {
        return advanceBonusYearly;
    }

    public void setAdvanceBonusYearly(BigDecimal advanceBonusYearly) {
        this.advanceBonusYearly = advanceBonusYearly;
    }

    public BigDecimal getTelephoneMonthly() {
        return telephoneMonthly;
    }

    public void setTelephoneMonthly(BigDecimal telephoneMonthly) {
        this.telephoneMonthly = telephoneMonthly;
    }

    public BigDecimal getTelephoneYearly() {
        return telephoneYearly;
    }

    public void setTelephoneYearly(BigDecimal telephoneYearly) {
        this.telephoneYearly = telephoneYearly;
    }

    public BigDecimal getShiftMonthly() {
        return shiftMonthly;
    }

    public void setShiftMonthly(BigDecimal shiftMonthly) {
        this.shiftMonthly = shiftMonthly;
    }

    public BigDecimal getShiftYearly() {
        return shiftYearly;
    }

    public void setShiftYearly(BigDecimal shiftYearly) {
        this.shiftYearly = shiftYearly;
    }

    public BigDecimal getLtcMonthly() {
        return ltcMonthly;
    }

    public void setLtcMonthly(BigDecimal ltcMonthly) {
        this.ltcMonthly = ltcMonthly;
    }

    public BigDecimal getLtcYearly() {
        return ltcYearly;
    }

    public void setLtcYearly(BigDecimal ltcYearly) {
        this.ltcYearly = ltcYearly;
    }

    public BigDecimal getStatBonusMonthly() {
        return statBonusMonthly;
    }

    public void setStatBonusMonthly(BigDecimal statBonusMonthly) {
        this.statBonusMonthly = statBonusMonthly;
    }

    public BigDecimal getStatBonusYearly() {
        return statBonusYearly;
    }

    public void setStatBonusYearly(BigDecimal statBonusYearly) {
        this.statBonusYearly = statBonusYearly;
    }

    public BigDecimal getVariablePayMonthly() {
        return variablePayMonthly;
    }

    public void setVariablePayMonthly(BigDecimal variablePayMonthly) {
        this.variablePayMonthly = variablePayMonthly;
    }

    public BigDecimal getVariablePayYearly() {
        return variablePayYearly;
    }

    public void setVariablePayYearly(BigDecimal variablePayYearly) {
        this.variablePayYearly = variablePayYearly;
    }

    public BigDecimal getSplAllowanceMonthly() {
        return splAllowanceMonthly;
    }

    public void setSplAllowanceMonthly(BigDecimal splAllowanceMonthly) {
        this.splAllowanceMonthly = splAllowanceMonthly;
    }

    public BigDecimal getSplAllowanceYearly() {
        return splAllowanceYearly;
    }

    public void setSplAllowanceYearly(BigDecimal splAllowanceYearly) {
        this.splAllowanceYearly = splAllowanceYearly;
    }

    public BigDecimal getEpfEarningsMonthly() {
        return epfEarningsMonthly;
    }

    public void setEpfEarningsMonthly(BigDecimal epfEarningsMonthly) {
        this.epfEarningsMonthly = epfEarningsMonthly;
    }

    public BigDecimal getEpfEarningsYearly() {
        return epfEarningsYearly;
    }

    public void setEpfEarningsYearly(BigDecimal epfEarningsYearly) {
        this.epfEarningsYearly = epfEarningsYearly;
    }

    public BigDecimal getNsaMonthly() {
        return nsaMonthly;
    }

    public void setNsaMonthly(BigDecimal nsaMonthly) {
        this.nsaMonthly = nsaMonthly;
    }

    public BigDecimal getNsaYearly() {
        return nsaYearly;
    }

    public void setNsaYearly(BigDecimal nsaYearly) {
        this.nsaYearly = nsaYearly;
    }

    public BigDecimal getPfMonthly() {
        return pfMonthly;
    }

    public void setPfMonthly(BigDecimal pfMonthly) {
        this.pfMonthly = pfMonthly;
    }

    public BigDecimal getPfYearly() {
        return pfYearly;
    }

    public void setPfYearly(BigDecimal pfYearly) {
        this.pfYearly = pfYearly;
    }

    public BigDecimal getPtMonthly() {
        return ptMonthly;
    }

    public void setPtMonthly(BigDecimal ptMonthly) {
        this.ptMonthly = ptMonthly;
    }

    public BigDecimal getPtYearly() {
        return ptYearly;
    }

    public void setPtYearly(BigDecimal ptYearly) {
        this.ptYearly = ptYearly;
    }

    public BigDecimal getIncomeTaxMonthly() {
        return incomeTaxMonthly;
    }

    public void setIncomeTaxMonthly(BigDecimal incomeTaxMonthly) {
        this.incomeTaxMonthly = incomeTaxMonthly;
    }

    public BigDecimal getIncomeTaxYearly() {
        return incomeTaxYearly;
    }

    public void setIncomeTaxYearly(BigDecimal incomeTaxYearly) {
        this.incomeTaxYearly = incomeTaxYearly;
    }

    public BigDecimal getMedicalInsuranceMonthly() {
        return medicalInsuranceMonthly;
    }

    public void setMedicalInsuranceMonthly(BigDecimal medicalInsuranceMonthly) {
        this.medicalInsuranceMonthly = medicalInsuranceMonthly;
    }

    public BigDecimal getMedicalInsuranceYearly() {
        return medicalInsuranceYearly;
    }

    public void setMedicalInsuranceYearly(BigDecimal medicalInsuranceYearly) {
        this.medicalInsuranceYearly = medicalInsuranceYearly;
    }

    public BigDecimal getTotalDeductionsMonthly() {
        return totalDeductionsMonthly;
    }

    public void setTotalDeductionsMonthly(BigDecimal totalDeductionsMonthly) {
        this.totalDeductionsMonthly = totalDeductionsMonthly;
    }

    public BigDecimal getTotalDeductionsYearly() {
        return totalDeductionsYearly;
    }

    public void setTotalDeductionsYearly(BigDecimal totalDeductionsYearly) {
        this.totalDeductionsYearly = totalDeductionsYearly;
    }

    public BigDecimal getHraPercentage() {
        return hraPercentage;
    }

    public void setHraPercentage(BigDecimal hraPercentage) {
        this.hraPercentage = hraPercentage;
    }

    public BigDecimal getDaPercentage() {
        return daPercentage;
    }

    public void setDaPercentage(BigDecimal daPercentage) {
        this.daPercentage = daPercentage;
    }

    public BigDecimal getPfPercentage() {
        return pfPercentage;
    }

    public void setPfPercentage(BigDecimal pfPercentage) {
        this.pfPercentage = pfPercentage;
    }

    public BigDecimal getTdsPercentage() {
        return tdsPercentage;
    }

    public void setTdsPercentage(BigDecimal tdsPercentage) {
        this.tdsPercentage = tdsPercentage;
    }

    public BigDecimal getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(BigDecimal professionalTax) {
        this.professionalTax = professionalTax;
    }

    public BigDecimal getIncentivesMonthly() {
        return incentivesMonthly;
    }

    public void setIncentivesMonthly(BigDecimal incentivesMonthly) {
        this.incentivesMonthly = incentivesMonthly;
    }

    public BigDecimal getIncentivesYearly() {
        return incentivesYearly;
    }

    public void setIncentivesYearly(BigDecimal incentivesYearly) {
        this.incentivesYearly = incentivesYearly;
    }

    public BigDecimal getJoiningBonusMonthly() {
        return joiningBonusMonthly;
    }

    public void setJoiningBonusMonthly(BigDecimal joiningBonusMonthly) {
        this.joiningBonusMonthly = joiningBonusMonthly;
    }

    public BigDecimal getJoiningBonusYearly() {
        return joiningBonusYearly;
    }

    public void setJoiningBonusYearly(BigDecimal joiningBonusYearly) {
        this.joiningBonusYearly = joiningBonusYearly;
    }

    public BigDecimal getOtherEarningsMonthly() {
        return otherEarningsMonthly;
    }

    public void setOtherEarningsMonthly(BigDecimal otherEarningsMonthly) {
        this.otherEarningsMonthly = otherEarningsMonthly;
    }

    public BigDecimal getOtherEarningsYearly() {
        return otherEarningsYearly;
    }

    public void setOtherEarningsYearly(BigDecimal otherEarningsYearly) {
        this.otherEarningsYearly = otherEarningsYearly;
    }

    public BigDecimal getLeaveEncashmentsMonthly() {
        return leaveEncashmentsMonthly;
    }

    public void setLeaveEncashmentsMonthly(BigDecimal leaveEncashmentsMonthly) {
        this.leaveEncashmentsMonthly = leaveEncashmentsMonthly;
    }

    public BigDecimal getLeaveEncashmentsYearly() {
        return leaveEncashmentsYearly;
    }

    public void setLeaveEncashmentsYearly(BigDecimal leaveEncashmentsYearly) {
        this.leaveEncashmentsYearly = leaveEncashmentsYearly;
    }

    public BigDecimal getLwfMonthly() {
        return lwfMonthly;
    }

    public void setLwfMonthly(BigDecimal lwfMonthly) {
        this.lwfMonthly = lwfMonthly;
    }

    public BigDecimal getLwfYearly() {
        return lwfYearly;
    }

    public void setLwfYearly(BigDecimal lwfYearly) {
        this.lwfYearly = lwfYearly;
    }

    public BigDecimal getEsiMonthly() {
        return esiMonthly;
    }

    public void setEsiMonthly(BigDecimal esiMonthly) {
        this.esiMonthly = esiMonthly;
    }

    public BigDecimal getEsiYearly() {
        return esiYearly;
    }

    public void setEsiYearly(BigDecimal esiYearly) {
        this.esiYearly = esiYearly;
    }

    public BigDecimal getLoansMonthly() {
        return loansMonthly;
    }

    public void setLoansMonthly(BigDecimal loansMonthly) {
        this.loansMonthly = loansMonthly;
    }

    public BigDecimal getLoansYearly() {
        return loansYearly;
    }

    public void setLoansYearly(BigDecimal loansYearly) {
        this.loansYearly = loansYearly;
    }

    public BigDecimal getMonthlyProjectedTaxMonthly() {
        return monthlyProjectedTaxMonthly;
    }

    public void setMonthlyProjectedTaxMonthly(BigDecimal monthlyProjectedTaxMonthly) {
        this.monthlyProjectedTaxMonthly = monthlyProjectedTaxMonthly;
    }

    // ===================================
    // ✨ GETTERS/SETTERS FOR ADDED FIELDS ✨
    // ===================================

    public BigDecimal getBonusMonthly() {
        return bonusMonthly;
    }

    public void setBonusMonthly(BigDecimal bonusMonthly) {
        this.bonusMonthly = bonusMonthly;
    }

    public BigDecimal getBonusYearly() {
        return bonusYearly;
    }

    public void setBonusYearly(BigDecimal bonusYearly) {
        this.bonusYearly = bonusYearly;
    }

    public BigDecimal getPfEmployerContributionYearly() {
        return pfEmployerContributionYearly;
    }

    public void setPfEmployerContributionYearly(BigDecimal pfEmployerContributionYearly) {
        this.pfEmployerContributionYearly = pfEmployerContributionYearly;
    }

    public BigDecimal getTotalGrossYearly() {
        return totalGrossYearly;
    }

    public void setTotalGrossYearly(BigDecimal totalGrossYearly) {
        this.totalGrossYearly = totalGrossYearly;
    }

    public BigDecimal getNetPayYearly() {
        return netPayYearly;
    }

    public void setNetPayYearly(BigDecimal netPayYearly) {
        this.netPayYearly = netPayYearly;
    }

    // =========================
    // GETTERS/SETTERS FOR NEW 6 FIELDS (GROSS/EXEMPT/TAXABLE)
    // =========================

    public BigDecimal getBasicDaGross() {
        return basicDaGross;
    }

    public void setBasicDaGross(BigDecimal basicDaGross) {
        this.basicDaGross = basicDaGross;
    }

    public BigDecimal getBasicDaExempt() {
        return basicDaExempt;
    }

    public void setBasicDaExempt(BigDecimal basicDaExempt) {
        this.basicDaExempt = basicDaExempt;
    }

    public BigDecimal getBasicDaTaxable() {
        return basicDaTaxable;
    }

    public void setBasicDaTaxable(BigDecimal basicDaTaxable) {
        this.basicDaTaxable = basicDaTaxable;
    }

    public BigDecimal getHraGross() {
        return hraGross;
    }

    public void setHraGross(BigDecimal hraGross) {
        this.hraGross = hraGross;
    }

    public BigDecimal getHraExempt() {
        return hraExempt;
    }

    public void setHraExempt(BigDecimal hraExempt) {
        this.hraExempt = hraExempt;
    }

    public BigDecimal getHraTaxable() {
        return hraTaxable;
    }

    public void setHraTaxable(BigDecimal hraTaxable) {
        this.hraTaxable = hraTaxable;
    }

    public BigDecimal getConveyanceGross() {
        return conveyanceGross;
    }

    public void setConveyanceGross(BigDecimal conveyanceGross) {
        this.conveyanceGross = conveyanceGross;
    }

    public BigDecimal getConveyanceExempt() {
        return conveyanceExempt;
    }

    public void setConveyanceExempt(BigDecimal conveyanceExempt) {
        this.conveyanceExempt = conveyanceExempt;
    }

    public BigDecimal getConveyanceTaxable() {
        return conveyanceTaxable;
    }

    public void setConveyanceTaxable(BigDecimal conveyanceTaxable) {
        this.conveyanceTaxable = conveyanceTaxable;
    }

    public BigDecimal getSpecialAllowanceGross() {
        return specialAllowanceGross;
    }

    public void setSpecialAllowanceGross(BigDecimal specialAllowanceGross) {
        this.specialAllowanceGross = specialAllowanceGross;
    }

    public BigDecimal getSpecialAllowanceExempt() {
        return specialAllowanceExempt;
    }

    public void setSpecialAllowanceExempt(BigDecimal specialAllowanceExempt) {
        this.specialAllowanceExempt = specialAllowanceExempt;
    }

    public BigDecimal getSpecialAllowanceTaxable() {
        return specialAllowanceTaxable;
    }

    public void setSpecialAllowanceTaxable(BigDecimal specialAllowanceTaxable) {
        this.specialAllowanceTaxable = specialAllowanceTaxable;
    }

    public BigDecimal getBonusGross() {
        return bonusGross;
    }

    public void setBonusGross(BigDecimal bonusGross) {
        this.bonusGross = bonusGross;
    }

    public BigDecimal getBonusExempt() {
        return bonusExempt;
    }

    public void setBonusExempt(BigDecimal bonusExempt) {
        this.bonusExempt = bonusExempt;
    }

    public BigDecimal getBonusTaxable() {
        return bonusTaxable;
    }

    public void setBonusTaxable(BigDecimal bonusTaxable) {
        this.bonusTaxable = bonusTaxable;
    }

    public BigDecimal getPfGross() {
        return pfGross;
    }

    public void setPfGross(BigDecimal pfGross) {
        this.pfGross = pfGross;
    }

    public BigDecimal getPfExempt() {
        return pfExempt;
    }

    public void setPfExempt(BigDecimal pfExempt) {
        this.pfExempt = pfExempt;
    }

    public BigDecimal getPfTaxable() {
        return pfTaxable;
    }

    public void setPfTaxable(BigDecimal pfTaxable) {
        this.pfTaxable = pfTaxable;
    }

    public BigDecimal getIncomeAfterSection10() {
        return incomeAfterSection10;
    }

    public void setIncomeAfterSection10(BigDecimal incomeAfterSection10) {
        this.incomeAfterSection10 = incomeAfterSection10;
    }

    public BigDecimal getProfessionTax() {
        return professionTax;
    }

    public void setProfessionTax(BigDecimal professionTax) {
        this.professionTax = professionTax;
    }

    public BigDecimal getStandardDeduction() {
        return standardDeduction;
    }

    public void setStandardDeduction(BigDecimal standardDeduction) {
        this.standardDeduction = standardDeduction;
    }

    public BigDecimal getTotalViaDeduction() {
        return totalViaDeduction;
    }

    public void setTotalViaDeduction(BigDecimal totalViaDeduction) {
        this.totalViaDeduction = totalViaDeduction;
    }

    public BigDecimal getTaxableIncome() {
        return taxableIncome;
    }

    public void setTaxableIncome(BigDecimal taxableIncome) {
        this.taxableIncome = taxableIncome;
    }

    public BigDecimal getTotalTax() {
        return totalTax;
    }

    public void setTotalTax(BigDecimal totalTax) {
        this.totalTax = totalTax;
    }

    public BigDecimal getEducationCess() {
        return educationCess;
    }

    public void setEducationCess(BigDecimal educationCess) {
        this.educationCess = educationCess;
    }

    public BigDecimal getTaxPrevEmployer() {
        return taxPrevEmployer;
    }

    public void setTaxPrevEmployer(BigDecimal taxPrevEmployer) {
        this.taxPrevEmployer = taxPrevEmployer;
    }

    public BigDecimal getTaxTillDate() {
        return taxTillDate;
    }

    public void setTaxTillDate(BigDecimal taxTillDate) {
        this.taxTillDate = taxTillDate;
    }

    public BigDecimal getTaxToBeDeducted() {
        return taxToBeDeducted;
    }

    public void setTaxToBeDeducted(BigDecimal taxToBeDeducted) {
        this.taxToBeDeducted = taxToBeDeducted;
    }

    public BigDecimal getProjectedTax() {
        return projectedTax;
    }

    public void setProjectedTax(BigDecimal projectedTax) {
        this.projectedTax = projectedTax;
    }

}
