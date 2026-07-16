package com.register.example.repository;

import com.register.example.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("""
                SELECT DISTINCT c
                FROM Customer c
                JOIN Sow s ON s.customer = c
                JOIN Project p ON p.sow = s
                JOIN Allocation a ON a.project = p
                WHERE a.employeeId = :employeeId
            """)
    List<Customer> findCustomersByEmployeeId(String employeeId);

    boolean existsByCustomerName(String customerName);

    boolean existsByCustomerNameAndTenantId(String customerName, String tenantId);

    List<Customer> findByTenantId(String tenantId);

    @Query("SELECT MAX(c.tenantCustomerId) FROM Customer c WHERE c.tenantId = :tenantId")
    Long findMaxTenantCustomerIdByTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT MAX(c.tenantCustomerId) FROM Customer c WHERE c.tenantId IS NULL OR c.tenantId = ''")
    Long findMaxTenantCustomerIdWithoutTenant();
}
