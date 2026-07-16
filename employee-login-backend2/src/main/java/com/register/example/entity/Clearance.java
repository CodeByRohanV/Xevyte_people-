package com.register.example.entity;
//
import jakarta.persistence.*;
import java.time.LocalDate;
//
@Entity
@Table(name = "clearance")
public class Clearance {
//
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
//
    // --- Admin fields (Asset Return/Access Revocation) ---
    @Column(name = "laptop_serial", length = 100)
    private String laptopSerial;
//
    @Column(name = "access_card")
    private Boolean accessCard;
//
    @Column(name = "email_closed")
    private Boolean emailClosed;
//
    @Column(name = "vpn_revoked")
    private Boolean vpnRevoked;
//
    @Column(name = "software_deallocated")
    private Boolean softwareDeallocated;
//
    @Column(name = "id_card_returned")
    private Boolean idCardReturned;
//
    // --- Per-item comments (Admin) ---
    @Column(name = "access_card_comment", length = 500)
    private String accessCardComment;
//
    @Column(name = "email_closed_comment", length = 500)
    private String emailClosedComment;
//
    @Column(name = "vpn_revoked_comment", length = 500)
    private String vpnRevokedComment;
//
    @Column(name = "software_deallocated_comment", length = 500)
    private String softwareDeallocatedComment;
//
    @Column(name = "id_card_returned_comment", length = 500)
    private String idCardReturnedComment;
//
    // --- HR fields (Process/Internal Checklist) ---
    @Column(name = "exit_interview_completed")
    private Boolean exitInterviewCompleted;
//
    @Column(name = "document_handover")
    private Boolean documentHandover;
//
    @Column(name = "knowledge_transfer")
    private Boolean knowledgeTransfer;
//
    @Column(name = "timesheet_filled")
    private Boolean timesheetFilled;
//
    @Column(name = "insurance_deactivation")
    private Boolean insuranceDeactivation;
//
    @Column(name = "hr_final_approval")
    private Boolean hrFinalApproval;
//
    // --- Per-item comments (HR) ---
    @Column(name = "exit_interview_comment", length = 500)
    private String exitInterviewComment;
//
    @Column(name = "document_handover_comment", length = 500)
    private String documentHandoverComment;
//
    @Column(name = "knowledge_transfer_comment", length = 500)
    private String knowledgeTransferComment;
//
    @Column(name = "timesheet_filled_comment", length = 500)
    private String timesheetFilledComment;
//
    @Column(name = "insurance_deactivation_comment", length = 500)
    private String insuranceDeactivationComment;
//
    // --- HR Editable Field ---
    @Column(name = "last_working_day")
    private LocalDate lastWorkingDay;
//
    // --- General field ---
    @Column(name = "hr_comments", length = 1000)
    private String hrComments;
//
    @Column(name = "admin_comments", length = 1000)
    private String adminComments;
//
    // --- File storage fields (paths/filenames) ---
    @Column(name = "hr_document_path", length = 500)
    private String hrDocumentPath;
//
    @Column(name = "admin_document_path", length = 500)
    private String adminDocumentPath;
//
    // --- Relationship with Resignation ---
    @OneToOne
    @JoinColumn(name = "resignation_id", referencedColumnName = "id")
    private Resignation resignation;
//
    // --- Constructors ---
    public Clearance() {
        // Empty constructor required for JPA
    }
//
    // full constructor omitted for brevity in real project; use builder or setters
//
    // --- Getters and Setters ---
    public Long getId() {
        return id;
    }
//
    public void setId(Long id) {
        this.id = id;
    }
//
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
    public LocalDate getLastWorkingDay() {
        return lastWorkingDay;
    }
//
    public void setLastWorkingDay(LocalDate lastWorkingDay) {
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
    public String getHrDocumentPath() {
        return hrDocumentPath;
    }
//
    public void setHrDocumentPath(String hrDocumentPath) {
        this.hrDocumentPath = hrDocumentPath;
    }
//
    public String getAdminDocumentPath() {
        return adminDocumentPath;
    }
//
    public void setAdminDocumentPath(String adminDocumentPath) {
        this.adminDocumentPath = adminDocumentPath;
    }
//
    public Resignation getResignation() {
        return resignation;
    }
//
    public void setResignation(Resignation resignation) {
        this.resignation = resignation;
    }
}
