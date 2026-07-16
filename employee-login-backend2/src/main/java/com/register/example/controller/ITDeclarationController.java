package com.register.example.controller;

import com.register.example.entity.ITDeclaration;
import com.register.example.service.ITDeclarationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/it-declarations")
@CrossOrigin(origins = "*")
public class ITDeclarationController {

    @Autowired
    private ITDeclarationService itDeclarationService;

    @PostMapping("/{employeeId}")
    public ResponseEntity<ITDeclaration> saveOrUpdate(@PathVariable String employeeId, @RequestBody ITDeclaration declaration) {
        return ResponseEntity.ok(itDeclarationService.saveOrUpdateITDeclaration(employeeId, declaration));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<List<ITDeclaration>> getByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(itDeclarationService.getDeclarationsByEmployee(employeeId));
    }

    @GetMapping("/{employeeId}/{financialYear}")
    public ResponseEntity<ITDeclaration> getByEmployeeAndYear(@PathVariable String employeeId, @PathVariable String financialYear, @RequestParam(required = false) String requesterId) {
        ITDeclaration declaration = itDeclarationService.getDeclarationByEmployeeAndYear(employeeId, financialYear, requesterId);
        return ResponseEntity.ok(declaration); // Returns 200 OK with null if not found
    }

    @GetMapping("/all")
    public ResponseEntity<List<ITDeclaration>> getAll() {
        return ResponseEntity.ok(itDeclarationService.getAllDeclarations());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ITDeclaration>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(itDeclarationService.getDeclarationsByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ITDeclaration> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(itDeclarationService.updateStatus(id, status));
    }

    @GetMapping("/is-finance/{employeeId}")
    public ResponseEntity<Boolean> isFinancePerson(@PathVariable String employeeId) {
        return ResponseEntity.ok(itDeclarationService.isFinancePerson(employeeId));
    }

    @GetMapping("/finance/{financeId}")
    public ResponseEntity<List<ITDeclaration>> getFinanceDeclarations(@PathVariable String financeId) {
        return ResponseEntity.ok(itDeclarationService.getDeclarationsByFinanceId(financeId));
    }

    @GetMapping("/finance/view/{employeeId}/{financialYear}")
    public ResponseEntity<ITDeclaration> getFinanceDeclarationView(@PathVariable String employeeId, @PathVariable String financialYear) {
        return ResponseEntity.ok(itDeclarationService.getDeclarationForFinance(employeeId, financialYear));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body("IT Declaration Error: " + e.getMessage());
    }
}
