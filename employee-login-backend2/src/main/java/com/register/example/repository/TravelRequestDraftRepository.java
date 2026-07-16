package com.register.example.repository;
 
import com.register.example.entity.TravelRequestDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface TravelRequestDraftRepository extends JpaRepository<TravelRequestDraft, Long> {
 
    // Find all drafts for a given employee
    List<TravelRequestDraft> findByEmployeeIdOrderByUpdatedAtDesc(String employeeId);
 
    // Find a draft by ID and employee ID (for ownership validation)
    TravelRequestDraft findByIdAndEmployeeId(Long id, String employeeId);
 
    // Delete a draft by ID and employee ID
    void deleteByIdAndEmployeeId(Long id, String employeeId);
 
    // Check existence of a draft by ID and employee ID
    boolean existsByIdAndEmployeeId(Long id, String employeeId);
}
 