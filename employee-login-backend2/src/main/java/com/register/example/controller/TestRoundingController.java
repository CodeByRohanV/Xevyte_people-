package com.register.example.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestRoundingController {

    @GetMapping("/round")
    public String testRounding(@RequestParam(defaultValue = "0.43010752688172044") double value,
            @RequestParam(defaultValue = "ROUND_UP") String rule) {
        double result = com.register.example.util.LeaveRoundingUtil.applyRoundingRule(value, rule);

        return String.format("Input: %s | Rule: %s | Output: %s", value, rule, result);
    }
}
