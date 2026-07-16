package com.register.example.controller;

import com.register.example.entity.ITDeclarationField;
import com.register.example.service.ITDeclarationFieldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/it-declaration-fields")
@CrossOrigin(origins = "*")
public class ITDeclarationFieldController {

    @Autowired
    private ITDeclarationFieldService service;

    @GetMapping("/card/{cardId}")
    public ResponseEntity<List<ITDeclarationField>> getFieldsByCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(service.getFieldsByCard(cardId));
    }

    @PostMapping("/card/{cardId}/save")
    public ResponseEntity<ITDeclarationField> saveField(@PathVariable Long cardId,
            @RequestBody ITDeclarationField field) {
        return ResponseEntity.ok(service.saveField(field, cardId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteField(@PathVariable Long id) {
        service.deleteField(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<ITDeclarationField>> getAllFields(@RequestParam(required = false) String financialYear) {
        return ResponseEntity.ok(service.getAllFields(financialYear));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        e.printStackTrace(); // Log the actual stack trace to the console/logs
        return ResponseEntity.status(500).body("Error: " + e.getMessage());
    }
}
