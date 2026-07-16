package com.register.example.repository;
//
import com.register.example.entity.Clearance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
//
import java.util.Optional;
//
@Repository
public interface ClearanceRepository extends JpaRepository<Clearance, Long> {
    Optional<Clearance> findByResignationId(Long resignationId);
}
