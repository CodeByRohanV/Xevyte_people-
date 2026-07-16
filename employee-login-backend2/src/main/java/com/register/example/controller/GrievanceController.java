package com.register.example.controller;

import com.register.example.payload.GrievanceCreateResponse;
import com.register.example.payload.GrievanceViewResponse;
import com.register.example.service.GrievanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@RestController
@RequestMapping("/api/grievances")
public class GrievanceController {

    private final GrievanceService grievanceService;

    public GrievanceController(GrievanceService grievanceService) {
        this.grievanceService = grievanceService;
    }

    @PostMapping(value = "/anonymous", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GrievanceCreateResponse> submitGrievance(
            @RequestPart("category") String category,
            @RequestPart(value = "type", required = false) String type,
            @RequestPart("subject") String subject,
            @RequestPart("description") String description,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @org.springframework.web.bind.annotation.RequestHeader(value = "employeeId", required = false) String employeeId
    ) {
        try {
            GrievanceCreateResponse response =
                    grievanceService.submitAnonymous(category, type, subject, description, file, employeeId);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to process grievance");
        }
    }

    @GetMapping("/{grievanceId}")
    public ResponseEntity<GrievanceViewResponse> getGrievance(@PathVariable String grievanceId) {
        GrievanceViewResponse response = grievanceService.getForUser(grievanceId);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Grievance not found");
        }
        return ResponseEntity.ok(response);
    }
}
