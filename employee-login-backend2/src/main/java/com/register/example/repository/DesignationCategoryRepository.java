package com.register.example.repository;

import com.register.example.entity.DesignationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignationCategoryRepository extends JpaRepository<DesignationCategory, Long> {
    
    List<DesignationCategory> findAll();
    
    Optional<DesignationCategory> findByName(String name);
    
    boolean existsByName(String name);
    
    boolean existsById(Long id);
}
