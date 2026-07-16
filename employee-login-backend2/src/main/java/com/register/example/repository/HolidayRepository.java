package com.register.example.repository;

import com.register.example.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    List<Holiday> findByDateBetween(LocalDate start, LocalDate end);
    List<Holiday> findByDateBetweenAndTenantId(LocalDate start, LocalDate end, String tenantId);

    List<Holiday> findByLocationIgnoreCase(String location);
    List<Holiday> findByLocationIgnoreCaseAndTenantId(String location, String tenantId);

    List<Holiday> findByTenantId(String tenantId);

    // ✅ REQUIRED FOR FULL REPLACEMENT BY LOCATION
    @Modifying
    @Transactional
    void deleteByLocation(String location);

    @Modifying
    @Transactional
    void deleteByLocationAndTenantId(String location, String tenantId);
}
