package com.register.example.controller;

import com.register.example.payload.GrievanceUpdateRequest;
import com.register.example.payload.GrievanceViewResponse;
import com.register.example.service.GrievanceService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/grievances")
public class AdminGrievanceController {

    private final GrievanceService grievanceService;

    public AdminGrievanceController(GrievanceService grievanceService) {
        this.grievanceService = grievanceService;
    }

    @GetMapping
    public Page<GrievanceViewResponse> list(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "createdDate,desc") String sort
    ) {
        return grievanceService.listForAdmin(status, category, page, size, sort);
    }

    @GetMapping("/reports")
    public ResponseEntity<java.util.List<GrievanceViewResponse>> getReports(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate endDate
    ) {
        return ResponseEntity.ok(grievanceService.getGrievanceReport(category, type, status, startDate, endDate));
    }

    @GetMapping("/{grievanceId}")
    public ResponseEntity<GrievanceViewResponse> get(@PathVariable String grievanceId) {
        GrievanceViewResponse response = grievanceService.getForAdmin(grievanceId);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Grievance not found");
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{grievanceId}")
    public ResponseEntity<GrievanceViewResponse> update(
            @PathVariable String grievanceId,
            @Validated @RequestBody GrievanceUpdateRequest request
    ) {
        GrievanceViewResponse response = grievanceService.updateForAdmin(grievanceId, request);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Grievance not found");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{grievanceId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable String grievanceId) {
        byte[] data = grievanceService.getAttachmentData(grievanceId);
        if (data == null || data.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }

        String contentType = grievanceService.getAttachmentContentType(grievanceId);
        String filename = grievanceService.getAttachmentName(grievanceId);

        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }
        if (filename == null || filename.isBlank()) {
            filename = grievanceId + "-attachment";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(data.length)
                .body(new ByteArrayResource(data));
    }
}
