package com.register.example.repository;

import com.register.example.entity.AllCategories;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AllCategoriesRepository extends JpaRepository<AllCategories, Long> {
    List<AllCategories> findByTenantId(String tenantId);
}
