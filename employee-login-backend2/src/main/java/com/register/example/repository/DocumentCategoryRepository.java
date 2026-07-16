package com.register.example.repository;

import com.register.example.entity.DocumentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentCategoryRepository extends JpaRepository<DocumentCategory, Long> {
    java.util.List<DocumentCategory> findByTenantId(String tenantId);
}
