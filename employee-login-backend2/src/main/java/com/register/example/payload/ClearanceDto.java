package com.register.example.payload;
//
import jakarta.validation.constraints.Size;
//
public class ClearanceDto {
//
    // Admin fields
    private String laptopSerial;
//
    private Boolean accessCard;
    private Boolean emailClosed;
    private Boolean vpnRevoked;
    private Boolean softwareDeallocated;
    private Boolean idCardReturned;
//
    private Boolean isFinal = false;
    private String actingRole;
//
    // Admin per-item comments
    @Size(max = 500)
    private String accessCardComment;
    @Size(max = 500)
    private String emailClosedComment;
    @Size(max = 500)
    private String vpnRevokedComment;
    @Size(max = 500)
    private String softwareDeallocatedComment;
    @Size(max = 500)
    private String idCardReturnedComment;
//
    // HR fields
    private Boolean exitInterviewCompleted;
    private Boolean documentHandover;
    private Boolean knowledgeTransfer;
    private Boolean timesheetFilled;
    private Boolean insuranceDeactivation;
    private Boolean hrFinalApproval;
//
    // HR per-item comments
    @Size(max = 500)
    private String exitInterviewComment;
    @Size(max = 500)
    private String documentHandoverComment;
    @Size(max = 500)
    private String knowledgeTransferComment;
    @Size(max = 500)
    private String timesheetFilledComment;
    @Size(max = 500)
    private String insuranceDeactivationComment;
//
    // HR editable Last Working Day - expected from frontend as "dd-MM-yyyy"
    private String lastWorkingDay;
//
    // General comments
    // General comments
    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    private String hrComments;
//
    @Size(max = 1000, message = "Server comments cannot exceed 1000 characters")
    private String adminComments;
//
    // --- Getters and setters ---
    public String getLaptopSerial() {
        return laptopSerial;
    }
//
    public void setLaptopSerial(String laptopSerial) {
        this.laptopSerial = laptopSerial;
    }
//
    public Boolean getAccessCard() {
        return accessCard;
    }
//
    public void setAccessCard(Boolean accessCard) {
        this.accessCard = accessCard;
    }
//
    public Boolean getEmailClosed() {
        return emailClosed;
    }
//
    public void setEmailClosed(Boolean emailClosed) {
        this.emailClosed = emailClosed;
    }
//
    public Boolean getVpnRevoked() {
        return vpnRevoked;
    }
//
    public void setVpnRevoked(Boolean vpnRevoked) {
        this.vpnRevoked = vpnRevoked;
    }
//
    public Boolean getSoftwareDeallocated() {
        return softwareDeallocated;
    }
//
    public void setSoftwareDeallocated(Boolean softwareDeallocated) {
        this.softwareDeallocated = softwareDeallocated;
    }
//
    public Boolean getIdCardReturned() {
        return idCardReturned;
    }
//
    public void setIdCardReturned(Boolean idCardReturned) {
        this.idCardReturned = idCardReturned;
    }
//
    public String getAccessCardComment() {
        return accessCardComment;
    }
//
    public void setAccessCardComment(String accessCardComment) {
        this.accessCardComment = accessCardComment;
    }
//
    public String getEmailClosedComment() {
        return emailClosedComment;
    }
//
    public void setEmailClosedComment(String emailClosedComment) {
        this.emailClosedComment = emailClosedComment;
    }
//
    public String getVpnRevokedComment() {
        return vpnRevokedComment;
    }
//
    public void setVpnRevokedComment(String vpnRevokedComment) {
        this.vpnRevokedComment = vpnRevokedComment;
    }
//
    public String getSoftwareDeallocatedComment() {
        return softwareDeallocatedComment;
    }
//
    public void setSoftwareDeallocatedComment(String softwareDeallocatedComment) {
        this.softwareDeallocatedComment = softwareDeallocatedComment;
    }
//
    public String getIdCardReturnedComment() {
        return idCardReturnedComment;
    }
//
    public void setIdCardReturnedComment(String idCardReturnedComment) {
        this.idCardReturnedComment = idCardReturnedComment;
    }
//
    public Boolean getExitInterviewCompleted() {
        return exitInterviewCompleted;
    }
//
    public void setExitInterviewCompleted(Boolean exitInterviewCompleted) {
        this.exitInterviewCompleted = exitInterviewCompleted;
    }
//
    public Boolean getDocumentHandover() {
        return documentHandover;
    }
//
    public void setDocumentHandover(Boolean documentHandover) {
        this.documentHandover = documentHandover;
    }
//
    public Boolean getKnowledgeTransfer() {
        return knowledgeTransfer;
    }
//
    public void setKnowledgeTransfer(Boolean knowledgeTransfer) {
        this.knowledgeTransfer = knowledgeTransfer;
    }
//
    public Boolean getTimesheetFilled() {
        return timesheetFilled;
    }
//
    public void setTimesheetFilled(Boolean timesheetFilled) {
        this.timesheetFilled = timesheetFilled;
    }
//
    public Boolean getInsuranceDeactivation() {
        return insuranceDeactivation;
    }
//
    public void setInsuranceDeactivation(Boolean insuranceDeactivation) {
        this.insuranceDeactivation = insuranceDeactivation;
    }
//
    public Boolean getHrFinalApproval() {
        return hrFinalApproval;
    }
//
    public void setHrFinalApproval(Boolean hrFinalApproval) {
        this.hrFinalApproval = hrFinalApproval;
    }
//
    public String getExitInterviewComment() {
        return exitInterviewComment;
    }
//
    public void setExitInterviewComment(String exitInterviewComment) {
        this.exitInterviewComment = exitInterviewComment;
    }
//
    public String getDocumentHandoverComment() {
        return documentHandoverComment;
    }
//
    public void setDocumentHandoverComment(String documentHandoverComment) {
        this.documentHandoverComment = documentHandoverComment;
    }
//
    public String getKnowledgeTransferComment() {
        return knowledgeTransferComment;
    }
//
    public void setKnowledgeTransferComment(String knowledgeTransferComment) {
        this.knowledgeTransferComment = knowledgeTransferComment;
    }
//
    public String getTimesheetFilledComment() {
        return timesheetFilledComment;
    }
//
    public void setTimesheetFilledComment(String timesheetFilledComment) {
        this.timesheetFilledComment = timesheetFilledComment;
    }
//
    public String getInsuranceDeactivationComment() {
        return insuranceDeactivationComment;
    }
//
    public void setInsuranceDeactivationComment(String insuranceDeactivationComment) {
        this.insuranceDeactivationComment = insuranceDeactivationComment;
    }
//
    public String getLastWorkingDay() {
        return lastWorkingDay;
    }
//
    public void setLastWorkingDay(String lastWorkingDay) {
        this.lastWorkingDay = lastWorkingDay;
    }
//
    public String getHrComments() {
        return hrComments;
    }
//
    public void setHrComments(String hrComments) {
        this.hrComments = hrComments;
    }
//
    public String getAdminComments() {
        return adminComments;
    }
//
    public void setAdminComments(String adminComments) {
        this.adminComments = adminComments;
    }
//
    public Boolean getIsFinal() {
        return isFinal;
    }
//
    public void setIsFinal(Boolean isFinal) {
        this.isFinal = isFinal;
    }
//
    public String getActingRole() {
        return actingRole;
    }
//
    public void setActingRole(String actingRole) {
        this.actingRole = actingRole;
    }
}
