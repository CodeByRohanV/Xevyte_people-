package com.register.example.entity;

import jakarta.persistence.*;

import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "applicants")
public class Applicant {

    @Id
    @Column(name = "applicant_id", length = 50)
    private String applicantId;

  @Column(name = "first_name", length = 50)
private String firstName;
 @Column(name = "last_name", length = 50)
private String lastName;
   
@Column(name = "email", length = 50)
private String email;
 
@Column(name = "phone", length = 50)
private String phone;
  
  @Column(name = "position", length = 50)
private String position;

  
   @Column(name = "client", length = 50)
private String client;
    
    @Column(name = "resume_name", length = 50)
private String resumeName;

   
@Column(name = "status", length = 50)
private String status;

  
@Column(name = "timestamp", length = 50)
private String timestamp;

    // New fields
    @Column(name = "am_id", length = 50)
    private String amId;

    @Column(name = "hr_id", length = 50)
    private String hrId;

    @Column(columnDefinition = "LONGTEXT")
    private String onboardingData;

    @Column(columnDefinition = "LONGTEXT")
    private String base64Resume;

  @Column(name = "fixed_ctc", length = 50)
private String fixedCtc;

 @Column(name = "approved_location", length = 100)
private String approvedLocation;

@Column(name = "approved_doj", length = 50)
private String approvedDoj;

    @Column(columnDefinition = "LONGTEXT")
    private String approvalNotes;

    @Column(name = "finance_id", length = 50)
    private String financeId;

    @Column(columnDefinition = "LONGTEXT")
    private String revisionReason;

   @Column(name = "variable_pay", length = 50)
private String variablePay;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "notice_period", length = 100)
    private String noticePeriod;

    private String signedOfferLetter;
    private String signedAppointmentLetter;
    private String signedDocument3;

    @Column(columnDefinition = "LONGTEXT")
    private String verificationStatus; // JSON saved as text

    @Column(columnDefinition = "LONGTEXT")
    private String dropReason;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "applicant_rejected_docs", joinColumns = @JoinColumn(name = "applicant_id", referencedColumnName = "applicant_id"))
    @Column(name = "document_key")
    private List<String> rejectedDocuments = new ArrayList<>();

    // ----------- GETTERS & SETTERS ------------ //

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getClient() {
        return client;
    }

    public void setClient(String client) {
        this.client = client;
    }

    public String getResumeName() {
        return resumeName;
    }

    public void setResumeName(String resumeName) {
        this.resumeName = resumeName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getAmId() {
        return amId;
    }

    public void setAmId(String amId) {
        this.amId = amId;
    }

    public String getHrId() {
        return hrId;
    }

    public void setHrId(String hrId) {
        this.hrId = hrId;
    }

    public String getOnboardingData() {
        return onboardingData;
    }

    public void setOnboardingData(String onboardingData) {
        this.onboardingData = onboardingData;
    }

    public String getBase64Resume() {
        return base64Resume;
    }

    public void setBase64Resume(String base64Resume) {
        this.base64Resume = base64Resume;
    }

    public String getFixedCtc() {
        return fixedCtc;
    }

    public void setFixedCtc(String fixedCtc) {
        this.fixedCtc = fixedCtc;
    }

    public String getFinanceId() {
        return financeId;
    }

    public void setFinanceId(String financeId) {
        this.financeId = financeId;
    }

    public String getApprovedLocation() {
        return approvedLocation;
    }

    public void setApprovedLocation(String approvedLocation) {
        this.approvedLocation = approvedLocation;
    }

    public String getApprovedDoj() {
        return approvedDoj;
    }

    public void setApprovedDoj(String approvedDoj) {
        this.approvedDoj = approvedDoj;
    }

    public String getApprovalNotes() {
        return approvalNotes;
    }

    public void setApprovalNotes(String approvalNotes) {
        this.approvalNotes = approvalNotes;
    }

    public String getRevisionReason() {
        return revisionReason;
    }

    public void setRevisionReason(String revisionReason) {
        this.revisionReason = revisionReason;
    }

    public String getVariablePay() {
        return variablePay;
    }

    public void setVariablePay(String variablePay) {
        this.variablePay = variablePay;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getNoticePeriod() {
        return noticePeriod;
    }

    public void setNoticePeriod(String noticePeriod) {
        this.noticePeriod = noticePeriod;
    }

    public String getSignedOfferLetter() {
        return signedOfferLetter;
    }

    public void setSignedOfferLetter(String signedOfferLetter) {
        this.signedOfferLetter = signedOfferLetter;
    }

    public String getSignedAppointmentLetter() {
        return signedAppointmentLetter;
    }

    public void setSignedAppointmentLetter(String signedAppointmentLetter) {
        this.signedAppointmentLetter = signedAppointmentLetter;
    }

    public String getSignedDocument3() {
        return signedDocument3;
    }

    public void setSignedDocument3(String signedDocument3) {
        this.signedDocument3 = signedDocument3;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getDropReason() {
        return dropReason;
    }

    public void setDropReason(String dropReason) {
        this.dropReason = dropReason;
    }

    public List<String> getRejectedDocuments() {
        return rejectedDocuments;
    }

    public void setRejectedDocuments(List<String> rejectedDocuments) {
        this.rejectedDocuments = rejectedDocuments;
    }

}