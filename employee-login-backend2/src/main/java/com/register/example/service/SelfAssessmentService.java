package com.register.example.service;
 
import com.register.example.payload.SelfAssessmentDto;
import com.register.example.entity.SelfAssessment;
import com.register.example.repository.SelfAssessmentRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
 
import java.util.List;
import java.util.Optional;
 
@Service
public class SelfAssessmentService {
 
    @Autowired
    private SelfAssessmentRepository selfAssessmentRepository;
 
    /**
     * Saves a new SelfAssessment or updates an existing one based on employeeId and goalId.
     *
     * @param dto the data transfer object containing self-assessment data
     * @return the saved or updated SelfAssessment entity
     */
    public SelfAssessment saveOrUpdateSelfAssessment(SelfAssessmentDto dto) {
        // Fetch existing self-assessments by employeeId and goalId
        List<SelfAssessment> existingAssessments = selfAssessmentRepository.findByEmployeeIdAndGoalId(dto.getEmployeeId(), dto.getGoalId());
 
        SelfAssessment assessment;
 
        if (existingAssessments.isEmpty()) {
            // No existing assessment found — create new one
            assessment = new SelfAssessment();
            BeanUtils.copyProperties(dto, assessment);
        } else {
            // Existing assessment found — update the first one (handle duplicates if needed)
            assessment = existingAssessments.get(0);
 
            // Copy properties except id, employeeId, and goalId to avoid overwriting key fields
            BeanUtils.copyProperties(dto, assessment, "id", "employeeId", "goalId");
        }
 
        return selfAssessmentRepository.save(assessment);
    }
 
    /**
     * Retrieves a SelfAssessment by its database ID.
     *
     * @param id the id of the self-assessment
     * @return an Optional containing the SelfAssessment if found, else empty
     */
    public Optional<SelfAssessment> getAssessmentById(Long id) {
        return selfAssessmentRepository.findById(id);
    }
 
    /**
     * Retrieves all SelfAssessments for a given employee.
     *
     * @param employeeId the employee's id
     * @return list of SelfAssessments for the employee
     */
    public List<SelfAssessment> getAssessmentsByEmployeeId(String employeeId) {
        return selfAssessmentRepository.findByEmployeeId(employeeId);
    }
 
}
 
