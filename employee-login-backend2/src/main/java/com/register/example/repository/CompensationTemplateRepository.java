package com.register.example.repository;

import com.register.example.entity.CompensationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompensationTemplateRepository extends JpaRepository<CompensationTemplate, Long> {
    Optional<CompensationTemplate> findByTemplateName(String templateName);

    List<CompensationTemplate> findByCategory(String category);
}
