package com.register.example.repository;

import com.register.example.entity.TravelRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TravelRequestRepository
                extends JpaRepository<TravelRequest, Long>, JpaSpecificationExecutor<TravelRequest> {
    List<TravelRequest> findByAssignedManagerId(String assignedManagerId);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.employeeId = :employeeId ORDER BY tr.createdAt DESC")
        List<TravelRequest> findByEmployeeIdOrderByCreatedAtDesc(@Param("employeeId") String employeeId);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.assignedManagerId = :assignedManagerId AND tr.status = :status")
        List<TravelRequest> findByAssignedManagerIdAndStatus(@Param("assignedManagerId") String assignedManagerId,
                        @Param("status") String status);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.employeeId = :employeeId AND tr.status IN :statuses ORDER BY tr.createdAt DESC")
        List<TravelRequest> findByEmployeeIdAndStatusInOrderByCreatedAtDesc(@Param("employeeId") String employeeId,
                        @Param("statuses") List<String> statuses);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.assignedManagerId = :assignedManagerId ORDER BY tr.createdAt DESC")
        List<TravelRequest> findByAssignedManagerIdOrderByCreatedAtDesc(
                        @Param("assignedManagerId") String assignedManagerId);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.status = :status AND (tr.travelAdmin = :adminId OR tr.travelAdmin LIKE concat(:adminId, ',%') OR tr.travelAdmin LIKE concat('%,', :adminId, ',%') OR tr.travelAdmin LIKE concat('%,', :adminId))")
        List<TravelRequest> findByStatusAndTravelAdmin(@Param("status") String status,
                        @Param("adminId") String adminId);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.travelAdmin = :travelAdmin")
        List<TravelRequest> findByTravelAdmin(@Param("travelAdmin") String travelAdmin);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.employeeId = :employeeId AND tr.status = :status")
        List<TravelRequest> findByEmployeeIdAndStatus(@Param("employeeId") String employeeId,
                        @Param("status") String status);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.assignedManagerId IS NOT NULL AND tr.status = :status")
        List<TravelRequest> findByAssignedManagerIdIsNotNullAndStatus(@Param("status") String status);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.status = :status AND tr.travelAdmin IS NOT NULL")
        List<TravelRequest> findByStatusAndTravelAdminIsNotNull(@Param("status") String status);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE tr.employeeId = :employeeId AND tr.assignedManagerId = :assignedManagerId AND tr.status = :status")
        List<TravelRequest> findByEmployeeIdAndAssignedManagerIdAndStatus(@Param("employeeId") String employeeId,
                        @Param("assignedManagerId") String assignedManagerId, @Param("status") String status);

        @Query("SELECT tr FROM TravelRequest tr JOIN FETCH tr.employee WHERE (tr.employeeId = :employeeId OR tr.employeeId LIKE concat(:employeeId, ' %') OR tr.employeeId LIKE concat(' %', :employeeId)) AND (tr.assignedManagerId = :assignedManagerId OR tr.assignedManagerId LIKE concat(:assignedManagerId, ' %') OR tr.assignedManagerId LIKE concat(' %', :assignedManagerId)) AND tr.status = :status")
        List<TravelRequest> findByEmployeeIdAndAssignedManagerIdAndStatusWithLike(@Param("employeeId") String employeeId,
                        @Param("assignedManagerId") String assignedManagerId, @Param("status") String status);
}