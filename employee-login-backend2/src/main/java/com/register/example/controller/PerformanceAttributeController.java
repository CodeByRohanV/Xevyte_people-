package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.PerformanceAttribute;
import com.register.example.payload.EmployeeAttributeStatusDTO;
import com.register.example.payload.EmployeeAttributeStatusDTO.AttributeStatusUpdateDTO;
import com.register.example.payload.AttributeReviewRequest;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PerformanceAttributeRepository;
import com.register.example.service.PerformanceAttributeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.sql.Date;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/attributes")
public class PerformanceAttributeController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory
            .getLogger(PerformanceAttributeController.class);

    private static final String CONST_ATTRIBUTE_NOT_FOUND = "Attribute not found";
    private static final String CONST_ATTRIBUTE_ID = "attributeId";

    private final PerformanceAttributeService performanceAttributeService;
    private final EmployeeRepository employeeRepository;
    private final PerformanceAttributeRepository attributeRepository;

    @Autowired
    public PerformanceAttributeController(PerformanceAttributeService performanceAttributeService,
            EmployeeRepository employeeRepository,
            PerformanceAttributeRepository attributeRepository) {
        this.performanceAttributeService = performanceAttributeService;
        this.employeeRepository = employeeRepository;
        this.attributeRepository = attributeRepository;
    }

    // Fetch reports with filters
    @GetMapping("/fetch-reports")
    public ResponseEntity<List<PerformanceAttribute>> getAttributeReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String attributeTitle,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.util.Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.util.Date endDate) {

        List<PerformanceAttribute> attributes = performanceAttributeService.getFilteredAttributes(employeeId,
                attributeTitle, status, startDate, endDate);
        return ResponseEntity.ok(attributes);
    }

    /**
     * Helper method to validate and pre-process attribute fields.
     */
    private Optional<Employee> validateAndPrepareAttributes(List<PerformanceAttribute> attributes) {
        if (attributes.isEmpty()) {
            return Optional.empty();
        }

        String targetEmployeeId = attributes.get(0).getEmployeeId();
        if (targetEmployeeId == null || targetEmployeeId.trim().isEmpty()) {
            return Optional.empty();
        }

        Optional<Employee> optionalEmp = employeeRepository.findByEmployeeId(targetEmployeeId);
        if (optionalEmp.isEmpty()) {
            return Optional.empty();
        }

        Employee employee = optionalEmp.get();

        LocalDate localStartDate = LocalDate.now();

        for (PerformanceAttribute attribute : attributes) {
            if (!targetEmployeeId.equals(attribute.getEmployeeId())) {
                return Optional.empty();
            }
            attribute.setEmployeeId(employee.getEmployeeId());
            attribute.setStartDate(Date.valueOf(localStartDate));
            attribute.setEndDate(null);
            if (attribute.getStatus() == null || attribute.getStatus().trim().isEmpty()) {
                attribute.setStatus("Pending");
            }
        }

        return optionalEmp;
    }

    // --------------------------------------------------------------------------------
    // ATTRIBUTE ASSIGNMENT
    // --------------------------------------------------------------------------------

    @PostMapping("/assign")
    public ResponseEntity<Object> assignAttribute(@RequestBody PerformanceAttribute attribute) {
        try {
            Optional<Employee> optionalEmp = validateAndPrepareAttributes(List.of(attribute));

            if (optionalEmp.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Employee not found or attribute data is invalid.");
            }

            PerformanceAttribute saved = performanceAttributeService.assignAttribute(attribute);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning attribute: " + e.getMessage());
        }
    }

    @PostMapping("/assign-batch")
    public ResponseEntity<Object> assignAttributesBatch(@RequestBody List<PerformanceAttribute> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return ResponseEntity.badRequest().body("List of attributes cannot be empty.");
        }

        try {
            Optional<Employee> optionalEmp = validateAndPrepareAttributes(attributes);

            if (optionalEmp.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Validation failed. Ensure attributes are present, have a valid Employee ID, and are for the same employee.");
            }

            List<PerformanceAttribute> savedAttributes = performanceAttributeService
                    .assignAttributesBatch(attributes);
            return ResponseEntity.ok(savedAttributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning attributes in batch: " + e.getMessage());
        }
    }

    // --------------------------------------------------------------------------------
    // EMPLOYEE SUBMISSION ENDPOINTS
    // --------------------------------------------------------------------------------

    @PutMapping("/employee/self-assessments")
    public ResponseEntity<Object> submitBulkSelfAssessment(
            @RequestBody List<EmployeeAttributeStatusDTO> assessments) {

        if (assessments == null || assessments.isEmpty()) {
            return ResponseEntity.badRequest().body("Assessment list cannot be empty.");
        }

        try {
            List<PerformanceAttribute> updatedAttributes = performanceAttributeService
                    .submitBulkSelfAssessmentAndNotifyManager(assessments);

            if (updatedAttributes.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No valid attributes found to update with self-assessment.");
            }

            return ResponseEntity.ok(updatedAttributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit bulk self-assessment: " + e.getMessage());
        }
    }

    @PutMapping("/{attributeId}/employee-feedback")
    public ResponseEntity<Object> updateEmployeeFeedback(@PathVariable Long attributeId,
            @RequestBody AttributeStatusUpdateDTO request) {
        Optional<PerformanceAttribute> optionalAttribute = attributeRepository.findById(attributeId);
        if (optionalAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_ATTRIBUTE_NOT_FOUND);
        }
        PerformanceAttribute attribute = optionalAttribute.get();
        attribute.setStatus(request.getStatus());
        attribute.setSelfAssessment(request.getSelfAssessment());
        attribute.setRating(request.getRating());
        attribute.setManagerRating(request.getManagerRating());
        attribute.setManagerComments(request.getManagerComments());
        attributeRepository.save(attribute);
        return ResponseEntity.ok("Employee feedback saved successfully");
    }

    // --------------------------------------------------------------------------------
    // REST OF THE ENDPOINTS
    // --------------------------------------------------------------------------------

    @GetMapping("/employee/{empId}")
    public ResponseEntity<Object> getAttributesForEmployee(@PathVariable String empId) {
        try {
            List<PerformanceAttribute> attributes = performanceAttributeService.getAttributesByEmployee(empId);
            return new ResponseEntity<>(attributes, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching attributes: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{attributeId}")
    public ResponseEntity<Object> deleteAttribute(@PathVariable Long attributeId) {
        try {
            if (!attributeRepository.existsById(attributeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Attribute not found with ID: " + attributeId);
            }
            attributeRepository.deleteById(attributeId);
            return ResponseEntity.ok("Attribute with ID " + attributeId + " deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete attribute: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<Object> getAttributesForManager(@PathVariable String managerId) {
        try {
            List<PerformanceAttribute> attributes = performanceAttributeService.getAttributesByManager(managerId);
            return new ResponseEntity<>(attributes, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching attributes: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/rejected/{managerId}")
    public ResponseEntity<Object> getRejectedAttributesByManager(@PathVariable String managerId) {
        try {
            List<PerformanceAttribute> attributes = performanceAttributeService
                    .getRejectedAttributesByManager(managerId);
            return new ResponseEntity<>(attributes, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching rejected attributes: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/reassign/{attributeId}")
    public ResponseEntity<Object> reassignAttribute(@PathVariable Long attributeId,
            @RequestBody PerformanceAttribute updatedAttribute) {
        try {
            PerformanceAttribute reassignedAttribute = performanceAttributeService.reassignAttribute(attributeId,
                    updatedAttribute);
            return new ResponseEntity<>(reassignedAttribute, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to reassign attribute: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employees")
    public ResponseEntity<Object> getEmployeesAssignedByManager(@PathVariable String managerId) {
        try {
            List<Employee> employees = performanceAttributeService.getEmployeesUnderManager(managerId);
            return new ResponseEntity<>(employees, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employees: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/submitted/{managerId}")
    public ResponseEntity<Object> getSubmittedAttributesForManager(@PathVariable String managerId) {
        try {
            List<PerformanceAttribute> attributes = performanceAttributeService
                    .getSubmittedAttributesByManager(managerId);
            return new ResponseEntity<>(attributes, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching submitted attributes: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employee/{employeeId}")
    public ResponseEntity<Object> getEmployeeAttributeDetailsUnderManager(@PathVariable String managerId,
            @PathVariable String employeeId) {
        try {
            List<PerformanceAttribute> attributes = performanceAttributeService
                    .getAttributesForEmployeeUnderManager(managerId, employeeId);
            return new ResponseEntity<>(attributes, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employee attribute details: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{attributeId}/status")
    public ResponseEntity<Object> updateAttributeStatus(@PathVariable Long attributeId,
            @RequestBody AttributeStatusUpdateDTO updateDTO) {
        try {
            PerformanceAttribute updatedAttribute = performanceAttributeService
                    .updateAttributeStatusAndFeedback(attributeId, updateDTO.getStatus(),
                            updateDTO.getSelfAssessment());
            return new ResponseEntity<>(updatedAttribute, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update attribute status: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/reviewer/{reviewerId}/employees")
    public ResponseEntity<Object> getEmployees(@PathVariable String reviewerId) {
        try {
            List<Employee> employees = performanceAttributeService.getEmployeesUnderReviewer(reviewerId);
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching employees under reviewer: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}/employees")
    public List<Employee> getEmployeesByHrId(@PathVariable String hrId) {
        return performanceAttributeService.getEmployeesByHrId(hrId);
    }

    /**
     * Bulk Attribute Review (Approve/Reject).
     */
    @PatchMapping("/review")
    public ResponseEntity<Object> reviewAttributes(@RequestBody AttributeReviewRequest reviewRequest) {
        try {
            List<Long> attributeIds = reviewRequest.getAttributeIds();
            String status = reviewRequest.getStatus();

            String rejectionReason = null;

            if (attributeIds == null || attributeIds.isEmpty() || status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Attribute IDs and status are mandatory.");
            }

            List<PerformanceAttribute> updatedAttributes = performanceAttributeService.reviewAttributesBulk(
                    attributeIds, status, rejectionReason);

            return ResponseEntity.ok(updatedAttributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to review attributes: " + e.getMessage());
        }
    }

    @GetMapping("/{attributeId}/feedback")
    public ResponseEntity<Object> getFeedback(@PathVariable Long attributeId) {
        Optional<PerformanceAttribute> optionalAttribute = attributeRepository.findById(attributeId);
        if (optionalAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_ATTRIBUTE_NOT_FOUND);
        }
        PerformanceAttribute attribute = optionalAttribute.get();
        Map<String, Object> feedbackData = new HashMap<>();
        feedbackData.put(CONST_ATTRIBUTE_ID, attribute.getAttributeId());
        feedbackData.put("rating", attribute.getRating());
        feedbackData.put("selfAssessment", attribute.getSelfAssessment());
        feedbackData.put("status", attribute.getStatus());
        return ResponseEntity.ok(feedbackData);
    }

    @PutMapping("/{attributeId}/manager-feedback")
    public ResponseEntity<Object> updateManagerFeedback(
            @PathVariable Long attributeId,
            @RequestBody AttributeStatusUpdateDTO feedbackDTO) {
        Optional<PerformanceAttribute> optionalAttribute = attributeRepository.findById(attributeId);
        if (optionalAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_ATTRIBUTE_NOT_FOUND);
        }
        PerformanceAttribute attribute = optionalAttribute.get();
        attribute.setManagerRating(feedbackDTO.getManagerRating());
        attribute.setManagerComments(feedbackDTO.getManagerComments());
        attributeRepository.save(attribute);
        return ResponseEntity.ok("Manager feedback updated successfully");
    }

    @PutMapping("/manager-feedback")
    public ResponseEntity<Object> submitBulkFeedback(
            @RequestBody List<EmployeeAttributeStatusDTO> feedbackList) {
        try {
            List<PerformanceAttribute> updatedAttributes = performanceAttributeService
                    .submitBulkManagerFeedback(feedbackList);
            return ResponseEntity.ok(updatedAttributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit bulk feedback: " + e.getMessage());
        }
    }

    @GetMapping("/{attributeId}/manager-feedback")
    public ResponseEntity<Object> getManagerFeedback(@PathVariable Long attributeId) {
        Optional<PerformanceAttribute> optionalAttribute = attributeRepository.findById(attributeId);
        if (optionalAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_ATTRIBUTE_NOT_FOUND);
        }
        PerformanceAttribute attribute = optionalAttribute.get();
        Map<String, Object> response = new HashMap<>();
        response.put(CONST_ATTRIBUTE_ID, attribute.getAttributeId());
        response.put("attributeTitle", attribute.getAttributeTitle());
        response.put("managerRating", attribute.getManagerRating());
        response.put("managerComments", attribute.getManagerComments());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{attributeId}/reviewer-comments")
    public ResponseEntity<Object> updateReviewerComments(@PathVariable Long attributeId,
            @RequestBody Map<String, String> payload) {
        Optional<PerformanceAttribute> optionalAttribute = attributeRepository.findById(attributeId);
        if (optionalAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_ATTRIBUTE_NOT_FOUND);
        }
        PerformanceAttribute attribute = optionalAttribute.get();

        String reviewerComments = payload.get("reviewerComments");
        if (reviewerComments == null || reviewerComments.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Reviewer comments cannot be empty");
        }

        attribute.setReviewerComments(reviewerComments);
        attributeRepository.save(attribute);

        return ResponseEntity.ok("Reviewer comments saved successfully");
    }

    @GetMapping("/{attributeId}/reviewer-comments")
    public ResponseEntity<Object> getReviewerComments(@PathVariable Long attributeId) {
        Optional<PerformanceAttribute> optionalAttribute = attributeRepository.findById(attributeId);
        if (optionalAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_ATTRIBUTE_NOT_FOUND);
        }

        PerformanceAttribute attribute = optionalAttribute.get();

        Map<String, Object> response = new HashMap<>();
        response.put(CONST_ATTRIBUTE_ID, attribute.getAttributeId());
        response.put("reviewerComments", attribute.getReviewerComments());

        return ResponseEntity.ok(response);
    }

    // --------------------------------------------------------------------------------
    // ATTRIBUTE HISTORY ENDPOINTS
    // --------------------------------------------------------------------------------

    private boolean isArchivedOrCompleted(PerformanceAttribute a) {
        if (a.isArchived())
            return true;
        String s = a.getStatus();
        return "complete".equalsIgnoreCase(s)
                || "completed".equalsIgnoreCase(s)
                || "rejected".equalsIgnoreCase(s)
                || "rejected by reviewer".equalsIgnoreCase(s);
    }

    private boolean matchesYear(PerformanceAttribute a, String year) {
        if (a.getArchivedHalf() != null && a.getArchivedHalf().contains(year))
            return true;
        if (a.getEndDate() != null && a.getEndDate().toString().contains(year))
            return true;
        if (a.getStartDate() != null && a.getStartDate().toString().contains(year))
            return true;
        return false;
    }

    @GetMapping("/history/employee/{employeeId}")
    public ResponseEntity<Object> getAttributeHistory(
            @PathVariable String employeeId,
            @RequestParam(required = false) String year) {
        try {
            List<PerformanceAttribute> allAttributes = attributeRepository.findByEmployeeId(employeeId);

            Stream<PerformanceAttribute> stream = allAttributes.stream()
                    .filter(this::isArchivedOrCompleted);

            if (year != null && !year.trim().isEmpty()) {
                stream = stream.filter(a -> matchesYear(a, year));
            }

            List<PerformanceAttribute> archivedAttributes = stream.collect(Collectors.toList());

            return ResponseEntity.ok(archivedAttributes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching attribute history: " + e.getMessage());
        }
    }

    @GetMapping("/history/employee/{employeeId}/years")
    public ResponseEntity<Object> getAvailableYears(@PathVariable String employeeId) {
        try {
            List<PerformanceAttribute> allAttributes = attributeRepository.findByEmployeeId(employeeId);

            Set<String> years = allAttributes.stream()
                    .filter(a -> {
                        if (a.isArchived())
                            return true;
                        String s = a.getStatus();
                        return "complete".equalsIgnoreCase(s)
                                || "completed".equalsIgnoreCase(s)
                                || "rejected".equalsIgnoreCase(s)
                                || "rejected by reviewer".equalsIgnoreCase(s);
                    })
                    .map(a -> {
                        if (a.getArchivedHalf() != null && a.getArchivedHalf().contains(" ")) {
                            String[] parts = a.getArchivedHalf().split(" ");
                            if (parts.length > 1)
                                return parts[1];
                        }
                        if (a.getEndDate() != null) {
                            return a.getEndDate().toString().split("-")[0];
                        }
                        if (a.getStartDate() != null) {
                            return a.getStartDate().toString().split("-")[0];
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<String> sortedYears = years.stream()
                    .sorted(Comparator.reverseOrder())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(sortedYears);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching available years: " + e.getMessage());
        }
    }
}
