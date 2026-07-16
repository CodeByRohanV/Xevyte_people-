package com.register.example.service;

import com.register.example.entity.PerformanceGoal;
import com.register.example.entity.Employee;
import com.register.example.entity.Notification;
import com.register.example.payload.EmployeeGoalStatusDTO;
import com.register.example.repository.PerformanceGoalRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PerformanceGoalService {

    private final PerformanceGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;

    @Autowired

    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired

    public PerformanceGoalService(PerformanceGoalRepository goalRepository,
            EmployeeRepository employeeRepository) {
        this.goalRepository = goalRepository;
        this.employeeRepository = employeeRepository;
    }

    // ----------------- CORE ASSIGNMENT METHODS -----------------

    public PerformanceGoal assignGoal(PerformanceGoal goal) {
        goal.setStatus("Pending");
        PerformanceGoal savedGoal = goalRepository.save(goal);

        Employee employee = getEmployeeById(savedGoal.getEmployeeId());
        if (employee != null) {
            String message = String.format(
                    "You have been assigned a new performance goal: \"%s\" by your manager.",
                    savedGoal.getGoalTitle());
            sendNotificationToEmployee(employee, message, "New Goal Assigned");
        }

        return savedGoal;
    }

    public List<PerformanceGoal> assignGoalsBatch(List<PerformanceGoal> goals) {
        if (goals == null || goals.isEmpty()) {
            return Collections.emptyList();
        }

        List<PerformanceGoal> savedGoals = goals.stream()
                .map(goal -> {
                    if (goal.getStatus() == null || goal.getStatus().isEmpty()) {
                        goal.setStatus("Pending");
                    }
                    return goalRepository.save(goal);
                })
                .collect(Collectors.toList());

        String employeeId = savedGoals.get(0).getEmployeeId();
        Employee employee = getEmployeeById(employeeId);

        if (employee != null) {
            sendNotificationForBatchAssignment(employee, savedGoals);
        }

        return savedGoals;
    }

    private void sendNotificationForBatchAssignment(Employee emp, List<PerformanceGoal> goals) {
        if (goals.isEmpty())
            return;

        String goalTitles = goals.stream()
                .map(PerformanceGoal::getGoalTitle)
                .collect(Collectors.joining(", "));

        String message = String.format(
                "Your manager has assigned you new goals, Please Check.",
                goalTitles);

        sendNotificationToEmployee(emp, message, "New Goals Assigned");
    }

    // ----------------- NOTIFICATION AND UTILITY -----------------

    private void sendNotificationToEmployee(Employee emp, String message, String emailSubject) {
        if (emp == null)
            return;

        // In-App Notification
        Notification notification = new Notification();
        notification.setEmployeeId(emp.getEmployeeId());
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);
        notificationRepository.save(notification);

        // Email Notification
        emailService.sendEmail(emp.getEmail(), emailSubject, message);
    }

    private Employee getEmployeeById(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId).orElse(null);
    }

    private Employee getReviewerById(String reviewerId) {
        return employeeRepository.findByEmployeeId(reviewerId).orElse(null);
    }

    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    public String markNotificationAsRead(Long id) {
        Optional<Notification> optional = notificationRepository.findById(id);
        if (optional.isPresent()) {
            Notification notif = optional.get();
            notif.setRead(true);
            notificationRepository.save(notif);
            return "Notification marked as read.";
        } else {
            return "Notification not found.";
        }
    }

    // ----------------- GOAL RETRIEVAL & MANAGEMENT -----------------

    public List<PerformanceGoal> getGoalsByEmployee(String employeeId) {
        return goalRepository.findByEmployeeId(employeeId);
    }

    public List<PerformanceGoal> getRejectedGoalsByManager(String managerId) {
        return goalRepository.findByAssignedByAndStatus(managerId, "Rejected");
    }

    public PerformanceGoal reassignGoal(Long goalId, PerformanceGoal updatedGoal) {
        PerformanceGoal existingGoal = goalRepository.findById(goalId).orElse(null);
        if (existingGoal != null) {
            String originalEmployeeId = existingGoal.getEmployeeId(); // Store original ID

            // 1. Update Goal Fields
            existingGoal.setGoalTitle(updatedGoal.getGoalTitle());
            existingGoal.setGoalDescription(updatedGoal.getGoalDescription());
            existingGoal.setMetric(updatedGoal.getMetric());
            existingGoal.setTarget(updatedGoal.getTarget());
            existingGoal.setAttributes(updatedGoal.getAttributes());
            // 2. Set the NEW Employee ID
            existingGoal.setEmployeeId(updatedGoal.getEmployeeId());

            if (updatedGoal.getStatus() != null && !updatedGoal.getStatus().isEmpty()) {
                existingGoal.setStatus(updatedGoal.getStatus());
            } else {
                existingGoal.setStatus("Pending");
            }
            // Clear rejection reason if moving to pending/draft status (unless status is
            // Rejected/etc, but here we assume re-submission flow)
            if (!"Rejected".equalsIgnoreCase(existingGoal.getStatus())) {
                existingGoal.setRejectionReason(null);
            }

            PerformanceGoal savedGoal = goalRepository.save(existingGoal);

            // 3. 🔔 NOTIFICATION LOGIC FOR THE EMPLOYEE 🔔
            // Check if the goal was reassigned to a new employee or simply updated
            // and put back into a "Pending" state for the current employee.

            Employee employee = getEmployeeById(savedGoal.getEmployeeId());
            if (employee != null) {
                String managerName = ""; // Optional: get manager name for better message
                Employee manager = getEmployeeById(savedGoal.getAssignedBy());
                if (manager != null) {
                    managerName = manager.getFirstName() + " " + manager.getLastName();

                }

                String action = originalEmployeeId.equals(savedGoal.getEmployeeId())
                        ? "updated and re-assigned"
                        : "reassigned";

                String message = String.format(
                        "Your goal has been re-assign to you by your manager . Please review and accept/reject it.",
                        savedGoal.getGoalTitle(),
                        action,
                        managerName.isEmpty() ? "" : managerName);

                // Send notification to the employee
                sendNotificationToEmployee(employee, message, "Goal " + action + " by Manager");
            }

            // ❌ Remove the old notification to the manager about an 'employee resubmission'
            // if this method is intended only for manager re-assignment/update.

            // The original code's manager notification:
            /*
             * Employee manager = getEmployeeById(savedGoal.getAssignedBy());
             * Employee employee = getEmployeeById(savedGoal.getEmployeeId());
             * if (manager != null && employee != null) {
             * String message = String.format(
             * "Employee %s has resubmitted their goal \"%s\" for review after a rejection. Please review and submit to the Reviewer."
             * ,
             * employee.getName(),
             * savedGoal.getGoalTitle()
             * );
             * sendNotificationToEmployee(manager, message, "Goal Resubmitted by Employee");
             * }
             */

            return savedGoal;
        }
        return null;
    }

    public List<PerformanceGoal> getSubmittedGoalsByManager(String managerId) {
        return goalRepository.findByAssignedByAndStatus(managerId, "Submitted");
    }

    public List<PerformanceGoal> getGoalsForEmployeeUnderManager(String managerId, String employeeId) {
        List<PerformanceGoal> allGoals = goalRepository.findByEmployeeId(employeeId);
        return allGoals.stream()
                .filter(goal -> managerId.equals(goal.getAssignedBy()))
                .collect(Collectors.toList());
    }

    public List<EmployeeGoalStatusDTO> getEmployeeGoalsByManager(String managerId) {
        return goalRepository.findEmployeeGoalsByManager(managerId);
    }

    public List<PerformanceGoal> getGoalsByManager(String managerId) {
        return goalRepository.findByAssignedBy(managerId);
    }

    // ----------------- EMPLOYEE ACCEPTS OR REJECTS GOAL -----------------

    /**
     * Employee accepts a goal (status changes to "In Progress")
     * → Notify the manager about the acceptance.
     */
    // package com.register.example.service;

    public PerformanceGoal updateGoalStatus(Long goalId, String status) {
        PerformanceGoal goal = goalRepository.findById(goalId).orElse(null);
        if (goal != null) {
            goal.setStatus(status);
            PerformanceGoal savedGoal = goalRepository.save(goal);
            if ("In Progress".equalsIgnoreCase(status)) {
                notifyManagerOfGoalAcceptance(savedGoal);
            }
            return savedGoal;
        }
        return null;
    }

    /**
     * Employee rejects a goal (status changes to "Rejected")
     * → Notify the manager about the rejection and include the reason.
     */
    public PerformanceGoal updateGoalStatusAndFeedback(Long goalId, String status, String feedback) {
        PerformanceGoal goal = goalRepository.findById(goalId).orElse(null);

        if (goal != null) {
            goal.setStatus(status);
            goal.setRejectionReason(feedback);
            PerformanceGoal updatedGoal = goalRepository.save(goal);

            // 🔔 Notify manager if status is "Rejected"
            if ("Rejected".equalsIgnoreCase(status)) {
                notifyManagerOfGoalRejection(goal, feedback);
            } else if ("In Progress".equalsIgnoreCase(status)) {
                notifyManagerOfGoalAcceptance(updatedGoal);
            }

            return updatedGoal;
        }
        return null;
    }

    private void populateEmployeeNames(List<PerformanceGoal> goals) {
        for (PerformanceGoal goal : goals) {
            employeeRepository.findByEmployeeId(goal.getEmployeeId())
                    .ifPresent(emp -> goal.setEmployeeName(emp.getFirstName() + " " + emp.getLastName()));
        }
    }

    public List<PerformanceGoal> getFilteredGoals(String employeeId, String goalTitle, String status, Date startDate,
            Date endDate) {
        List<PerformanceGoal> goals = goalRepository
                .findAll((Specification<PerformanceGoal>) (root, query, criteriaBuilder) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    if (employeeId != null && !employeeId.trim().isEmpty()) {
                        String[] ids = employeeId.split(",");
                        if (ids.length > 1) {
                            List<String> idList = Arrays.stream(ids).map(String::trim).filter(s -> !s.isEmpty())
                                    .toList();
                            predicates.add(root.get("employeeId").in(idList));
                        } else {
                            predicates.add(criteriaBuilder.equal(root.get("employeeId"), employeeId.trim()));
                        }
                    }
                    if (goalTitle != null && !goalTitle.trim().isEmpty()) {
                        predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("goalTitle")),
                                "%" + goalTitle.toLowerCase() + "%"));
                    }
                    if (status != null && !status.trim().isEmpty() && !"All".equalsIgnoreCase(status)) {
                        predicates.add(criteriaBuilder.equal(root.get("status"), status));
                    }
                    if (startDate != null) {
                        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startDate"), startDate));
                    }
                    if (endDate != null) {
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), endDate));
                    }

                    return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
                });

        populateEmployeeNames(goals);
        return goals;
    }

    // ----------------- INTERNAL NOTIFICATION HELPERS -----------------
    // package com.register.example.service;

    private void notifyManagerOfGoalRejection(PerformanceGoal goal, String feedback) {
        String managerId = goal.getAssignedBy();
        String employeeId = goal.getEmployeeId();

        if (managerId == null || managerId.isEmpty()) {
            // fallback to assignedManagerId from employee record
            Employee emp = getEmployeeById(employeeId);
            if (emp != null) {
                managerId = emp.getAssignedManagerId();
            }
        }

        Employee manager = getEmployeeById(managerId);
        Employee employee = getEmployeeById(employeeId);

        if (manager != null && employee != null) {
            String message = String.format(
                    " %s  has rejected the goal. Reason: %s",
                    employee.getFirstName() + " " + employee.getLastName(), goal.getGoalTitle(),

                    (feedback != null && !feedback.isEmpty()) ? feedback : "No reason provided");
            sendNotificationToEmployee(manager, message, "Goal Rejected");
        } else {
            System.out.println(" Could not send rejection notification — manager or employee missing");
        }
    }

    private void notifyManagerOfGoalAcceptance(PerformanceGoal goal) {
        String managerId = goal.getAssignedBy();
        String employeeId = goal.getEmployeeId();

        if (managerId == null || managerId.isEmpty()) {
            Employee emp = getEmployeeById(employeeId);
            if (emp != null) {
                managerId = emp.getAssignedManagerId();
            }
        }

        Employee manager = getEmployeeById(managerId);
        Employee employee = getEmployeeById(employeeId);

        if (manager != null && employee != null) {
            String message = String.format(
                    " %s has accepted the goal: \"%s\".",
                    employee.getFirstName() + " " + employee.getLastName(),
                    goal.getGoalTitle());
            sendNotificationToEmployee(manager, message, "Goal Accepted");
        } else {
            System.out.println(" Could not send acceptance notification — manager or employee missing");
        }
    }

    public List<PerformanceGoal> updateGoalsStatus(List<Long> goalIds, String status) {
        List<PerformanceGoal> updatedGoals = new ArrayList<>();
        for (Long id : goalIds) {
            PerformanceGoal goal = goalRepository.findById(id).orElse(null);
            if (goal != null) {
                goal.setStatus(status);
                updatedGoals.add(goalRepository.save(goal));
            }
        }
        return updatedGoals;
    }

    // ----------------- EMPLOYEE BULK SELF-ASSESSMENT AND MANAGER NOTIFICATION
    // -----------------

    /**
     * Updates a list of goals with employee's self-assessment and notifies the
     * manager.
     * Note: This method assumes the DTO provides unique self-assessment and rating
     * for each goal.
     * If the DTO only contains Goal ID, status, selfAssessment, and rating, it
     * should be
     * a list of DTOs, not just a list of IDs. For simplicity and based on the
     * provided DTO structure,
     * we will use a list of DTOs here to update goals individually.
     *
     * @param assessments List of DTOs containing Goal ID, status, selfAssessment,
     *                    and rating.
     * @return List of updated PerformanceGoals.
     */
    // ----------------- EMPLOYEE SELF-ASSESSMENT SUBMISSION -----------------

    /**
     * When an employee submits self-assessments for multiple goals,
     * this method updates the goals and notifies the assigned manager.
     */
    public List<PerformanceGoal> submitBulkSelfAssessmentAndNotifyManager(
            List<EmployeeGoalStatusDTO> assessments) {

        if (assessments == null || assessments.isEmpty()) {
            return Collections.emptyList();
        }

        List<PerformanceGoal> updatedGoals = new ArrayList<>();
        String employeeId = null;
        String managerId = null;
        List<String> submittedGoalTitles = new ArrayList<>();

        for (EmployeeGoalStatusDTO assessment : assessments) {
            PerformanceGoal goal = goalRepository.findById(assessment.getGoalId()).orElse(null);

            if (goal != null) {
                // Capture employeeId & managerId
                if (employeeId == null) {
                    employeeId = goal.getEmployeeId();
                    managerId = goal.getAssignedBy(); // primary manager
                    if (managerId == null || managerId.isEmpty()) {
                        // fallback to assignedManagerId from employee record
                        Employee emp = getEmployeeById(employeeId);
                        if (emp != null) {
                            managerId = emp.getAssignedManagerId();
                        }
                    }
                }

                // Update self-assessment details
                if (assessment.getStatus() != null) {
                    goal.setStatus(assessment.getStatus());
                }
                if (assessment.getSelfAssessment() != null) {
                    goal.setSelfAssessment(assessment.getSelfAssessment());
                }
                if (assessment.getRating() != null) {
                    goal.setRating(assessment.getRating());
                }

                // Reset previous manager feedback (fresh review cycle)
                goal.setManagerRating(null);
                goal.setManagerComments(null);

                PerformanceGoal savedGoal = goalRepository.save(goal);
                updatedGoals.add(savedGoal);
                submittedGoalTitles.add(savedGoal.getGoalTitle());
            }
        }

        // 🔔 Send notification to Manager
        if (employeeId != null && managerId != null && !submittedGoalTitles.isEmpty()) {
            notifyManagerOfEmployeeSelfAssessment(managerId, employeeId, submittedGoalTitles);
        } else {
            System.out.println("DEBUG: Manager ID or Employee ID missing, notification not sent.");
        }

        return updatedGoals;
    }

    private void notifyManagerOfEmployeeSelfAssessment(String managerId, String employeeId, List<String> goalTitles) {
        System.out.println("DEBUG: notifyManagerOfEmployeeSelfAssessment called");
        System.out.println("EmployeeId: " + employeeId + ", ManagerId: " + managerId);

        Employee manager = getEmployeeById(managerId);
        Employee employee = getEmployeeById(employeeId);

        if (employee != null && manager != null) {
            String goalsList = String.join(", ", goalTitles);
            String message = String.format(
                    " %s has submitted self-assessment for the assigned goals. Please review and provide your feedback.",
                    employee.getFirstName() + " " + employee.getLastName(), goalsList

            );

            sendNotificationToEmployee(manager, message, "Employee Self-Assessments Submitted");
        } else {
            System.out.println("DEBUG: Manager or Employee is null - cannot send notification");
        }
    }

    // ----------------- MANAGER FEEDBACK AND REVIEWER NOTIFICATION
    // -----------------

    public List<PerformanceGoal> submitBulkManagerFeedback(List<EmployeeGoalStatusDTO> feedbackList) {
        if (feedbackList == null || feedbackList.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<String>> employeeGoalsForReviewerNotification = new HashMap<>();
        List<PerformanceGoal> updatedGoals = new ArrayList<>();

        for (EmployeeGoalStatusDTO feedback : feedbackList) {
            PerformanceGoal goal = goalRepository.findById(feedback.getGoalId()).orElse(null);
            if (goal != null) {
                // 1. Update Manager Feedback
                if (feedback.getManagerComments() != null) {
                    goal.setManagerComments(feedback.getManagerComments());
                }
                if (feedback.getManagerRating() != null) {
                    goal.setManagerRating(feedback.getManagerRating());
                }

                // REMOVED: goal.setStatus("Approved"); - This method should only update data.
                // Status change happens in /review endpoint.

                PerformanceGoal savedGoal = goalRepository.save(goal);
                updatedGoals.add(savedGoal);

                // 2. Notification logic removed/disabled here to prevent notifications on
                // "Save"
                // Notifications should be handled when status actually changes (e.g. in
                // reviewGoalsBulk)
            }
        }

        // 3. Send Notifications to Reviewers
        employeeGoalsForReviewerNotification.forEach((employeeId, goalTitles) -> {
            Employee employee = getEmployeeById(employeeId);
            if (employee != null && employee.getReviewerId() != null) {
                Employee reviewer = getReviewerById(employee.getReviewerId());
                if (reviewer != null) {
                    sendNotificationToReviewer(
                            reviewer,
                            employee.getFirstName() + " " + employee.getLastName(),
                            goalTitles);

                }
            }
        });

        return updatedGoals;
    }

    private void sendNotificationToReviewer(Employee reviewer, String employeeName, List<String> goalTitles) {
        String goalTitlesStr = String.join(", ", goalTitles);

        String message = String.format(
                "Manager has submitted feedback for  %s's goals.",
                employeeName,
                goalTitlesStr);

        sendNotificationToEmployee(reviewer, message, "Manager Feedback Submitted for Goals");
    }

    // ----------------- REVIEWER ACTION AND NOTIFICATION (FIXED) -----------------

    public List<PerformanceGoal> reviewGoalsBulk(List<Long> goalIds, String status, String rejectionReason) {
        if (goalIds == null || goalIds.isEmpty()) {
            return Collections.emptyList();
        }

        boolean isRejected = "Rejected by Reviewer".equalsIgnoreCase(status);
        Map<String, List<PerformanceGoal>> goalsByManager = new HashMap<>();
        Map<String, List<PerformanceGoal>> goalsByEmployee = new HashMap<>();

        List<PerformanceGoal> updatedGoals = new ArrayList<>();

        for (Long id : goalIds) {
            PerformanceGoal goal = goalRepository.findById(id).orElse(null);
            if (goal != null) {
                if ("Complete".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)) {
                    goal.setStatus("Completed");
                    goal.setEndDate(java.sql.Date.valueOf(java.time.LocalDate.now()));
                } else {
                    goal.setStatus(status);
                }

                if (isRejected && rejectionReason != null && !rejectionReason.isEmpty()) {
                    goal.setRejectionReason(rejectionReason);
                } else {
                    goal.setRejectionReason(null);
                }

                PerformanceGoal savedGoal = goalRepository.save(goal);
                updatedGoals.add(savedGoal);

                goalsByManager.computeIfAbsent(savedGoal.getAssignedBy(), k -> new ArrayList<>()).add(savedGoal);
                goalsByEmployee.computeIfAbsent(savedGoal.getEmployeeId(), k -> new ArrayList<>()).add(savedGoal);
            }
        }

        // 🔧 FIX: Handle REJECTION Notification (Fallback if assignedBy missing)
        if (isRejected) {
            goalsByManager.forEach((managerId, goalsList) -> {
                Employee manager = getEmployeeById(managerId);

                // 🔧 Fallback: find manager via employee’s assignedManagerId
                if (manager == null && !goalsList.isEmpty()) {
                    String empId = goalsList.get(0).getEmployeeId();
                    Employee emp = getEmployeeById(empId);
                    if (emp != null && emp.getAssignedManagerId() != null) {
                        manager = getEmployeeById(emp.getAssignedManagerId());
                    }
                }

                if (manager != null && !goalsList.isEmpty()) {
                    String empId = goalsList.get(0).getEmployeeId();
                    Employee employee = getEmployeeById(empId);
                    if (employee != null) {
                        notifyManagerOfRejection(
                                manager,
                                employee.getFirstName() + " " + employee.getLastName(),
                                goalsList,
                                rejectionReason);

                    }
                } else {
                    System.out.println("⚠ DEBUG: Manager not found for rejected goals " + goalsList.stream()
                            .map(PerformanceGoal::getGoalTitle)
                            .collect(Collectors.joining(", ")));
                }
            });
        }

        // APPROVAL Notification
        else if ("Complete".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)) {

            goalsByEmployee.forEach((employeeId, goalsList) -> {
                Employee employee = getEmployeeById(employeeId);
                if (employee != null) {
                    notifyEmployeeOfApproval(employee, goalsList);

                    if (employee.getAssignedHrId() != null) {
                        Employee hr = getEmployeeById(employee.getAssignedHrId());
                        if (hr != null) {
                            notifyHrOfApproval(
                                    hr,
                                    employee.getFirstName() + " " + employee.getLastName(),
                                    goalsList);

                        }
                    }
                }
            });
        }

        // MANAGER APPROVAL Notification (New)
        else if ("Approved".equalsIgnoreCase(status)) {
            goalsByEmployee.forEach((employeeId, goalsList) -> {
                Employee employee = getEmployeeById(employeeId);
                if (employee != null) {
                    notifyEmployeeOfManagerApproval(employee, goalsList);
                    if (employee.getReviewerId() != null) {
                        Employee reviewer = getReviewerById(employee.getReviewerId());
                        if (reviewer != null) {
                            List<String> goalTitles = goalsList.stream()
                                    .map(PerformanceGoal::getGoalTitle)
                                    .collect(Collectors.toList());
                            sendNotificationToReviewer(
                                    reviewer,
                                    employee.getFirstName() + " " + employee.getLastName(),
                                    goalTitles);
                        }
                    }
                }
            });
        }

        return updatedGoals;
    }

    private void notifyManagerOfRejection(Employee manager, String employeeName, List<PerformanceGoal> rejectedGoals,
            String rejectionReason) {
        String goalTitles = rejectedGoals.stream()
                .map(PerformanceGoal::getGoalTitle)
                .collect(Collectors.joining(", "));

        String reasonDetail = (rejectionReason != null && !rejectionReason.isEmpty())
                ? "\nReviewer's Reason: " + rejectionReason
                : "\nNote: The reviewer did not provide a specific reason.";

        String message = String.format(
                "The reviewer has REJECTED the goals for %s. Please Check",
                employeeName,
                goalTitles,
                reasonDetail);

        sendNotificationToEmployee(manager, message, "Action Required: Goals Rejected by Reviewer");
    }

    private void notifyEmployeeOfApproval(Employee employee, List<PerformanceGoal> approvedGoals) {
        String goalTitles = approvedGoals.stream()
                .map(PerformanceGoal::getGoalTitle)
                .collect(Collectors.joining(", "));

        String message = String.format(
                " Your goals have been APPROVED by the reviewer.",
                goalTitles);

        sendNotificationToEmployee(employee, message, "Performance Goals Approved!");
    }

    private void notifyEmployeeOfManagerApproval(Employee employee, List<PerformanceGoal> approvedGoals) {
        String goalTitles = approvedGoals.stream()
                .map(PerformanceGoal::getGoalTitle)
                .collect(Collectors.joining(", "));

        String message = String.format(
                "Your manager has provided feedback and APPROVED your goals: %s. Please check.",
                goalTitles);

        sendNotificationToEmployee(employee, message, "Manager Feedback & Approval Received");
    }

    private void notifyHrOfApproval(Employee hr, String employeeName, List<PerformanceGoal> approvedGoals) {
        String goalTitles = approvedGoals.stream()
                .map(PerformanceGoal::getGoalTitle)
                .collect(Collectors.joining(", "));

        String message = String.format(
                "The goals for  %s have been APPROVED by the reviewer. Please Check",
                employeeName,
                goalTitles);

        sendNotificationToEmployee(hr, message, "Employee Goals Approved (HR Notification)");
    }

    // ----------------- EMPLOYEE LOOKUP AND STATUS -----------------

    public List<Employee> getEmployeesUnderManager(String managerId) {
        return employeeRepository.findByAssignedManagerId(managerId);
    }

    public List<EmployeeGoalStatusDTO> getUniqueEmployeesUnderManager(String managerId) {

        List<EmployeeGoalStatusDTO> allGoals = goalRepository.findEmployeeGoalsByManager(managerId);

        Map<String, EmployeeGoalStatusDTO> uniqueEmployees = new LinkedHashMap<>();

        for (EmployeeGoalStatusDTO goal : allGoals) {
            uniqueEmployees.putIfAbsent(
                    goal.getEmployeeId(),
                    new EmployeeGoalStatusDTO(
                            goal.getEmployeeId(),
                            goal.getEmployeeFirstName(),
                            goal.getEmployeeLastName(),
                            null, // goalTitle not required here
                            null // status not required here
                    ));
        }

        return new ArrayList<>(uniqueEmployees.values());
    }

    public List<Employee> getEmployeesUnderReviewer(String reviewerId) {
        return employeeRepository.findByReviewerId(reviewerId);
    }

    public List<Employee> getEmployeesByHrId(String hrId) {
        return employeeRepository.findByAssignedHrId(hrId);
    }

    public List<Map<String, Object>> getEmployeesWithOverallStatus(String role, String roleId) {
        List<Employee> employees = new ArrayList<>();
        switch (role.toLowerCase()) {
            case "manager":
                employees = employeeRepository.findByAssignedManagerId(roleId);
                break;
            case "hr":
                employees = employeeRepository.findByAssignedHrId(roleId);
                break;
            case "reviewer":
                employees = employeeRepository.findByReviewerId(roleId);
                break;
            default:

                return Collections.emptyList();
        }

        return employees.stream()
                .map(employee -> {
                    Map<String, Object> employeeStatusMap = new HashMap<>();
                    employeeStatusMap.put("employeeId", employee.getEmployeeId());
                    employeeStatusMap.put(
                            "employeeName",
                            employee.getFirstName() + " " + employee.getLastName());

                    employeeStatusMap.put("overallStatus", determineOverallStatus(employee.getEmployeeId()));
                    return employeeStatusMap;
                })
                .collect(Collectors.toList());
    }

    private String determineOverallStatus(String employeeId) {
        List<PerformanceGoal> goals = goalRepository.findByEmployeeId(employeeId);

        // Ignore draft goals
        List<PerformanceGoal> activeGoals = goals.stream()
                .filter(g -> g.getStatus() != null && !"draft".equalsIgnoreCase(g.getStatus()))
                .collect(Collectors.toList());

        if (activeGoals.isEmpty()) {
            return "No Assigned Goals";
        }

        // ✅ Reviewer Approved → COMPLETE
        boolean allCompleted = activeGoals.stream()
                .allMatch(goal -> "Complete".equalsIgnoreCase(goal.getStatus()) || "Completed".equalsIgnoreCase(goal.getStatus()));

        if (allCompleted) {
            return "Completed";
        }

        // ✅ Manager Approved → APPROVED
        boolean hasManagerApproved = activeGoals.stream()
                .anyMatch(goal -> "Approved".equalsIgnoreCase(goal.getStatus()));

        if (hasManagerApproved) {
            return "Approved";
        }

        // 🔄 Still in review cycle
        boolean inReview = activeGoals.stream()
                .anyMatch(goal -> "Submitted".equalsIgnoreCase(goal.getStatus()) ||
                        "Rejected by Reviewer".equalsIgnoreCase(goal.getStatus()));

        if (inReview) {
            return "Review In Progress";
        }

        // 📌 Default fallback
        return "Goals Assigned";
    }

}
