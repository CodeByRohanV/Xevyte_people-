package com.register.example.repository;

import com.register.example.entity.ModuleAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ModuleAccessRepository extends JpaRepository<ModuleAccess, Long> {

    @Query("""
        SELECT m FROM ModuleAccess m
        WHERE TRIM(UPPER(m.moduleKey)) = TRIM(UPPER(:moduleKey))
    """)
    Optional<ModuleAccess> findByModuleKeySafe(@Param("moduleKey") String moduleKey);
}
