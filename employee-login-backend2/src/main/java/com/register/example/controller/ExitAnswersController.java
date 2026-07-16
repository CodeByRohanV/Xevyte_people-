package com.register.example.controller;

import com.register.example.entity.ExitAnswer;
import com.register.example.repository.ExitAnswerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/exit-management")
@CrossOrigin("*")
public class ExitAnswersController {

    private final ExitAnswerRepository exitAnswerRepository;

    @Autowired
    public ExitAnswersController(ExitAnswerRepository exitAnswerRepository) {
        this.exitAnswerRepository = exitAnswerRepository;
    }

    @GetMapping("/exit-answers/{formId}")
    public ResponseEntity<Object> getExitAnswersForForm(
            @PathVariable Long formId,
            @RequestHeader("employeeId") String employeeId
    ) {
        try {
            List<ExitAnswer> answers =
                    exitAnswerRepository.findByFormIdAndEmployeeId(formId, employeeId);

            return ResponseEntity.ok(answers);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Failed to load answers.");
        }
    }
}
