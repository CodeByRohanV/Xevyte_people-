package com.register.example.repository;

import com.register.example.entity.ITDeclarationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ITDeclarationConfigRepository extends JpaRepository<ITDeclarationConfig, Long> {
    // We only expect one configuration record
    Optional<ITDeclarationConfig> findFirstByOrderByIdDesc();

    Optional<ITDeclarationConfig> findByFinancialYear(String financialYear);
}
