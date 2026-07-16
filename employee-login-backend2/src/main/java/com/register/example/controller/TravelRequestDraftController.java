package com.register.example.controller;
 
import com.register.example.entity.TravelRequestDraft;
import com.register.example.service.TravelRequestDraftService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/api/travel/drafts")
public class TravelRequestDraftController {
 
    private final TravelRequestDraftService draftService;
 
    public TravelRequestDraftController(TravelRequestDraftService draftService) {
        this.draftService = draftService;
    }
 
    // Get all drafts for an employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TravelRequestDraft>> getDraftsByEmployee(@PathVariable String employeeId) {
        List<TravelRequestDraft> drafts = draftService.getDraftsByEmployee(employeeId);
        return ResponseEntity.ok(drafts);
    }
 
    // Get specific draft by id and employeeId for ownership check
    @GetMapping("/{id}")
    public ResponseEntity<TravelRequestDraft> getDraftById(
            @PathVariable Long id,
            @RequestParam String employeeId) {
        TravelRequestDraft draft = draftService.getDraftByIdAndEmployee(id, employeeId);
        return ResponseEntity.ok(draft);
    }
 
    // Create or update a draft (upsert)
    @PostMapping
    public ResponseEntity<TravelRequestDraft> saveDraft(@RequestBody TravelRequestDraft draft) {
        TravelRequestDraft savedDraft = draftService.saveDraft(draft);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedDraft);
    }
 
    // Delete a draft by id and employeeId for ownership check
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraft(
            @PathVariable Long id,
            @RequestParam String employeeId) {
        draftService.deleteDraft(id, employeeId);
        return ResponseEntity.noContent().build();
    }
    
// GET /api/travel/drafts?employeeId=EMP123
    @GetMapping
    public ResponseEntity<List<TravelRequestDraft>> getDraftsByEmployeeQuery(
            @RequestParam String employeeId) {
        List<TravelRequestDraft> drafts = draftService.getDraftsByEmployee(employeeId);
        return ResponseEntity.ok(drafts);
    }
 
}
 
 