package com.register.example.repository;

import com.register.example.entity.LeaveDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveDraftRepository extends JpaRepository<LeaveDraft, Long> {
    List<LeaveDraft> findByEmployeeId(String employeeId);
}
