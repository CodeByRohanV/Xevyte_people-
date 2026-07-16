package com.register.example.repository;

import com.register.example.entity.ExitAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExitAnswerRepository extends JpaRepository<ExitAnswer, Long> {

    List<ExitAnswer> findByFormId(Long formId);

    List<ExitAnswer> findByEmployeeId(String employeeId);

    List<ExitAnswer> findByFormIdAndEmployeeId(Long formId, String employeeId);

    void deleteByFormId(Long formId);
}
