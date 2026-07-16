package com.register.example.controller;

import com.register.example.entity.ITDeclarationCard;
import com.register.example.service.ITDeclarationCardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/it-declaration-cards")
@CrossOrigin(origins = "*")
public class ITDeclarationCardController {

    @Autowired
    private ITDeclarationCardService service;

    @GetMapping("/all")
    public ResponseEntity<List<ITDeclarationCard>> getAllCards(@RequestParam(required = false) String financialYear) {
        return ResponseEntity.ok(service.getAllCards(financialYear));
    }

    @GetMapping("/absolute-all")
    public ResponseEntity<List<ITDeclarationCard>> getAllCardsAbsolute() {
        return ResponseEntity.ok(service.getAllCardsAbsolute());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ITDeclarationCard>> getActiveCards(@RequestParam(required = false) String financialYear) {
        return ResponseEntity.ok(service.getAllActiveCards(financialYear));
    }

    @PostMapping("/clone")
    public ResponseEntity<Void> cloneConfiguration(@RequestParam String fromYear, @RequestParam String toYear) {
        service.cloneConfiguration(fromYear, toYear);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/save")
    public ResponseEntity<ITDeclarationCard> saveCard(@RequestBody ITDeclarationCard card) {
        return ResponseEntity.ok(service.saveOrUpdateCard(card));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        service.deleteCard(id);
        return ResponseEntity.ok().build();
    }
}
