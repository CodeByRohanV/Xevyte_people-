package com.register.example.repository;

import com.register.example.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByTimestampBefore(LocalDateTime timestamp);

    Page<AuditLog> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    Page<AuditLog> findByModuleOrderByTimestampDesc(String module, Pageable pageable);

    Page<AuditLog> findByActionTypeOrderByTimestampDesc(String actionType, Pageable pageable);

    Page<AuditLog> findByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, Long entityId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    Page<AuditLog> findByTimestampBetween(@Param("startDate") LocalDateTime startDate, 
                                          @Param("endDate") LocalDateTime endDate, 
                                          Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId AND a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    Page<AuditLog> findByUserIdAndTimestampBetween(@Param("userId") String userId,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate,
                                                   Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.module = :module AND a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    Page<AuditLog> findByModuleAndTimestampBetween(@Param("module") String module,
                                                  @Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate,
                                                  Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId AND a.module = :module ORDER BY a.timestamp DESC")
    Page<AuditLog> findByUserIdAndModule(@Param("userId") String userId,
                                         @Param("module") String module,
                                         Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.referenceId = :referenceId ORDER BY a.timestamp DESC")
    List<AuditLog> findByReferenceId(@Param("referenceId") String referenceId);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate")
    Long countByTimestampBetween(@Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate);

    @Query("SELECT a.module, COUNT(a) FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate GROUP BY a.module")
    List<Object[]> countByModuleBetween(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);
}
