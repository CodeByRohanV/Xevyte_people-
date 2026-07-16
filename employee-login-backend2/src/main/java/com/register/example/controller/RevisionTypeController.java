package com.register.example.controller;

import com.register.example.entity.RevisionType;
import com.register.example.repository.RevisionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/revision-types")
public class RevisionTypeController {

    @Autowired
    private RevisionTypeRepository revisionTypeRepository;

    @GetMapping
    public List<RevisionType> getAll() {
        List<RevisionType> allTypes = revisionTypeRepository.findAll();
        // Use a LinkedHashMap to preserve order while removing duplicates by name
        java.util.Map<String, RevisionType> uniqueMap = new java.util.LinkedHashMap<>();
        for (RevisionType type : allTypes) {
            if (type.getTypeName() != null) {
                // If multiple exist, we keep the first one found
                uniqueMap.putIfAbsent(type.getTypeName().trim(), type);
            }
        }
        return new java.util.ArrayList<>(uniqueMap.values());
    }

    @PostMapping
    public ResponseEntity<RevisionType> create(@RequestBody RevisionType revisionType) {
        if (revisionType.getTypeName() == null || revisionType.getTypeName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(revisionTypeRepository.save(revisionType));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        revisionTypeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
