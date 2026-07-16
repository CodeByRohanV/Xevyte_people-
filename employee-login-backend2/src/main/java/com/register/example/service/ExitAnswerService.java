package com.register.example.service;

import com.register.example.entity.ExitAnswer;
import com.register.example.repository.ExitAnswerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExitAnswerService {

    @Autowired
    private ExitAnswerRepository answerRepo;

    public void saveAnswers(Long formId, String employeeId, List<ExitAnswer> answers) {
        // Remove old answers
        answerRepo.deleteByFormId(formId);

        // Save new answers
        answers.forEach(a -> {
            a.setFormId(formId);
            a.setEmployeeId(employeeId);
        });

        answerRepo.saveAll(answers);
    }

    public List<ExitAnswer> getAnswers(Long formId, String employeeId) {
        return answerRepo.findByFormIdAndEmployeeId(formId, employeeId);
    }
}
