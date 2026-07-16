package com.register.example.controller;

import com.register.example.entity.SalaryComponent;
import com.register.example.repository.SalaryComponentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salary-components")
public class SalaryComponentController {

    @Autowired
    private SalaryComponentRepository repository;

    @GetMapping
    public List<SalaryComponent> getAll() {
        return repository.findAllByOrderBySortOrderAsc();
    }

    @PostMapping
    public SalaryComponent create(@RequestBody SalaryComponent component) {
        return repository.save(component);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryComponent> update(@PathVariable Long id, @RequestBody SalaryComponent details) {
        return repository.findById(id).map(existing -> {
            existing.setName(details.getName());
            existing.setPlaceholder(details.getPlaceholder());
            existing.setType(details.getType());
            existing.setCalculationType(details.getCalculationType()); // PERCENTAGE, FLAT, REMAINDER
            existing.setCalculationValue(details.getCalculationValue());
            existing.setFormula(details.getFormula());
            existing.setSourceComponent(details.getSourceComponent()); // FIXED_CTC, BASIC
            existing.setSection(details.getSection());
            existing.setSortOrder(details.getSortOrder());
            existing.setActive(details.isActive());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
