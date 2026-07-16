package com.register.example.repository;

import com.register.example.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByTenantId(String tenantId);
    List<Category> findByTeamNameAndTicketTypeAndTenantId(String teamName, String ticketType, String tenantId);
    List<Category> findByTicketTypeIgnoreCaseAndTenantId(String ticketType, String tenantId);
    Optional<Category> findByCategoryNameIgnoreCaseAndTenantId(String categoryName, String tenantId);
    Optional<Category> findByCategoryNameIgnoreCaseAndTicketTypeIgnoreCaseAndTenantId(String categoryName, String ticketType, String tenantId);

    Optional<Category> findByTeamNameAndTicketTypeAndCategoryNameAndTenantId(String teamName, String ticketType, String categoryName, String tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c.ticketType FROM Category c WHERE c.tenantId = :tenantId")
    List<String> findDistinctTicketTypesByTenantId(@org.springframework.data.repository.query.Param("tenantId") String tenantId);
}
