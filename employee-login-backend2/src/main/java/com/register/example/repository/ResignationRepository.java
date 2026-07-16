package com.register.example.repository;

import com.register.example.entity.ExitReason;
import com.register.example.entity.Resignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDate;

@Repository
public interface ResignationRepository extends JpaRepository<Resignation, Long> {

    List<Resignation> findByEmployeeId(String employeeId);
    List<Resignation> findByStatus(String status);

    // ================================================================
    // 🔹 MANAGER VIEW
    // Manager sees:
    //  - Pending Approval
    //  - Approved by Reviewer
    // ================================================================
    @Query("SELECT r FROM Resignation r WHERE r.assignedManagerId = :managerId AND r.status IN ('Pending Approval', 'Approved by Reviewer')")
    List<Resignation> findPendingResignationsForManager(@Param("managerId") String managerId);

    @Query("SELECT r FROM Resignation r WHERE r.assignedReviewerId = :reviewerId AND r.status IN ('Pending Approval', 'Approved by Manager')")
    List<Resignation> findPendingResignationsForReviewer(@Param("reviewerId") String reviewerId);

    @Query("SELECT r FROM Resignation r WHERE r.assignedHrId = :hrId AND r.status IN ('Approved by Manager and Reviewer', 'HR Approved', 'Admin Cleared', 'HR Cleared')")
    List<Resignation> findApprovedResignationsForHR(@Param("hrId") String hrId);

    @Query("SELECT r FROM Resignation r WHERE r.assignedAdminId = :adminId AND r.status IN ('HR Approved', 'HR Cleared', 'Admin Cleared')")
    List<Resignation> findPendingResignationsForAdmin(@Param("adminId") String adminId);

    @Query("SELECT r FROM Resignation r WHERE r.assignedFinanceId = :financeId AND r.status = 'Clearance Completed'")
    List<Resignation> findPendingResignationsForFinance(@Param("financeId") String financeId);

    // ================================================================
    // 🔹 Shared Clearance Dashboard (Optional)
    // ================================================================
    @Query("""
           SELECT r FROM Resignation r
           WHERE r.status IN (
               'Approved by Manager and Reviewer',
               'HR Approved',
               'Admin Cleared',
               'HR Cleared',
               'Clearance Completed'
           )
           """)
    List<Resignation> findAllClearanceInProgress();

    @Query("""
           SELECT r FROM Resignation r
           WHERE (:searchEmployeeIds IS NULL OR r.employeeId IN :searchEmployeeIds)
           AND (:status IS NULL OR r.status = :status)
           AND (:reason IS NULL OR r.reasonForExit = :reason)
           AND (:startDate IS NULL OR r.lastWorkingDay >= :startDate)
           AND (:endDate IS NULL OR r.lastWorkingDay <= :endDate)
           AND (:tenantEmployeeIds IS NULL OR r.employeeId IN :tenantEmployeeIds)
           """)
    List<Resignation> getFilteredResignations(
            @Param("searchEmployeeIds") List<String> searchEmployeeIds,
            @Param("status") String status,
            @Param("reason") String reason,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("tenantEmployeeIds") List<String> tenantEmployeeIds
    );
}
