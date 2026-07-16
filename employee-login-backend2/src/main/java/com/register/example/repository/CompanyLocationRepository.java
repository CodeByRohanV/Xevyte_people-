package com.register.example.repository;

import com.register.example.entity.CompanyLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyLocationRepository extends JpaRepository<CompanyLocation, Long> {
    
    // Find by location name (case insensitive)
    Optional<CompanyLocation> findByLocationNameIgnoreCase(String locationName);
    
    // Check if location name exists (case insensitive)
    boolean existsByLocationNameIgnoreCase(String locationName);
    
    // Find all active locations
    List<CompanyLocation> findByIsActiveTrue();
    
    // Find all inactive locations
    List<CompanyLocation> findByIsActiveFalse();
    
    // Search locations by name (case insensitive)
    @Query("SELECT cl FROM CompanyLocation cl WHERE " +
           "LOWER(cl.locationName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<CompanyLocation> searchLocations(@Param("searchTerm") String searchTerm);
    
    // Count active locations
    long countByIsActiveTrue();
    
    // Count inactive locations
    long countByIsActiveFalse();
}
