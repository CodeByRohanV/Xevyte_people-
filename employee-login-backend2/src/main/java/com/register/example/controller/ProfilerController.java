package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfilerController {

    private static final String CONST_EMPLOYEE = "EMPLOYEE";
    private static final String CONST_UPDATE_PROFILE = "UPDATE_PROFILE";
    private static final String CONST_PROFILE = "PROFILE";
    private static final String CONST_EMPLOYEE_ENTITY = "Employee";
    private static final String CONST_EMP_NOT_FOUND = "Employee not found";
    private static final String CONST_FIRST_NAME = "firstName";
    private static final String CONST_LAST_NAME = "lastName";
    private static final String CONST_PROFILE_PIC = "profilePic";
    private static final String CONST_IMAGE_DATA = "[IMAGE_DATA]";

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditService auditService;

    @PutMapping("/update/{employeeId}")
    public ResponseEntity<Object> updateProfile(
            @PathVariable String employeeId,
            @RequestParam(CONST_FIRST_NAME) String firstName,
            @RequestParam(CONST_LAST_NAME) String lastName,
            @RequestParam(value = CONST_PROFILE_PIC, required = false) MultipartFile profilePic,
            HttpServletRequest request) {

        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);

        if (employee == null) {
            auditService.logCustomAction(CONST_UPDATE_PROFILE, CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                    "Failed to update profile - " + CONST_EMP_NOT_FOUND, null, null, null, request);
            return ResponseEntity.badRequest().body(CONST_EMP_NOT_FOUND);
        }

        // Store old values for audit
        Map<String, Object> oldValues = new HashMap<>();
        oldValues.put(CONST_FIRST_NAME, employee.getFirstName());
        oldValues.put(CONST_LAST_NAME, employee.getLastName());
        oldValues.put(CONST_PROFILE_PIC, employee.getProfilePic() != null ? CONST_IMAGE_DATA : null);

        // ✅ Update first & last name (NO MORE setName)
        employee.setFirstName(firstName);
        employee.setLastName(lastName);

        // ✅ Convert and save Base64 image if present
        if (profilePic != null && !profilePic.isEmpty()) {
            String contentType = profilePic.getContentType();
            if (!List.of("image/jpeg", "image/png").contains(contentType)) {
                auditService.logCustomAction(CONST_UPDATE_PROFILE, CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                        "Failed to update profile - Invalid file type", oldValues, null, null, request);
                return ResponseEntity.badRequest().body("Invalid file type. Only JPEG and PNG images are allowed.");
            }
            try {
                byte[] imageBytes = profilePic.getBytes();
                String base64Image = "data:" + profilePic.getContentType() + ";base64," +
                        Base64.getEncoder().encodeToString(imageBytes);
                employee.setProfilePic(base64Image);
            } catch (IOException e) {
                auditService.logCustomAction(CONST_UPDATE_PROFILE, CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                        "Failed to update profile - Error processing profile picture", oldValues, null, null, request);
                return ResponseEntity.status(500).body("Error processing profile picture");
            }
        }

        employeeRepository.save(employee);

        // Store new values for audit
        Map<String, Object> newValues = new HashMap<>();
        newValues.put(CONST_FIRST_NAME, employee.getFirstName());
        newValues.put(CONST_LAST_NAME, employee.getLastName());
        newValues.put(CONST_PROFILE_PIC, employee.getProfilePic() != null ? CONST_IMAGE_DATA : null);

        // Log successful profile update
        auditService.logCustomAction(CONST_UPDATE_PROFILE, CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                "Profile updated successfully", oldValues, newValues, null, request);

        // ✅ Response with full name
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("name", employee.getFirstName() + " " + employee.getLastName());
        response.put(CONST_PROFILE_PIC, employee.getProfilePic());

        return ResponseEntity.ok(response);
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ProfilerController.class);

    @PutMapping("/remove-picture/{employeeId}")
    public ResponseEntity<Object> removeProfilePicture(@PathVariable String employeeId, HttpServletRequest request) {
        logger.info("DEBUG: removeProfilePicture hit for employeeId: {}", employeeId);
        try {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);

            if (employee == null) {
                return ResponseEntity.badRequest().body(CONST_EMP_NOT_FOUND);
            }

            // Store old values for audit
            Map<String, Object> oldValues = new HashMap<>();
            oldValues.put(CONST_PROFILE_PIC, employee.getProfilePic() != null ? CONST_IMAGE_DATA : null);

            employee.setProfilePic(null);
            employeeRepository.save(employee);

            // Store new values for audit
            Map<String, Object> newValues = new HashMap<>();
            newValues.put(CONST_PROFILE_PIC, null);

            auditService.logCustomAction("REMOVE_PROFILE_PIC", CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                    "Profile picture removed successfully", oldValues, newValues, null, request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile picture removed successfully");
            response.put(CONST_PROFILE_PIC, null);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<Object> getProfile(@PathVariable String employeeId, HttpServletRequest request) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);

        if (employee == null) {
            auditService.logCustomAction("VIEW_PROFILE", CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                    "Failed to view profile - " + CONST_EMP_NOT_FOUND, null, null, null, request);
            return ResponseEntity.badRequest().body(CONST_EMP_NOT_FOUND);
        }

        // Log profile view action
        auditService.logCustomAction("VIEW_PROFILE", CONST_PROFILE, CONST_EMPLOYEE_ENTITY, null, employeeId, CONST_EMPLOYEE,
                "Profile viewed successfully", null, null, null, request);

        Map<String, Object> response = new HashMap<>();
        response.put(CONST_FIRST_NAME, employee.getFirstName());
        response.put(CONST_LAST_NAME, employee.getLastName());
        response.put(CONST_PROFILE_PIC, employee.getProfilePic());

        return ResponseEntity.ok(response);
    }

}
