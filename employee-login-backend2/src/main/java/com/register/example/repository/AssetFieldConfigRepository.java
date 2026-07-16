package com.register.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.register.example.entity.AssetCategory;
import com.register.example.entity.AssetFieldConfig;

import java.util.List;

@Repository
public interface AssetFieldConfigRepository extends JpaRepository<AssetFieldConfig, Long> {
    List<AssetFieldConfig> findByCategoryAndActiveTrueOrderByDisplayOrderAsc(AssetCategory category);

    List<AssetFieldConfig> findByCategoryAndActiveTrueAndTenantIdOrderByDisplayOrderAsc(AssetCategory category, String tenantId);
    
    java.util.Optional<AssetFieldConfig> findByIdAndTenantId(Long id, String tenantId);
}
