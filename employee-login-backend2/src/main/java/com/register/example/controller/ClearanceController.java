package com.register.example.controller;
//
import com.register.example.entity.Clearance;
import com.register.example.payload.ClearanceDto;
import com.register.example.service.ClearanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
//
import java.util.Optional;
//
@RestController
@RequestMapping("/api/clearance")
public class ClearanceController {
//
    private final ClearanceService clearanceService;
//
    public ClearanceController(ClearanceService clearanceService) {
        this.clearanceService = clearanceService;
    }
//
    /**
     * 🔹 Fetch clearance details by resignation ID
     */
    @GetMapping("/{resignationId}")
    public ResponseEntity<Object> getClearance(@PathVariable Long resignationId) {
        Optional<Clearance> optional = clearanceService.getByResignationId(resignationId);
//
        if (optional.isPresent()) {
            return ResponseEntity.ok(optional.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Clearance not found for resignationId: " + resignationId);
        }
    }
//
    /**
     * 🔹 Create or Update Clearance record
     *
     * Accepts multipart/form-data.
     * Fields from the front-end (checkboxes, text fields, etc.) are sent as form fields.
     *
     * File field names must match the React frontend:
     *  - HR documents → "hrClearanceDocument"
     *  - Admin documents → "adminClearanceDocument"
     *
     * Example: axios.post(`/api/clearance/{resignationId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
     */
@PostMapping(value = "/{resignationId}", consumes = {"multipart/form-data"})
public ResponseEntity<Object> createOrUpdateClearance(
        @PathVariable Long resignationId,
        @Valid @RequestPart("dto") ClearanceDto dto,
        BindingResult bindingResult,
        @RequestPart(value = "hrClearanceDocument", required = false) MultipartFile hrFile,
        @RequestPart(value = "adminClearanceDocument", required = false) MultipartFile adminFile,
        @RequestHeader(value = "hrId", required = false) String hrId,
        @RequestHeader(value = "adminId", required = false) String adminId
) {
    String actorId = (hrId != null) ? hrId : adminId;

    if (bindingResult.hasErrors()) {
        return ResponseEntity.badRequest().body(bindingResult.getAllErrors());
    }
//
    // validate files
    if ((hrFile != null && hrFile.isEmpty() && !hrFile.getName().isEmpty()) ||
        (adminFile != null && adminFile.isEmpty() && !adminFile.getName().isEmpty())) {
        return ResponseEntity.badRequest().body("Uploaded file is empty or invalid.");
    }
//
    try {
        // ⭐ SERVICE WILL AUTO-DETECT HR vs ADMIN CLEARANCE
        Clearance saved = clearanceService.createOrUpdateClearance(
                resignationId,
                dto,
                hrFile,
                adminFile,
                actorId
        );
//
        return ResponseEntity.ok(saved);
//
    } catch (IllegalArgumentException iae) {
        return ResponseEntity.badRequest().body(iae.getMessage());
//
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error saving clearance: " + e.getMessage());
    }
}
//
//
}
