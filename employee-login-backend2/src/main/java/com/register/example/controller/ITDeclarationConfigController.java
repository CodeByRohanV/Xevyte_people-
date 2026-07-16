package com.register.example.controller;

import com.register.example.entity.ITDeclarationConfig;
import com.register.example.service.ITDeclarationConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/it-declaration-configs")
@CrossOrigin(origins = "*")
public class ITDeclarationConfigController {

    @Autowired
    private ITDeclarationConfigService configService;

    @GetMapping
    public ResponseEntity<ITDeclarationConfig> getConfig(@RequestParam(required = false) String financialYear) {
        return ResponseEntity.ok(configService.getConfig(financialYear));
    }

    @PostMapping
    public ResponseEntity<ITDeclarationConfig> saveConfig(@RequestBody ITDeclarationConfig config) {
        return ResponseEntity.ok(configService.saveConfig(config));
    }
}
