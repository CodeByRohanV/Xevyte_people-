package com.register.example.repository;

import com.register.example.entity.DailyEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyEntryRepository extends JpaRepository<DailyEntry, Long>, JpaSpecificationExecutor<DailyEntry> {

    List<DailyEntry> findByEmployeeId(String employeeId);

    // Removed all managerId and hrId based methods because those fields are no
    // longer in DailyEntry

    Optional<DailyEntry> findByEmployeeIdAndDate(String employeeId, LocalDate date);

    // Retrieves all frozen entries for a specific employee
    List<DailyEntry> findByEmployeeIdAndFrozenTrue(String employeeId);

    // In DailyEntryRepository.java
    List<DailyEntry> findByEmployeeIdIn(List<String> employeeIds);

    // Retrieves all entries for a specific employee within a date range
    List<DailyEntry> findByEmployeeIdAndDateBetween(String employeeId, LocalDate startDate, LocalDate endDate);

    // Retrieves all frozen entries for an employee within a date range
    List<DailyEntry> findByEmployeeIdAndFrozenTrueAndDateBetween(String employeeId, LocalDate startDate,
            LocalDate endDate);

    // Fetch the latest entry before a specific date for the employee
    Optional<DailyEntry> findTopByEmployeeIdAndDateBeforeOrderByDateDesc(String employeeId, LocalDate date);

    // Calculates total hours for an employee
    @Query("SELECT SUM(d.totalHours) FROM DailyEntry d WHERE d.employeeId = :employeeId")
    Double findTotalHoursByEmployeeId(@Param("employeeId") String employeeId);

    // New method to get entries for multiple employees in a date range
    List<DailyEntry> findByEmployeeIdInAndDateBetween(List<String> employeeIds, LocalDate startDate, LocalDate endDate);

    // Org-wide: all entries in a date range (for deep analytics)
    List<DailyEntry> findByDateBetween(LocalDate startDate, LocalDate endDate);
}
