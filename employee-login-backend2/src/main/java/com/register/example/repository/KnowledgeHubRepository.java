package com.register.example.repository;
 
import com.register.example.entity.KnowledgeHub;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
 
@Repository
public interface KnowledgeHubRepository extends JpaRepository<KnowledgeHub, Long> {
 
    Optional<KnowledgeHub> findTopByOrderByUploadedAtDesc();
    
    java.util.List<KnowledgeHub> findAllByOrderByUploadedAtDesc();
    
    Optional<KnowledgeHub> findTopByTenantIdOrderByUploadedAtDesc(String tenantId);
    
    java.util.List<KnowledgeHub> findAllByTenantIdOrderByUploadedAtDesc(String tenantId);
}
