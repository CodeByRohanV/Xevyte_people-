package com.register.example.payload;

// import com.register.example.entity.*;
import com.register.example.entity.LeavestypePolicy;
import com.register.example.entity.LeaveUnifiedPolicy;
// import com.register.example.entity.LeaveApprovalWorkflow;
import lombok.Data;

@Data
public class LeavePolicySummaryResponse {

    /**
     * Core leave policy (CASUAL, SICK, etc.)
     */
    private LeavestypePolicy leavePolicy;

    private java.util.List<LeaveUnifiedPolicy> unifiedPolicies;
    // private LeaveApprovalWorkflow approvalWorkflow;

    // Getters and Setters
    public LeavestypePolicy getLeavePolicy() {
        return leavePolicy;
    }

    public void setLeavePolicy(LeavestypePolicy leavePolicy) {
        this.leavePolicy = leavePolicy;
    }

    public java.util.List<LeaveUnifiedPolicy> getUnifiedPolicies() {
        return unifiedPolicies;
    }

    public void setUnifiedPolicies(java.util.List<LeaveUnifiedPolicy> unifiedPolicies) {
        this.unifiedPolicies = unifiedPolicies;
    }
}
