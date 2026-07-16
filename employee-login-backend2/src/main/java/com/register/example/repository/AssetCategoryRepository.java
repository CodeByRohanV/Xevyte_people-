package com.register.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.register.example.entity.AssetCategory;

import java.util.List;

@Repository
public interface AssetCategoryRepository extends JpaRepository<AssetCategory, Long> {
    List<AssetCategory> findByParentCategoryIsNull();

    List<AssetCategory> findByParentCategory(AssetCategory parentCategory);

    boolean existsByName(String name);

    List<AssetCategory> findByTenantId(String tenantId);

    List<AssetCategory> findByParentCategoryIsNullAndTenantId(String tenantId);

    List<AssetCategory> findByParentCategoryAndTenantId(AssetCategory parentCategory, String tenantId);

    boolean existsByNameAndTenantId(String name, String tenantId);
    
    java.util.Optional<AssetCategory> findByIdAndTenantId(Long id, String tenantId);
}
