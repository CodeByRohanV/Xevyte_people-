package com.register.example.controller;
 
import com.register.example.entity.Location;
import com.register.example.repository.LocationRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;
 
import java.util.List;
 
@RestController
@RequestMapping("/api/v1/locations")
@CrossOrigin(origins = "*")
public class LocationController {
 
    private final LocationRepository locationRepository;
    private final EmployeeRepository employeeRepository;
    private final JdbcTemplate jdbcTemplate;
 
    public LocationController(LocationRepository locationRepository, EmployeeRepository employeeRepository, JdbcTemplate jdbcTemplate) {
        this.locationRepository = locationRepository;
        this.employeeRepository = employeeRepository;
        this.jdbcTemplate = jdbcTemplate;
    }
 
    @PostConstruct
    public void dropUniqueLocationNameConstraint() {
        try {
            // Find any unique indexes on 'location_name' to drop
            String sql = "SELECT DISTINCT INDEX_NAME FROM information_schema.statistics " +
                         "WHERE TABLE_NAME = 'locations' " +
                         "AND COLUMN_NAME = 'location_name' " +
                         "AND NON_UNIQUE = 0 " +
                         "AND INDEX_NAME != 'PRIMARY'";
            List<String> indexNames = jdbcTemplate.queryForList(sql, String.class);
            for (String indexName : indexNames) {
                try {
                    jdbcTemplate.execute("ALTER TABLE locations DROP INDEX " + indexName);
                    System.out.println("✅ Automatically dropped unique index: " + indexName + " on locations table");
                } catch (Exception ex) {
                    System.err.println("Could not drop index " + indexName + ": " + ex.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error while checking locations table indexes: " + e.getMessage());
        }
    }

    // -------------------------------
    // ADD NEW LOCATION
    // -------------------------------
    @PostMapping("/add")
    public ResponseEntity<String> addLocation(@RequestParam String name) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Location name cannot be empty");
        }
 
        String tenantId = getCurrentTenantId();
        
        if (tenantId != null && !tenantId.isEmpty()) {
            if (locationRepository.findByLocationNameAndTenantId(name.trim(), tenantId).isPresent()) {
                return ResponseEntity.badRequest().body("Location name already exists for this tenant");
            }
        } else {
            if (locationRepository.findByLocationName(name.trim()).isPresent()) {
                return ResponseEntity.badRequest().body("Location name already exists");
            }
        }

        Location location = new Location(name.trim());
        location.setTenantId(tenantId);
        locationRepository.save(location);
        
        return ResponseEntity.ok("Location added successfully");
    }
 
    // -------------------------------
    // GET ALL LOCATIONS
    // -------------------------------
    @GetMapping("/all")
    public ResponseEntity<List<Location>> getAllLocations() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return ResponseEntity.ok(locationRepository.findByTenantId(tenantId));
        }
        return ResponseEntity.ok(locationRepository.findAll());
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }
}