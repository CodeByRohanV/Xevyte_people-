package com.register.example.repository;

import com.register.example.entity.RevisionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RevisionTypeRepository extends JpaRepository<RevisionType, Long> {
}
