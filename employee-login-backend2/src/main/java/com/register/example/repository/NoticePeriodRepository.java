package com.register.example.repository;

import com.register.example.entity.NoticePeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticePeriodRepository extends JpaRepository<NoticePeriod, Long> {
    java.util.Optional<NoticePeriod> findByTenantId(String tenantId);
}
