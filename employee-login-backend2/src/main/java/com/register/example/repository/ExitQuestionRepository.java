package com.register.example.repository;

import com.register.example.entity.ExitQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExitQuestionRepository extends JpaRepository<ExitQuestion, Long> {

    // IMPORTANT: Used in ResignationService
    List<ExitQuestion> findAllByOrderByDisplayOrderAsc();

    @org.springframework.data.jpa.repository.Query("SELECT q FROM ExitQuestion q WHERE q.tenantId = :tenantId OR q.tenantId IS NULL ORDER BY q.displayOrder ASC")
    List<ExitQuestion> findQuestionsByTenantIdOrGlobal(@org.springframework.data.repository.query.Param("tenantId") String tenantId);
}
