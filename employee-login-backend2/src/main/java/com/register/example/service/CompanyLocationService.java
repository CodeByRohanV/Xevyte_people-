package com.register.example.service;

import com.register.example.entity.CompanyLocation;
import com.register.example.repository.CompanyLocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompanyLocationService {
    
    @Autowired
    private CompanyLocationRepository companyLocationRepository;
    
    // Get all company locations
    public List<CompanyLocation> getAllLocations() {
        return companyLocationRepository.findAll();
    }
    
    // Get location by ID
    public Optional<CompanyLocation> getLocationById(Long id) {
        return companyLocationRepository.findById(id);
    }
    
    // Get all active locations
    public List<CompanyLocation> getActiveLocations() {
        return companyLocationRepository.findByIsActiveTrue();
    }
    
    // Get all inactive locations
    public List<CompanyLocation> getInactiveLocations() {
        return companyLocationRepository.findByIsActiveFalse();
    }
    
    // Create new location
    public CompanyLocation createLocation(CompanyLocation location, String createdBy) {
        // Check if location name already exists
        if (companyLocationRepository.existsByLocationNameIgnoreCase(location.getLocationName())) {
            throw new RuntimeException("Location with name '" + location.getLocationName() + "' already exists");
        }
        
        location.setCreatedBy(createdBy);
        location.setIsActive(true);
        return companyLocationRepository.save(location);
    }
    
    // Update location
    public CompanyLocation updateLocation(Long id, CompanyLocation locationDetails, String updatedBy) {
        Optional<CompanyLocation> existingLocationOpt = companyLocationRepository.findById(id);
        
        if (existingLocationOpt.isEmpty()) {
            throw new RuntimeException("Location not found with ID: " + id);
        }
        
        CompanyLocation existingLocation = existingLocationOpt.get();
        
        // Check if new location name conflicts with existing one (excluding current location)
        String newName = locationDetails.getLocationName();
        if (!existingLocation.getLocationName().equalsIgnoreCase(newName)) {
            if (companyLocationRepository.existsByLocationNameIgnoreCase(newName)) {
                throw new RuntimeException("Location with name '" + newName + "' already exists");
            }
        }
        
        // Update fields
        existingLocation.setLocationName(locationDetails.getLocationName());
        existingLocation.setIsActive(locationDetails.getIsActive());
        existingLocation.setUpdatedBy(updatedBy);
        
        return companyLocationRepository.save(existingLocation);
    }
    
    // Delete location (soft delete by setting isActive to false)
    public CompanyLocation deleteLocation(Long id, String deletedBy) {
        Optional<CompanyLocation> locationOpt = companyLocationRepository.findById(id);
        
        if (locationOpt.isEmpty()) {
            throw new RuntimeException("Location not found with ID: " + id);
        }
        
        CompanyLocation location = locationOpt.get();
        location.setIsActive(false);
        location.setUpdatedBy(deletedBy);
        
        return companyLocationRepository.save(location);
    }
    
    // Permanently delete location
    public void permanentlyDeleteLocation(Long id) {
        if (!companyLocationRepository.existsById(id)) {
            throw new RuntimeException("Location not found with ID: " + id);
        }
        companyLocationRepository.deleteById(id);
    }
    
    // Search locations
    public List<CompanyLocation> searchLocations(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllLocations();
        }
        return companyLocationRepository.searchLocations(searchTerm.trim());
    }
    
    // Get location statistics
    public LocationStats getLocationStats() {
        long totalLocations = companyLocationRepository.count();
        long activeLocations = companyLocationRepository.countByIsActiveTrue();
        long inactiveLocations = companyLocationRepository.countByIsActiveFalse();
        
        return new LocationStats(totalLocations, activeLocations, inactiveLocations);
    }
    
    // Inner class for statistics
    public static class LocationStats {
        private long totalLocations;
        private long activeLocations;
        private long inactiveLocations;
        
        public LocationStats(long totalLocations, long activeLocations, long inactiveLocations) {
            this.totalLocations = totalLocations;
            this.activeLocations = activeLocations;
            this.inactiveLocations = inactiveLocations;
        }
        
        // Getters
        public long getTotalLocations() { return totalLocations; }
        public long getActiveLocations() { return activeLocations; }
        public long getInactiveLocations() { return inactiveLocations; }
    }
}
