package com.register.example.controller;

import com.register.example.entity.LMS;
import com.register.example.dto.LMSTrainingDTO;
import com.register.example.service.LMSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// @RestController
// @RequestMapping("/api/lms")
// @CrossOrigin(origins = "http://localhost:3000")
public class LMSController {

    @Autowired
    private LMSService lmsService;

    @PostMapping("/assign")
    public ResponseEntity<LMS> assignTraining(@RequestBody LMS lms) {
        return ResponseEntity.ok(lmsService.saveTraining(lms));
    }

    @PostMapping("/assign-all")
    public ResponseEntity<List<LMS>> assignTrainingToAll(@RequestBody LMS lms) {
        return ResponseEntity.ok(lmsService.assignToAll(lms));
    }

    @GetMapping("/all")
    public ResponseEntity<List<LMS>> getAllTrainings() {
        return ResponseEntity.ok(lmsService.getAllTrainings());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LMS>> getTrainingsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(lmsService.getTrainingsByEmployeeId(employeeId));
    }

    @GetMapping("/employee/{employeeId}/category/{category}")
    public ResponseEntity<List<LMS>> getTrainingsByEmployeeAndCategory(
            @PathVariable String employeeId,
            @PathVariable String category) {
        return ResponseEntity.ok(lmsService.getTrainingsByEmployeeAndCategory(employeeId, category));
    }

    @PutMapping("/update-progress/{id}")
    public ResponseEntity<LMS> updateProgress(@PathVariable Long id, @RequestParam Integer progress) {
        LMS updated = lmsService.updateProgress(id, progress);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/update-status/{id}")
    public ResponseEntity<LMS> updateStatus(@PathVariable Long id, @RequestParam String status) {
        LMS updated = lmsService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/team-trainings/{managerId}")
    public ResponseEntity<List<LMSTrainingDTO>> getTeamTrainings(@PathVariable String managerId) {
        return ResponseEntity.ok(lmsService.getTeamTrainings(managerId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTraining(@PathVariable Long id) {
        lmsService.deleteTraining(id);
        return ResponseEntity.ok().build();
    }
}
