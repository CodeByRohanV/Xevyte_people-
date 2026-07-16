package com.register.example.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Entity
@Table(name = "compensation_details", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employee_id", "effective_date" })
})
@Data
@EqualsAndHashCode(callSuper = true)
public class CompensationDetails extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

 @Column(name = "employee_id", length = 50)
private String employeeId;

    @Column(name = "current_fixed_ctc")
    private Double currentFixedCtc;

    @Column(name = "current_variable_pay")
    private Double currentVariablePay;

    @Column(name = "proposed_fixed_ctc")
    private Double proposedFixedCtc;

    @Column(name = "proposed_variable_pay")
    private Double proposedVariablePay;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "year")
    private Integer year;

    @Column(name = "hike_percentage")
    private Double hikePercentage;

    @Column(name = "fixed_hike_percentage")
    private Double fixedHikePercentage;

    @Column(name = "variable_hike_percentage")
    private Double variableHikePercentage;

    @Column(name = "total_proposed_ctc")
    private Double totalProposedCtc;

@Column(name = "approval_status", length = 50)
private String approvalStatus;// PENDING_MANAGER, PENDING_FINANCE, PENDING_HR, APPROVED, REJECTED, DRAFT

    @Column(name = "approval_stage")
    private Integer approvalStage; // 0=Draft/None, 1=Manager, 2=Finance, 3=HR, 4=Approved

 @Column(name = "current_approver_id", length = 50)
private String currentApproverId;


@Column(name = "initiator_id", length = 50)
private String initiatorId;

    @Column(name = "manager_comments", length = 1000)
    private String managerComments;

    @Column(name = "finance_comments", length = 1000)
    private String financeComments;

    @Column(name = "hr_comments", length = 1000)
    private String hrComments;

    @Column(name = "approver_comments", length = 1000)
    private String approverComments;

@Column(name = "revision_type", length = 50)
private String revisionType;

@Column(name = "proposed_designation", length = 50)
private String proposedDesignation;

    public String getProposedDesignation() {
        return proposedDesignation;
    }

    public void setProposedDesignation(String proposedDesignation) {
        this.proposedDesignation = proposedDesignation;
    }
}
