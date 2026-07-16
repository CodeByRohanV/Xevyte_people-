package com.register.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.register.example.entity.AssetDropdownOption;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetDropdownOptionRepository extends JpaRepository<AssetDropdownOption, Long> {
    List<AssetDropdownOption> findByType(String type);

    List<AssetDropdownOption> findByTypeOrderBySortOrderAsc(String type);

    Optional<AssetDropdownOption> findByTypeAndValue(String type, String value);

    boolean existsByTypeAndValue(String type, String value);

    List<AssetDropdownOption> findByTypeAndTenantId(String type, String tenantId);

    List<AssetDropdownOption> findByTypeAndTenantIdOrderBySortOrderAsc(String type, String tenantId);

    Optional<AssetDropdownOption> findByTypeAndValueAndTenantId(String type, String value, String tenantId);

    boolean existsByTypeAndValueAndTenantId(String type, String value, String tenantId);
    
    Optional<AssetDropdownOption> findByIdAndTenantId(Long id, String tenantId);
}
