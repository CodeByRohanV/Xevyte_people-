package com.register.example.payload;

public class ApplicantRequest {
	private String applicantId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private String client;
    private String resumeName;
    private String base64Resume;
    private String amId;    // Add this
    private String hrId;    // Optional for future
    private String proposedCtc;
    private String financeId;

    private String workLocation;
    private String doj;
    private String notes;
    
    private String variablePay;
    private String designation;
    private String noticePeriod;
    
    private Object verificationStatus;



    // --- Getters and Setters ---
    
    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }

    public String getResumeName() { return resumeName; }
    public void setResumeName(String resumeName) { this.resumeName = resumeName; }

    public String getBase64Resume() { return base64Resume; }
    public void setBase64Resume(String base64Resume) { this.base64Resume = base64Resume; }
    public String getAmId() { return amId; }
    public void setAmId(String amId) { this.amId = amId; }

    public String getHrId() { return hrId; }
    public void setHrId(String hrId) { this.hrId = hrId; }
    
    public String getProposedCtc() { return proposedCtc; }
    public void setProposedCtc(String proposedCtc) { this.proposedCtc = proposedCtc; }


    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }

    public String getDoj() { return doj; }
    public void setDoj(String doj) { this.doj = doj; }
    
    public String getFinanceId() { return financeId; }
    public void setFinanceId(String financeId) { this.financeId = financeId; }


    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
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

    
    public Object getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(Object verificationStatus) {
        this.verificationStatus = verificationStatus;
    }


}
