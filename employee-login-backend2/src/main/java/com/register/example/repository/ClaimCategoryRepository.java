package com.register.example.repository;

import com.register.example.entity.ClaimCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimCategoryRepository extends JpaRepository<ClaimCategory, Long> {

    // Get all active categories
    List<ClaimCategory> findByActiveTrue();

    // Get all active categories by tenant
    List<ClaimCategory> findByActiveTrueAndTenantId(String tenantId);

    // Get all active categories by tenant or generic (tenantId is null)
    List<ClaimCategory> findByActiveTrueAndTenantIdOrActiveTrueAndTenantIdIsNull(String tenantId);

    // Check if category exists by name (case-insensitive)
    Optional<ClaimCategory> findByCategoryNameIgnoreCase(String categoryName);

    // Check if category exists by name and tenant (case-insensitive)
    Optional<ClaimCategory> findByCategoryNameIgnoreCaseAndTenantId(String categoryName, String tenantId);

    // Used to prevent delete if category is already used
    boolean existsByCategoryName(String categoryName);

    boolean existsByCategoryNameAndTenantId(String categoryName, String tenantId);
}
