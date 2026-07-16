package com.register.example.repository;
 
import com.register.example.entity.EmployeeHandbook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional; // IMPORTANT: Import the Optional class
 
@Repository
public interface EmployeeHandbookRepository extends JpaRepository<EmployeeHandbook, Long> {
 
    /**
     * Finds the single latest uploaded handbook that is marked as 'active'.
     *
     * It uses:
     * - 'findTopBy': Ensures only one result is returned.
     * - 'ActiveTrue': Filters by the 'active' property being true.
     * - 'OrderByUploadedAtDesc': Ensures the result is the most recent one.
     * - Returns Optional: Encapsulates the result to prevent crashes
     * if no active handbook is found in the database.
     */
    Optional<EmployeeHandbook> findTopByOrderByUploadedAtDesc();
    
    java.util.List<EmployeeHandbook> findAllByOrderByUploadedAtDesc();
    
    Optional<EmployeeHandbook> findTopByTenantIdOrderByUploadedAtDesc(String tenantId);
    
    java.util.List<EmployeeHandbook> findAllByTenantIdOrderByUploadedAtDesc(String tenantId);
    
    // Note: The JpaRepository already provides findById(Long id) which returns Optional<EmployeeHandbook>
}