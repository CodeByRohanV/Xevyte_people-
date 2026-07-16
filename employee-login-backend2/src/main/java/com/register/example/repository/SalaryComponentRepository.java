package com.register.example.repository;

import com.register.example.entity.SalaryComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, Long> {
    List<SalaryComponent> findAllByOrderBySortOrderAsc();

    List<SalaryComponent> findByIsActiveTrueOrderBySortOrderAsc();
}
