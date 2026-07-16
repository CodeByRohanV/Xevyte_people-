package com.register.example.repository;
 
import com.register.example.entity.KnowledgeHubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
@Repository
public interface KnowledgeHubCategoryRepository extends JpaRepository<KnowledgeHubCategory, Long> {
    java.util.List<KnowledgeHubCategory> findByTenantId(String tenantId);
}
