package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.PerformanceGoal;

import com.register.example.payload.EmployeeGoalStatusDTO;
import com.register.example.payload.EmployeeGoalStatusDTO.GoalStatusUpdateDTO;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PerformanceGoalRepository;

import com.register.example.service.PerformanceGoalService;
import com.register.example.payload.ReviewRequest;
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
@RequestMapping("/api/goals")

public class PerformanceGoalController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PerformanceGoalController.class);

    private static final String CONST_GOAL_NOT_FOUND = "Goal not found";
    private static final String CONST_GOAL_ID = "goalId";

    private final PerformanceGoalService performanceGoalService;
    private final EmployeeRepository employeeRepository;
    private final PerformanceGoalRepository goalRepository;

    // Corrected Constructor Injection (removed @Autowired from fields)
    @Autowired
    public PerformanceGoalController(PerformanceGoalService performanceGoalService,
            EmployeeRepository employeeRepository,
            PerformanceGoalRepository goalRepository) {
        this.performanceGoalService = performanceGoalService;
        this.employeeRepository = employeeRepository;
        this.goalRepository = goalRepository;
    }

    @GetMapping("/fetch-reports")
    public ResponseEntity<List<PerformanceGoal>> getPerformanceReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String goalTitle,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.util.Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.util.Date endDate) {

        List<PerformanceGoal> goals = performanceGoalService.getFilteredGoals(employeeId, goalTitle, status, startDate,
                endDate);
        return ResponseEntity.ok(goals);
    }

    /**
     * Helper method to validate and pre-process goal fields (for both single and
     * batch assignment).
     */
    private Optional<Employee> validateAndPrepareGoals(List<PerformanceGoal> goals) {
        if (goals.isEmpty()) {
            return Optional.empty();
        }

        // 1. Check for a consistent target employee ID (using the first goal)
        String targetEmployeeId = goals.get(0).getEmployeeId();
        if (targetEmployeeId == null || targetEmployeeId.trim().isEmpty()) {
            return Optional.empty();
        }

        // 2. Validate employee existence
        Optional<Employee> optionalEmp = employeeRepository.findByEmployeeId(targetEmployeeId);
        if (optionalEmp.isEmpty()) {
            return Optional.empty();
        }

        Employee employee = optionalEmp.get();

        // 3. Set common fields for all goals
        LocalDate localStartDate = LocalDate.now();

        for (PerformanceGoal goal : goals) {
            // Ensure all goals are for the same employee
            if (!targetEmployeeId.equals(goal.getEmployeeId())) {
                return Optional.empty(); // Goals in batch must be for the same employee
            }
            goal.setEmployeeId(employee.getEmployeeId());
            goal.setStartDate(Date.valueOf(localStartDate));
            goal.setEndDate(null); // End Date should be empty until Reviewed
            // Only set to Pending if not already set (e.g. allow 'draft')
            if (goal.getStatus() == null || goal.getStatus().trim().isEmpty()) {
                goal.setStatus("Pending");
            }
        }

        return optionalEmp;
    }

    // --------------------------------------------------------------------------------
    // GOAL ASSIGNMENT
    // --------------------------------------------------------------------------------

    @PostMapping("/assign")
    public ResponseEntity<Object> assignGoal(@RequestBody PerformanceGoal goal) {
        try {

            // Use the helper to validate and set dates/status for a single goal
            Optional<Employee> optionalEmp = validateAndPrepareGoals(List.of(goal));

            if (optionalEmp.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Employee not found or goal data is invalid.");
            }

            // Call the service method to save and send a single notification
            PerformanceGoal saved = performanceGoalService.assignGoal(goal);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning goal: " + e.getMessage());
        }
    }

    @PostMapping("/assign-batch")
    public ResponseEntity<Object> assignGoalsBatch(@RequestBody List<PerformanceGoal> goals) {
        if (goals == null || goals.isEmpty()) {
            return ResponseEntity.badRequest().body("List of goals cannot be empty.");
        }

        try {
            // Use the helper to validate and set dates/status for the entire batch
            Optional<Employee> optionalEmp = validateAndPrepareGoals(goals);

            if (optionalEmp.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Validation failed. Ensure goals are present, have a valid Employee ID, and are for the same employee.");
            }

            // Call the service method to save all goals and send ONE consolidated
            // notification
            List<PerformanceGoal> savedGoals = performanceGoalService.assignGoalsBatch(goals);

            return ResponseEntity.ok(savedGoals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning goals in batch: " + e.getMessage());
        }
    }

    // --------------------------------------------------------------------------------
    // EMPLOYEE SUBMISSION ENDPOINTS
    // --------------------------------------------------------------------------------

    @PutMapping("/employee/self-assessments")
    public ResponseEntity<Object> submitBulkSelfAssessment(
            @RequestBody List<EmployeeGoalStatusDTO> assessments) {

        if (assessments == null || assessments.isEmpty()) {
            return ResponseEntity.badRequest().body("Assessment list cannot be empty.");
        }

        try {
            // DELEGATE TO SERVICE: The service handles updating all goals and sending
            // ONE consolidated notification to the manager.
            List<PerformanceGoal> updatedGoals = performanceGoalService
                    .submitBulkSelfAssessmentAndNotifyManager(assessments);

            if (updatedGoals.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No valid goals found to update with self-assessment.");
            }

            return ResponseEntity.ok(updatedGoals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit bulk self-assessment: " + e.getMessage());
        }
    }

    // Existing single-goal employee feedback endpoint (no notification needed here,
    // as bulk submission is preferred for notification)
    @PutMapping("/{goalId}/employee-feedback")
    public ResponseEntity<Object> updateEmployeeFeedback(@PathVariable Long goalId,
            @RequestBody EmployeeGoalStatusDTO.GoalStatusUpdateDTO request) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_GOAL_NOT_FOUND);
        }
        PerformanceGoal goal = optionalGoal.get();
        goal.setStatus(request.getStatus());
        goal.setSelfAssessment(request.getSelfAssessment());
        goal.setRating(request.getRating());

        goal.setManagerRating(request.getManagerRating());
        goal.setManagerComments(request.getManagerComments());
        goalRepository.save(goal);
        return ResponseEntity.ok("Employee feedback saved successfully");
    }

    // --------------------------------------------------------------------------------
    // REST OF THE ENDPOINTS
    // --------------------------------------------------------------------------------

    @GetMapping("/employee/{empId}")
    public ResponseEntity<Object> getGoalsForEmployee(@PathVariable String empId) {
        try {
            List<PerformanceGoal> goals = performanceGoalService.getGoalsByEmployee(empId);

            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{goalId}")
    public ResponseEntity<Object> deleteGoal(@PathVariable Long goalId) {
        try {
            if (!goalRepository.existsById(goalId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found with ID: " + goalId);
            }
            goalRepository.deleteById(goalId);
            return ResponseEntity.ok("Goal with ID " + goalId + " deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete goal: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<Object> getGoalsForManager(@PathVariable String managerId) {
        try {

            List<PerformanceGoal> goals = performanceGoalService.getGoalsByManager(managerId);

            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/rejected/{managerId}")
    public ResponseEntity<Object> getRejectedGoalsByManager(@PathVariable String managerId) {
        try {

            List<PerformanceGoal> goals = performanceGoalService.getRejectedGoalsByManager(managerId);

            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching rejected goals: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/reassign/{goalId}")
    public ResponseEntity<Object> reassignGoal(@PathVariable Long goalId, @RequestBody PerformanceGoal updatedGoal) {
        try {

            PerformanceGoal reassignedGoal = performanceGoalService.reassignGoal(goalId, updatedGoal);

            return new ResponseEntity<>(reassignedGoal, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to reassign goal: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employees")
    public ResponseEntity<Object> getEmployeesAssignedByManager(@PathVariable String managerId) {
        try {

            List<Employee> employees = performanceGoalService.getEmployeesUnderManager(managerId);

            return new ResponseEntity<>(employees, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employees: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/submitted/{managerId}")
    public ResponseEntity<Object> getSubmittedGoalsForManager(@PathVariable String managerId) {
        try {

            List<PerformanceGoal> goals = performanceGoalService.getSubmittedGoalsByManager(managerId);

            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching submitted goals: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employee-goals")
    public ResponseEntity<Object> getGoalsUnderManager(@PathVariable String managerId) {
        try {

            List<EmployeeGoalStatusDTO> goals = performanceGoalService.getEmployeeGoalsByManager(managerId);

            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employee goals: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employee/{employeeId}")
    public ResponseEntity<Object> getEmployeeGoalDetailsUnderManager(@PathVariable String managerId,
            @PathVariable String employeeId) {
        try {
            List<PerformanceGoal> goals = performanceGoalService.getGoalsForEmployeeUnderManager(managerId, employeeId);

            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employee goal details: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{goalId}/status")
    public ResponseEntity<Object> updateGoalStatus(@PathVariable Long goalId, @RequestBody GoalStatusUpdateDTO updateDTO) {
        try {

            PerformanceGoal updatedGoal = performanceGoalService.updateGoalStatusAndFeedback(goalId,
                    updateDTO.getStatus(), updateDTO.getSelfAssessment());

            return new ResponseEntity<>(updatedGoal, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update goal status: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/reviewer/{reviewerId}/employees")
    public ResponseEntity<Object> getEmployees(@PathVariable String reviewerId) {
        try {

            List<Employee> employees = performanceGoalService.getEmployeesUnderReviewer(reviewerId);

            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching employees under reviewer: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}/employees")
    public List<Employee> getEmployeesByHrId(@PathVariable String hrId) {

        return performanceGoalService.getEmployeesByHrId(hrId);
    }

    /**
     * ⭐ CRITICAL ENDPOINT: Bulk Goal Review (Approve/Reject).
     */
    @PatchMapping("/review")
    public ResponseEntity<Object> reviewGoals(@RequestBody ReviewRequest reviewRequest) {
        try {
            List<Long> goalIds = reviewRequest.getGoalIds();
            String status = reviewRequest.getStatus();

            String rejectionReason = null;

            if (goalIds == null || goalIds.isEmpty() || status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Goal IDs and status are mandatory.");
            }

            // Call the service method which contains the full notification logic
            List<PerformanceGoal> updatedGoals = performanceGoalService.reviewGoalsBulk(
                    goalIds,
                    status,
                    rejectionReason);

            return ResponseEntity.ok(updatedGoals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to review goals: " + e.getMessage());
        }
    }

    @GetMapping("/{goalId}/feedback")
    public ResponseEntity<Object> getFeedback(@PathVariable Long goalId) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_GOAL_NOT_FOUND);
        }
        PerformanceGoal goal = optionalGoal.get();
        Map<String, Object> feedbackData = new HashMap<>();
        feedbackData.put(CONST_GOAL_ID, goal.getGoalId());
        feedbackData.put("rating", goal.getRating());
        feedbackData.put("selfAssessment", goal.getSelfAssessment());

        feedbackData.put("status", goal.getStatus());
        return ResponseEntity.ok(feedbackData);
    }

    @PutMapping("/{goalId}/manager-feedback")
    public ResponseEntity<Object> updateManagerFeedback(
            @PathVariable Long goalId,
            @RequestBody EmployeeGoalStatusDTO.GoalStatusUpdateDTO feedbackDTO) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_GOAL_NOT_FOUND);
        }
        PerformanceGoal goal = optionalGoal.get();

        goal.setManagerRating(feedbackDTO.getManagerRating());
        goal.setManagerComments(feedbackDTO.getManagerComments());
        goalRepository.save(goal);
        return ResponseEntity.ok("Manager feedback updated successfully");
    }

    @PutMapping("/manager-feedback")
    public ResponseEntity<Object> submitBulkFeedback(@RequestBody List<EmployeeGoalStatusDTO> feedbackList) {
        try {

            // DELEGATE TO SERVICE: Calls the service method which notifies the Reviewer
            List<PerformanceGoal> updatedGoals = performanceGoalService.submitBulkManagerFeedback(feedbackList);
            return ResponseEntity.ok(updatedGoals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit bulk feedback: " + e.getMessage());

        }
    }

    @GetMapping("/{goalId}/manager-feedback")
    public ResponseEntity<Object> getManagerFeedback(@PathVariable Long goalId) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_GOAL_NOT_FOUND);
        }
        PerformanceGoal goal = optionalGoal.get();
        Map<String, Object> response = new HashMap<>();
        response.put(CONST_GOAL_ID, goal.getGoalId());
        response.put("goalTitle", goal.getGoalTitle());

        response.put("managerRating", goal.getManagerRating());
        response.put("managerComments", goal.getManagerComments());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{goalId}/reviewer-comments")
    public ResponseEntity<Object> updateReviewerComments(@PathVariable Long goalId,
            @RequestBody Map<String, String> payload) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_GOAL_NOT_FOUND);
        }
        PerformanceGoal goal = optionalGoal.get();

        String reviewerComments = payload.get("reviewerComments");
        if (reviewerComments == null || reviewerComments.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Reviewer comments cannot be empty");
        }

        goal.setReviewerComments(reviewerComments);
        goalRepository.save(goal);

        return ResponseEntity.ok("Reviewer comments saved successfully");
    }

    @GetMapping("/{goalId}/reviewer-comments")
    public ResponseEntity<Object> getReviewerComments(@PathVariable Long goalId) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CONST_GOAL_NOT_FOUND);
        }

        PerformanceGoal goal = optionalGoal.get();

        Map<String, Object> response = new HashMap<>();
        response.put(CONST_GOAL_ID, goal.getGoalId());
        response.put("reviewerComments", goal.getReviewerComments());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<Object> getEmployeeById(@PathVariable String employeeId) {
        Optional<Employee> optionalEmployee = employeeRepository.findByEmployeeId(employeeId);
        if (optionalEmployee.isPresent()) {
            return ResponseEntity.ok(optionalEmployee.get()); // Return the full Employee object
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Employee not found.");
        }
    }

    // Inside PerformanceGoalController.java

    @GetMapping("/by-role/{role}/{roleId}")
    public ResponseEntity<Object> getEmployeesByRoleAndId(@PathVariable String role, @PathVariable String roleId) {
        try {
            List<Map<String, Object>> employeesWithStatus = performanceGoalService.getEmployeesWithOverallStatus(role,
                    roleId);
            if (employeesWithStatus.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            return ResponseEntity.ok(employeesWithStatus);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch employee list: " + e.getMessage());
        }
    }

    // --------------------------------------------------------------------------------
    // GOAL HISTORY ENDPOINTS
    // --------------------------------------------------------------------------------

    private boolean isArchivedOrCompleted(PerformanceGoal g) {
        if (g.isArchived())
            return true;
        String s = g.getStatus();
        return "complete".equalsIgnoreCase(s)
                || "completed".equalsIgnoreCase(s)
                || "rejected".equalsIgnoreCase(s)
                || "rejected by reviewer".equalsIgnoreCase(s);
    }

    private boolean matchesYear(PerformanceGoal g, String year) {
        if (g.getArchivedHalf() != null && g.getArchivedHalf().contains(year))
            return true;
        if (g.getEndDate() != null && g.getEndDate().toString().contains(year))
            return true;
        if (g.getStartDate() != null && g.getStartDate().toString().contains(year))
            return true;
        return false;
    }

    /**
     * Get all archived goals for a specific employee
     * Optional year filter to get goals from a specific year
     */
    @GetMapping("/history/employee/{employeeId}")
    public ResponseEntity<Object> getGoalHistory(
            @PathVariable String employeeId,
            @RequestParam(required = false) String year) {
        try {
            List<PerformanceGoal> archivedGoals;

            List<PerformanceGoal> allGoals = goalRepository.findByEmployeeId(employeeId);

            Stream<PerformanceGoal> stream = allGoals.stream()
                    .filter(this::isArchivedOrCompleted);

            if (year != null && !year.trim().isEmpty()) {
                stream = stream.filter(g -> matchesYear(g, year));
            }

            archivedGoals = stream.collect(Collectors.toList());

            return ResponseEntity.ok(archivedGoals);
        } catch (

        Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching goal history: " + e.getMessage());
        }
    }

    /**
     * Get all unique years from archived goals for an employee (for filter
     * dropdown)
     */
    @GetMapping("/history/employee/{employeeId}/years")
    public ResponseEntity<Object> getAvailableYears(@PathVariable String employeeId) {
        try {
            List<PerformanceGoal> allGoals = goalRepository.findByEmployeeId(employeeId);

            // Extract years from both archived, reviewed, and rejected goals
            Set<String> years = allGoals.stream()
                    .filter(g -> {
                        if (g.isArchived())
                            return true;
                        String s = g.getStatus();
                        return "complete".equalsIgnoreCase(s)
                                || "completed".equalsIgnoreCase(s)
                                || "rejected".equalsIgnoreCase(s)
                                || "rejected by reviewer".equalsIgnoreCase(s);
                    })
                    .map(g -> {
                        if (g.getArchivedHalf() != null && g.getArchivedHalf().contains(" ")) {
                            // Try to parse "H1 2025" -> "2025"
                            String[] parts = g.getArchivedHalf().split(" ");
                            if (parts.length > 1)
                                return parts[1];
                        }
                        if (g.getEndDate() != null) {
                            // "2025-10-10" -> "2025"
                            return g.getEndDate().toString().split("-")[0];
                        }
                        if (g.getStartDate() != null) {
                            // Use startDate as fallback for rejected goals
                            return g.getStartDate().toString().split("-")[0];
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
