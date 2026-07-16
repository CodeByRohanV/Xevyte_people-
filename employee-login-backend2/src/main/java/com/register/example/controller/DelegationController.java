package com.register.example.controller;

import com.register.example.entity.Delegation;
import com.register.example.service.DelegationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delegations")
@CrossOrigin(origins = "*")
public class DelegationController {

    @Autowired
    private DelegationService delegationService;

    @PostMapping("/save")
    public ResponseEntity<Delegation> saveDelegation(@RequestBody Delegation delegation) {
        return ResponseEntity.ok(delegationService.saveDelegation(delegation));
    }

    @GetMapping("/delegator/{delegatorId}")
    public ResponseEntity<List<Delegation>> getDelegationsByDelegator(@PathVariable String delegatorId) {
        return ResponseEntity.ok(delegationService.getDelegationsByDelegator(delegatorId));
    }

    @GetMapping("/delegate/{delegateId}")
    public ResponseEntity<List<Delegation>> getDelegationsByDelegate(@PathVariable String delegateId) {
        return ResponseEntity.ok(delegationService.getDelegationsByDelegate(delegateId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteDelegation(@PathVariable Long id) {
        delegationService.deleteDelegation(id);
        return ResponseEntity.ok("Delegation deleted successfully");
    }
}
