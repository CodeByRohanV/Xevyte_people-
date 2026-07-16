package com.register.example.repository;
 
import com.register.example.entity.SelfAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface SelfAssessmentRepository extends JpaRepository<SelfAssessment, Long> {
 
    List<SelfAssessment> findByEmployeeId(String employeeId);  // Changed from Long to String
 
    List<SelfAssessment> findByEmployeeIdAndGoalId(String employeeId, Long goalId);  // Changed
}
 
