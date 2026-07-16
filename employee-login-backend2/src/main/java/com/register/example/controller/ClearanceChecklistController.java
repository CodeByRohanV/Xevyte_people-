package com.register.example.controller;

import com.register.example.entity.ClearanceChecklist;
import com.register.example.repository.ClearanceChecklistRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/clearance/checklist")
public class ClearanceChecklistController {

    private final ClearanceChecklistRepository repo;

    public ClearanceChecklistController(ClearanceChecklistRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public ResponseEntity<Object> saveChecklist(@RequestBody ClearanceChecklist dto) {
        return ResponseEntity.ok(repo.save(dto));
    }

    @GetMapping("/{department}")
    public ResponseEntity<Object> getChecklist(@PathVariable String department) {
        try {
            List<ClearanceChecklist> list =
                    repo.findByDepartmentIgnoreCase(department);

            return ResponseEntity.ok(list == null ? List.of() : list);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching checklist: " + e.getMessage());
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteChecklist(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}


