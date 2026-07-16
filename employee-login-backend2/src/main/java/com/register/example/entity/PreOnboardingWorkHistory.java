package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "preonboarding_work_history")
public class PreOnboardingWorkHistory {

 

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;   // ✅ PRIMARY KEY

    @Column(name = "applicant_id", nullable = false, length = 50)
    private String applicantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "applicant_id",
            referencedColumnName = "applicant_id",
            insertable = false,
            updatable = false
    )
    private Applicant applicant;


    @Column(length = 200)
    private String companyName;

    @Column(length = 200)
    private String officeLocation;

    @Column(length = 150)
    private String designation;

    private LocalDate dateOfJoining;

    private LocalDate dateOfRelieving;

    @Column(length = 50)
    private String employeeId;

    @Column(length = 100)
    private String salaryDrawn; // CTC PM/PA

    @Column(length = 150)
    private String reportingManagerName;

    @Column(length = 150)
    private String reportingManagerEmail;

    @Column(length = 20)
    private String reportingManagerPhone;

    @Column(length = 150)
    private String hrManagerName;

    @Column(length = 150)
    private String hrManagerEmail;

    @Column(length = 20)
    private String hrManagerPhone;

    @Column(length = 500)
    private String reasonForLeaving;

    // OFFER/APPOINTMENT LETTER
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] offerLetter;

    @Column(length = 150)
    private String offerLetterName;

    @Column(length = 50)
    private String offerLetterType;

    // LAST 3 MONTHS PAYSLIPS (Single PDF)
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] payslips;

    @Column(length = 150)
    private String payslipsName;

    @Column(length = 50)
    private String payslipsType;

    // RELIEVING / EXPERIENCE LETTER
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] relievingLetter;

    @Column(length = 150)
    private String relievingLetterName;

    @Column(length = 50)
    private String relievingLetterType;

    // PF SERVICE HISTORY
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pfServiceHistory;

    @Column(length = 150)
    private String pfServiceHistoryName;

    @Column(length = 50)
    private String pfServiceHistoryType;

    // FORM 16
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] form16;

    @Column(length = 150)
    private String form16Name;

    @Column(length = 50)
    private String form16Type;


    /* ===================== GETTERS & SETTERS ======================= */

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }


    public Applicant getApplicant() { return applicant; }
    public void setApplicant(Applicant applicant) { this.applicant = applicant; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getOfficeLocation() { return officeLocation; }
    public void setOfficeLocation(String officeLocation) { this.officeLocation = officeLocation; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public LocalDate getDateOfRelieving() { return dateOfRelieving; }
    public void setDateOfRelieving(LocalDate dateOfRelieving) { this.dateOfRelieving = dateOfRelieving; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getSalaryDrawn() { return salaryDrawn; }
    public void setSalaryDrawn(String salaryDrawn) { this.salaryDrawn = salaryDrawn; }

    public String getReportingManagerName() { return reportingManagerName; }
    public void setReportingManagerName(String reportingManagerName) { this.reportingManagerName = reportingManagerName; }

    public String getReportingManagerEmail() { return reportingManagerEmail; }
    public void setReportingManagerEmail(String reportingManagerEmail) { this.reportingManagerEmail = reportingManagerEmail; }

    public String getReportingManagerPhone() { return reportingManagerPhone; }
    public void setReportingManagerPhone(String reportingManagerPhone) { this.reportingManagerPhone = reportingManagerPhone; }

    public String getHrManagerName() { return hrManagerName; }
    public void setHrManagerName(String hrManagerName) { this.hrManagerName = hrManagerName; }

    public String getHrManagerEmail() { return hrManagerEmail; }
    public void setHrManagerEmail(String hrManagerEmail) { this.hrManagerEmail = hrManagerEmail; }

    public String getHrManagerPhone() { return hrManagerPhone; }
    public void setHrManagerPhone(String hrManagerPhone) { this.hrManagerPhone = hrManagerPhone; }

    public String getReasonForLeaving() { return reasonForLeaving; }
    public void setReasonForLeaving(String reasonForLeaving) { this.reasonForLeaving = reasonForLeaving; }

    public byte[] getOfferLetter() { return offerLetter; }
    public void setOfferLetter(byte[] offerLetter) { this.offerLetter = offerLetter; }

    public String getOfferLetterName() { return offerLetterName; }
    public void setOfferLetterName(String offerLetterName) { this.offerLetterName = offerLetterName; }

    public String getOfferLetterType() { return offerLetterType; }
    public void setOfferLetterType(String offerLetterType) { this.offerLetterType = offerLetterType; }

    public byte[] getPayslips() { return payslips; }
    public void setPayslips(byte[] payslips) { this.payslips = payslips; }

    public String getPayslipsName() { return payslipsName; }
    public void setPayslipsName(String payslipsName) { this.payslipsName = payslipsName; }

    public String getPayslipsType() { return payslipsType; }
    public void setPayslipsType(String payslipsType) { this.payslipsType = payslipsType; }

    public byte[] getRelievingLetter() { return relievingLetter; }
    public void setRelievingLetter(byte[] relievingLetter) { this.relievingLetter = relievingLetter; }

    public String getRelievingLetterName() { return relievingLetterName; }
    public void setRelievingLetterName(String relievingLetterName) { this.relievingLetterName = relievingLetterName; }

    public String getRelievingLetterType() { return relievingLetterType; }
    public void setRelievingLetterType(String relievingLetterType) { this.relievingLetterType = relievingLetterType; }

    public byte[] getPfServiceHistory() { return pfServiceHistory; }
    public void setPfServiceHistory(byte[] pfServiceHistory) { this.pfServiceHistory = pfServiceHistory; }

    public String getPfServiceHistoryName() { return pfServiceHistoryName; }
    public void setPfServiceHistoryName(String pfServiceHistoryName) { this.pfServiceHistoryName = pfServiceHistoryName; }

    public String getPfServiceHistoryType() { return pfServiceHistoryType; }
    public void setPfServiceHistoryType(String pfServiceHistoryType) { this.pfServiceHistoryType = pfServiceHistoryType; }

    public byte[] getForm16() { return form16; }
    public void setForm16(byte[] form16) { this.form16 = form16; }

    public String getForm16Name() { return form16Name; }
    public void setForm16Name(String form16Name) { this.form16Name = form16Name; }

    public String getForm16Type() { return form16Type; }
    public void setForm16Type(String form16Type) { this.form16Type = form16Type; }
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

}
