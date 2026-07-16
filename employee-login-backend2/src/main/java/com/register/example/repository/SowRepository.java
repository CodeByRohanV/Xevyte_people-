package com.register.example.repository;

import com.register.example.entity.Sow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SowRepository extends JpaRepository<Sow, Long> {
    List<Sow> findByCustomerCustomerId(Long customerId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Sow s WHERE s.sowName = :sowName AND s.customer.customerId = :customerId")
    boolean existsBySowNameAndCustomerCustomerId(@Param("sowName") String sowName,
            @Param("customerId") Long customerId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Sow s WHERE s.sowName = :sowName AND s.customer.customerId = :customerId AND s.tenantId = :tenantId")
    boolean existsBySowNameAndCustomerCustomerIdAndTenantId(@Param("sowName") String sowName,
            @Param("customerId") Long customerId, @Param("tenantId") String tenantId);

    List<Sow> findByTenantId(String tenantId);

    List<Sow> findByCustomerCustomerIdAndTenantId(Long customerId, String tenantId);

    @Query("SELECT MAX(s.tenantSowId) FROM Sow s WHERE s.tenantId = :tenantId")
    Long findMaxTenantSowIdByTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT MAX(s.tenantSowId) FROM Sow s WHERE s.tenantId IS NULL OR s.tenantId = ''")
    Long findMaxTenantSowIdWithoutTenant();
}
