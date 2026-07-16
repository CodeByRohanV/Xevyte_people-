package com.register.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.register.example.entity.AssetAuditLog;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssetAuditLogRepository extends JpaRepository<AssetAuditLog, Long> {
    List<AssetAuditLog> findByAssetIdOrderByTimestampDesc(Long assetId);

    List<AssetAuditLog> findTop5ByOrderByTimestampDesc();

    @Query("SELECT a FROM AssetAuditLog a WHERE a.timestamp < :cutoffDate")
    List<AssetAuditLog> findByTimestampBefore(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);

    @Query("SELECT a FROM AssetAuditLog a WHERE a.assetId = :assetId AND a.userId LIKE CONCAT(:tenantId, '_%') ORDER BY a.timestamp DESC")
    List<AssetAuditLog> findByAssetIdAndTenantIdOrderByTimestampDesc(@Param("assetId") Long assetId, @Param("tenantId") String tenantId);

    List<AssetAuditLog> findTop5ByUserIdStartingWithOrderByTimestampDesc(String userIdPrefix);

    List<AssetAuditLog> findByTimestampBeforeAndUserIdStartingWith(LocalDateTime cutoffDate, String userIdPrefix);
}
