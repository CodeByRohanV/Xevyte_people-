package com.register.example.repository;

import com.register.example.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {

        List<EmployeeDocument> findByEmployeeId(String employeeId);

        List<EmployeeDocument> findByEmployeeIdAndYear(String employeeId, Integer year); // ⭐ for year filter



        List<EmployeeDocument> findByEmployeeIdAndDocumentCategoryAndDocumentName(String employeeId,
                        String documentCategory, String documentName);

        EmployeeDocument findTopByEmployeeIdAndDocumentCategoryAndDocumentNameOrderByIdDesc(String employeeId,
                        String documentCategory, String documentName);
}
