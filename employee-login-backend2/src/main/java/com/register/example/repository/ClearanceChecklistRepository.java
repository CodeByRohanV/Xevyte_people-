package com.register.example.repository;

import com.register.example.entity.ClearanceChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClearanceChecklistRepository extends JpaRepository<ClearanceChecklist, Long> {

    List<ClearanceChecklist> findByDepartmentIgnoreCase(String department);

    boolean existsByDepartmentIgnoreCase(String department);
}
