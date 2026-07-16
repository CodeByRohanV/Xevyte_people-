package com.register.example.controller;

import com.register.example.entity.CompanyLocation;
import com.register.example.service.CompanyLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/company-locations")
@CrossOrigin(origins = "*")
public class CompanyLocationController {
    
    private static final String CONST_NOT_FOUND = "not found";
    
    @Autowired
    private CompanyLocationService companyLocationService;
    
    // Get all locations
    @GetMapping
    public ResponseEntity<List<CompanyLocation>> getAllLocations() {
        try {
            List<CompanyLocation> locations = companyLocationService.getAllLocations();
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get location by ID
    @GetMapping("/{id}")
    public ResponseEntity<Object> getLocationById(@PathVariable Long id) {
        try {
            Optional<CompanyLocation> location = companyLocationService.getLocationById(id);
            if (location.isPresent()) {
                return ResponseEntity.ok(location.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Location not found with ID: " + id);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving location: " + e.getMessage());
        }
    }
    
    // Get active locations
    @GetMapping("/active")
    public ResponseEntity<List<CompanyLocation>> getActiveLocations() {
        try {
            List<CompanyLocation> locations = companyLocationService.getActiveLocations();
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get inactive locations
    @GetMapping("/inactive")
    public ResponseEntity<List<CompanyLocation>> getInactiveLocations() {
        try {
            List<CompanyLocation> locations = companyLocationService.getInactiveLocations();
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Create new location
    @PostMapping
    public ResponseEntity<Object> createLocation(@RequestBody CompanyLocation location, 
                                          @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            CompanyLocation createdLocation = companyLocationService.createLocation(location, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLocation);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating location: " + e.getMessage());
        }
    }
    
    // Update location
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateLocation(@PathVariable Long id, 
                                          @RequestBody CompanyLocation locationDetails,
                                          @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            CompanyLocation updatedLocation = companyLocationService.updateLocation(id, locationDetails, userEmail);
            return ResponseEntity.ok(updatedLocation);
        } catch (RuntimeException e) {
            if (e.getMessage().contains(CONST_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            } else if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating location: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating location: " + e.getMessage());
        }
    }
    
    // Soft delete location
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteLocation(@PathVariable Long id,
                                             @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            CompanyLocation deletedLocation = companyLocationService.deleteLocation(id, userEmail);
            return ResponseEntity.ok(deletedLocation);
        } catch (RuntimeException e) {
            if (e.getMessage().contains(CONST_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting location: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting location: " + e.getMessage());
        }
    }
    
    // Permanently delete location
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Object> permanentlyDeleteLocation(@PathVariable Long id) {
        try {
            companyLocationService.permanentlyDeleteLocation(id);
            return ResponseEntity.ok("Location permanently deleted");
        } catch (RuntimeException e) {
            if (e.getMessage().contains(CONST_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error permanently deleting location: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error permanently deleting location: " + e.getMessage());
        }
    }
    
    // Search locations
    @GetMapping("/search")
    public ResponseEntity<List<CompanyLocation>> searchLocations(@RequestParam String searchTerm) {
        try {
            List<CompanyLocation> locations = companyLocationService.searchLocations(searchTerm);
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get location statistics
    @GetMapping("/stats")
    public ResponseEntity<CompanyLocationService.LocationStats> getLocationStats() {
        try {
            CompanyLocationService.LocationStats stats = companyLocationService.getLocationStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
