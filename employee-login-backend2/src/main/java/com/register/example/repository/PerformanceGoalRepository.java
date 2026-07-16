package com.register.example.repository;
 
import com.register.example.entity.PerformanceGoal;

import com.register.example.payload.EmployeeGoalStatusDTO;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;
 
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
 
import java.util.List;
 
public interface PerformanceGoalRepository

                extends JpaRepository<PerformanceGoal, Long>, JpaSpecificationExecutor<PerformanceGoal> {
 
        List<PerformanceGoal> findByEmployeeId(String employeeId);
 
        List<PerformanceGoal> findByAssignedBy(String assignedBy);
 
        List<PerformanceGoal> findByAssignedByAndStatus(String assignedBy, String status);
 
        List<PerformanceGoal> findByEmployeeIdInAndStatus(List<String> employeeIds, String status);
 
        // 🔹 Scheduler methods

        List<PerformanceGoal> findByStatus(String status);
 
        List<PerformanceGoal> findByStatusIn(List<String> statuses);
 
        // 🔹 Goal History methods

        List<PerformanceGoal> findByStatusInAndIsArchived(List<String> statuses, boolean isArchived);
 
        List<PerformanceGoal> findByEmployeeIdAndIsArchived(String employeeId, boolean isArchived);
 
        List<PerformanceGoal> findByEmployeeIdAndIsArchivedAndArchivedHalfContaining(

                        String employeeId, boolean isArchived, String year);
 
        // ✅✅ ✅ FINAL FIXED PROJECTION QUERY

        @Query("""

                            SELECT new com.register.example.payload.EmployeeGoalStatusDTO(

                                e.employeeId,

                                e.firstName,

                                e.lastName,

                                g.goalTitle,

                                g.status

                            )

                            FROM PerformanceGoal g

                            JOIN Employee e ON g.employeeId = e.employeeId

                            WHERE g.assignedBy = :managerId

                        """)

        List<EmployeeGoalStatusDTO> findEmployeeGoalsByManager(@Param("managerId") String managerId);

}

 