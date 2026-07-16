package com.register.example.repository;

import com.register.example.entity.Claim;
import com.register.example.entity.ClaimCategory;
import com.register.example.payload.ClaimHistoryDto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long>, JpaSpecificationExecutor<Claim> {

    // ================= EXISTING (UNCHANGED) =================

    // Get all claims assigned to a specific next approver (Manager / Finance / HR)
    List<Claim> findByNextApprover(String nextApprover);

    // Get all claims for a specific employee (⚠️ slow – loads BLOB)
    List<Claim> findByEmployeeId(String employeeId);

    // Get claims assigned to a nextApprover but not with a certain status
    List<Claim> findByNextApproverAndStatusNot(String nextApprover, String status);

    // Get claims by status and nextApprover
    List<Claim> findByStatusAndNextApprover(String status, String nextApprover);

    // Get claims for a manager (based on assignedManagerId field)
    @Query("SELECT c FROM Claim c WHERE c.assignedManagerId = :managerId AND c.nextApprover = 'Manager'")
    List<Claim> findByAssignedManagerId(@Param("managerId") String managerId);

    // Get claims for finance (based on assignedFinanceId field)
    @Query("SELECT c FROM Claim c WHERE c.assignedFinanceId = :financeId AND c.nextApprover = 'Finance'")
    List<Claim> findByAssignedFinanceId(@Param("financeId") String financeId);

    // Get claims for HR (based on assignedHrId field)
    @Query("SELECT c FROM Claim c WHERE c.assignedHrId = :hrId AND c.nextApprover = 'HR'")
    List<Claim> findByAssignedHrId(@Param("hrId") String hrId);

    // ================= FAST HISTORY (NEW) =================
    // 🚀 DOES NOT load receipt BLOB
    // 🚀 Used only for Claim History Page
    @Query("""
                SELECT new com.register.example.payload.ClaimHistoryDto(
                    c.id,
                    c.employeeId,
                    c.name,
                    c.category,
                    c.amount,
                    c.expenseDate,
                    c.submittedDate,
                    c.status,
                    c.receiptName,
                    c.expenseDescription,
                    c.rejectionReason,
                    c.claimGroupId
                )
                FROM Claim c
                WHERE c.employeeId = :employeeId
                ORDER BY c.id DESC
            """)
    List<ClaimHistoryDto> findClaimHistoryFast(@Param("employeeId") String employeeId);

    // ================= CATEGORIES =================
    @Query("SELECT c FROM ClaimCategory c WHERE c.active = true")
    List<ClaimCategory> findActiveCategories();
}
