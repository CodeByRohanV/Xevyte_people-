package com.register.example.repository;

import com.register.example.entity.CalcComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CalcComponentRepository extends JpaRepository<CalcComponent, Long> {

    /** Traverse @ManyToOne via underscore: structure_id column */
    List<CalcComponent> findByStructure_IdOrderBySequenceOrderAsc(Long structureId);

    @Transactional
    void deleteByStructure_Id(Long structureId);
}
