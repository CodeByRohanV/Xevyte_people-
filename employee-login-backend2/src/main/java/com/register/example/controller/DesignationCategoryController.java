package com.register.example.controller;

import com.register.example.entity.DesignationCategory;
import com.register.example.repository.DesignationCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/designation-categories")
@CrossOrigin(origins = "*")
public class DesignationCategoryController {

    @Autowired
    private DesignationCategoryRepository designationCategoryRepository;

    @GetMapping
    public List<DesignationCategory> getAll() {
        return designationCategoryRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<DesignationCategory> create(@RequestBody DesignationCategory category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        category.setName(category.getName().trim());
        return ResponseEntity.ok(designationCategoryRepository.save(category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        designationCategoryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
