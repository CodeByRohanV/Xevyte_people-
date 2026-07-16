package com.register.example.payload;

/**
 * DTO for Applicant data exposed to external applications
 */
public class ApplicantExternalDto {

    private String applicantId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private String client;
    private String status;
    private String timestamp;
    private String amId;
    private String hrId;
    private String financeId;
    private String fixedCtc;
    private String approvedLocation;
    private String approvedDoj;
    private String variablePay;

    // Constructors
    public ApplicantExternalDto() {
        // Empty constructor required for deserialization
    }

    // Getters and Setters
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

    public String getFinanceId() {
        return financeId;
    }

    public void setFinanceId(String financeId) {
        this.financeId = financeId;
    }

    public String getFixedCtc() {
        return fixedCtc;
    }

    public void setFixedCtc(String fixedCtc) {
        this.fixedCtc = fixedCtc;
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

    public String getVariablePay() {
        return variablePay;
    }

    public void setVariablePay(String variablePay) {
        this.variablePay = variablePay;
    }
}
