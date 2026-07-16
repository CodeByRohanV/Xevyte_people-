package com.register.example.repository;

import com.register.example.entity.LMS;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LMSRepository extends JpaRepository<LMS, Long> {
    List<LMS> findByEmployeeId(String employeeId);

    List<LMS> findByCategory(String category);

    List<LMS> findByEmployeeIdAndCategory(String employeeId, String category);

    List<LMS> findByEmployeeIdIn(List<String> employeeIds);
}
