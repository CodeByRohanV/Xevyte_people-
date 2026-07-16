package com.register.example.payload;

public class LeaveActionDTO {

    private Long leaveRequestId;
    private String approverId; // Manager or HR ID
    private String role;       // "Manager" or "HR"
    private String action;     // "Approve" or "Reject"
    private String remarks;

    // ===== Getters & Setters =====
    public Long getLeaveRequestId() { return leaveRequestId; }
    public void setLeaveRequestId(Long leaveRequestId) { this.leaveRequestId = leaveRequestId; }

    public String getApproverId() { return approverId; }
    public void setApproverId(String approverId) { this.approverId = approverId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
