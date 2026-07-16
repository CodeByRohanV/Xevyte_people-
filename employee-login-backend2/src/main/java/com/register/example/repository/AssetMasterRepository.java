package com.register.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.register.example.entity.AssetMaster;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetMasterRepository extends JpaRepository<AssetMaster, Long> {
    @Query("SELECT DISTINCT a FROM AssetMaster a " +
           "LEFT JOIN FETCH a.dynamicValues " +
           "LEFT JOIN FETCH a.category " +
           "LEFT JOIN FETCH a.subCategory " +
           "LEFT JOIN FETCH a.assignedToEmployee " +
           "WHERE a.active = true ORDER BY a.createdAt DESC")
    List<AssetMaster> findByActiveTrue();

    // Tenant-scoped version
    @Query("SELECT DISTINCT a FROM AssetMaster a " +
           "LEFT JOIN FETCH a.dynamicValues " +
           "LEFT JOIN FETCH a.category " +
           "LEFT JOIN FETCH a.subCategory " +
           "LEFT JOIN FETCH a.assignedToEmployee " +
           "WHERE a.active = true AND a.createdBy LIKE CONCAT(:tenantId, '_%') ORDER BY a.createdAt DESC")
    List<AssetMaster> findByActiveTrueAndTenantId(@Param("tenantId") String tenantId);

    Optional<AssetMaster> findTopByOrderByIdDesc();

    @Query("SELECT a.assetId FROM AssetMaster a WHERE a.assetId LIKE 'AST-%'")
    List<String> findAllAssetIdsStartingWithAST();

    Optional<AssetMaster> findByAssetId(String assetId);

    Optional<AssetMaster> findByAssetTag(String assetTag);

    Optional<AssetMaster> findBySerialNumber(String serialNumber);

    boolean existsByAssetTagAndActiveTrue(String assetTag);

    boolean existsBySerialNumberAndActiveTrue(String serialNumber);

    // Tenant-scoped uniqueness checks (only active assets — soft-deleted assets must not block tag reuse)
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AssetMaster a WHERE a.assetTag = :assetTag AND a.active = true AND a.createdBy LIKE CONCAT(:tenantId, '_%')")
    boolean existsByAssetTagAndTenantId(@Param("assetTag") String assetTag, @Param("tenantId") String tenantId);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AssetMaster a WHERE a.serialNumber = :serialNumber AND a.active = true AND a.createdBy LIKE CONCAT(:tenantId, '_%')")
    boolean existsBySerialNumberAndTenantId(@Param("serialNumber") String serialNumber, @Param("tenantId") String tenantId);

    long countByActiveTrue();

    long countByStatusAndActiveTrue(String status);

    // Tenant-scoped counts
    @Query("SELECT COUNT(a) FROM AssetMaster a WHERE a.active = true AND a.createdBy LIKE CONCAT(:tenantId, '_%')")
    long countByActiveTrueAndTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT COUNT(a) FROM AssetMaster a WHERE a.status = :status AND a.active = true AND a.createdBy LIKE CONCAT(:tenantId, '_%')")
    long countByStatusAndActiveTrueAndTenantId(@Param("status") String status, @Param("tenantId") String tenantId);

    boolean existsByCategory(com.register.example.entity.AssetCategory category);

    boolean existsBySubCategory(com.register.example.entity.AssetCategory subCategory);

    @Query("SELECT a FROM AssetMaster a WHERE a.category.id = :categoryId")
    List<AssetMaster> findByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT a FROM AssetMaster a WHERE a.subCategory.id = :subCategoryId")
    List<AssetMaster> findBySubCategory(@Param("subCategoryId") Long subCategoryId);

    @Query("SELECT DISTINCT a.status FROM AssetMaster a")
    List<String> findDistinctStatus();

    @Query("SELECT DISTINCT a.conditionAtStock FROM AssetMaster a")
    List<String> findDistinctConditionAtStock();

    @Query("SELECT a FROM AssetMaster a WHERE a.category.id = :categoryId AND a.active = true AND KEY(a.dynamicValues) = :fieldName AND VALUE(a.dynamicValues) = :fieldValue")
    List<AssetMaster> findByCategoryAndDynamicFieldValue(@Param("categoryId") Long categoryId,
            @Param("fieldName") String fieldName, @Param("fieldValue") String fieldValue);
}
