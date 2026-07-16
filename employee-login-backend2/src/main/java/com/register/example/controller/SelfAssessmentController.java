package com.register.example.controller;
 
import com.register.example.payload.SelfAssessmentDto;
import com.register.example.entity.SelfAssessment;
import com.register.example.service.SelfAssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/api/self-assessments") // adjust for your frontend origin
public class SelfAssessmentController {
 
    @Autowired
    private SelfAssessmentService selfAssessmentService;
 
    /**
     * Create or update a self-assessment (upsert).
     */
    @PostMapping("/save")
    public ResponseEntity<SelfAssessment> saveAssessment(@RequestBody SelfAssessmentDto selfAssessmentDto) {
        SelfAssessment savedAssessment = selfAssessmentService.saveOrUpdateSelfAssessment(selfAssessmentDto);
        return ResponseEntity.ok(savedAssessment);
    }
 
    /**
     * Get self-assessment by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SelfAssessment> getAssessmentById(@PathVariable Long id) {
        return selfAssessmentService.getAssessmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
 
    /**
     * Get all self-assessments for a specific employee.
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SelfAssessment>> getAssessmentsByEmployeeId(@PathVariable String employeeId) {
        List<SelfAssessment> assessments = selfAssessmentService.getAssessmentsByEmployeeId(employeeId);
        return ResponseEntity.ok(assessments);
    }
 
}
 
 
