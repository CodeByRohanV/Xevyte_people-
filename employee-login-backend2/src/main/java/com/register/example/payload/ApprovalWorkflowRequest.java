package com.register.example.payload;
 
import lombok.Data;

import java.util.List;
 
@Data

public class ApprovalWorkflowRequest {
 
    // ✅ REQUIRED: maps workflow to a specific Leave Type

    private Long leaveTypeId;
 
    // Auto approval flag

    private boolean autoApprove;
 
    // Total approval levels

    private int totalLevels;
 
    // Approval levels removed as per requested decommissioning
}

 