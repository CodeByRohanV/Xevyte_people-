package com.register.example.payload;

import lombok.Data;

@Data
public class PolicyApprovalActionDTO {
    private Long requestId;
    private String approverId;
    private String action; // APPROVE or REJECT
    private String remarks;
}
