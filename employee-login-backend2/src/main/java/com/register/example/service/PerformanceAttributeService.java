package com.register.example.service;

import com.register.example.entity.PerformanceAttribute;
import com.register.example.entity.Employee;
import com.register.example.entity.Notification;
import com.register.example.payload.EmployeeAttributeStatusDTO;
import com.register.example.repository.PerformanceAttributeRepository;
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
public class PerformanceAttributeService {

    private final PerformanceAttributeRepository attributeRepository;
    private final EmployeeRepository employeeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    public PerformanceAttributeService(PerformanceAttributeRepository attributeRepository,
            EmployeeRepository employeeRepository) {
        this.attributeRepository = attributeRepository;
        this.employeeRepository = employeeRepository;
    }

    // ----------------- CORE ASSIGNMENT METHODS -----------------

    public PerformanceAttribute assignAttribute(PerformanceAttribute attribute) {
        attribute.setStatus("Pending");
        PerformanceAttribute savedAttribute = attributeRepository.save(attribute);

        Employee employee = getEmployeeById(savedAttribute.getEmployeeId());
        if (employee != null) {
            String message = String.format(
                    "You have been assigned a new performance attribute: \"%s\" by your manager.",
                    savedAttribute.getAttributeTitle());
            sendNotificationToEmployee(employee, message, "New Attribute Assigned");
        }

        return savedAttribute;
    }

    public List<PerformanceAttribute> assignAttributesBatch(List<PerformanceAttribute> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return Collections.emptyList();
        }

        List<PerformanceAttribute> savedAttributes = attributes.stream()
                .map(attribute -> {
                    if (attribute.getStatus() == null || attribute.getStatus().isEmpty()) {
                        attribute.setStatus("Pending");
                    }
                    return attributeRepository.save(attribute);
                })
                .collect(Collectors.toList());

        String employeeId = savedAttributes.get(0).getEmployeeId();
        Employee employee = getEmployeeById(employeeId);

        if (employee != null) {
            sendNotificationForBatchAssignment(employee, savedAttributes);
        }

        return savedAttributes;
    }

    private void sendNotificationForBatchAssignment(Employee emp, List<PerformanceAttribute> attributes) {
        if (attributes.isEmpty())
            return;

        String message = "Your manager has assigned you new attributes, Please Check.";
        sendNotificationToEmployee(emp, message, "New Attributes Assigned");
    }

    // ----------------- NOTIFICATION AND UTILITY -----------------

    private void sendNotificationToEmployee(Employee emp, String message, String emailSubject) {
        if (emp == null)
            return;

        Notification notification = new Notification();
        notification.setEmployeeId(emp.getEmployeeId());
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);
        notificationRepository.save(notification);

        emailService.sendEmail(emp.getEmail(), emailSubject, message);
    }

    private Employee getEmployeeById(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId).orElse(null);
    }

    private Employee getReviewerById(String reviewerId) {
        return employeeRepository.findByEmployeeId(reviewerId).orElse(null);
    }

    // ----------------- ATTRIBUTE RETRIEVAL & MANAGEMENT -----------------

    public List<PerformanceAttribute> getAttributesByEmployee(String employeeId) {
        return attributeRepository.findByEmployeeId(employeeId);
    }

    public List<PerformanceAttribute> getRejectedAttributesByManager(String managerId) {
        return attributeRepository.findByAssignedByAndStatus(managerId, "Rejected");
    }

    public PerformanceAttribute reassignAttribute(Long attributeId, PerformanceAttribute updatedAttribute) {
        PerformanceAttribute existingAttribute = attributeRepository.findById(attributeId).orElse(null);
        if (existingAttribute != null) {
            String originalEmployeeId = existingAttribute.getEmployeeId();

            existingAttribute.setAttributeTitle(updatedAttribute.getAttributeTitle());
            existingAttribute.setAttributeDescription(updatedAttribute.getAttributeDescription());
            existingAttribute.setMetric(updatedAttribute.getMetric());
            existingAttribute.setTarget(updatedAttribute.getTarget());
            existingAttribute.setEmployeeId(updatedAttribute.getEmployeeId());

            if (updatedAttribute.getStatus() != null && !updatedAttribute.getStatus().isEmpty()) {
                existingAttribute.setStatus(updatedAttribute.getStatus());
            } else {
                existingAttribute.setStatus("Pending");
            }

            if (!"Rejected".equalsIgnoreCase(existingAttribute.getStatus())) {
                existingAttribute.setRejectionReason(null);
            }

            PerformanceAttribute savedAttribute = attributeRepository.save(existingAttribute);

            Employee employee = getEmployeeById(savedAttribute.getEmployeeId());
            if (employee != null) {
                String message = "Your attribute has been re-assigned to you by your manager. Please review and accept/reject it.";
                sendNotificationToEmployee(employee, message, "Attribute re-assigned by Manager");
            }

            return savedAttribute;
        }
        return null;
    }

    public List<PerformanceAttribute> getSubmittedAttributesByManager(String managerId) {
        return attributeRepository.findByAssignedByAndStatus(managerId, "Submitted");
    }

    public List<PerformanceAttribute> getAttributesForEmployeeUnderManager(String managerId, String employeeId) {
        List<PerformanceAttribute> allAttributes = attributeRepository.findByEmployeeId(employeeId);
        return allAttributes.stream()
                .filter(attr -> managerId.equals(attr.getAssignedBy()))
                .collect(Collectors.toList());
    }

    public List<PerformanceAttribute> getAttributesByManager(String managerId) {
        return attributeRepository.findByAssignedBy(managerId);
    }

    // ----------------- EMPLOYEE ACCEPTS OR REJECTS ATTRIBUTE -----------------

    public PerformanceAttribute updateAttributeStatus(Long attributeId, String status) {
        PerformanceAttribute attribute = attributeRepository.findById(attributeId).orElse(null);
        if (attribute != null) {
            attribute.setStatus(status);
            PerformanceAttribute savedAttribute = attributeRepository.save(attribute);
            if ("In Progress".equalsIgnoreCase(status)) {
                notifyManagerOfAttributeAcceptance(savedAttribute);
            }
            return savedAttribute;
        }
        return null;
    }

    public PerformanceAttribute updateAttributeStatusAndFeedback(Long attributeId, String status, String feedback) {
        PerformanceAttribute attribute = attributeRepository.findById(attributeId).orElse(null);

        if (attribute != null) {
            attribute.setStatus(status);
            attribute.setRejectionReason(feedback);
            PerformanceAttribute updatedAttribute = attributeRepository.save(attribute);

            if ("Rejected".equalsIgnoreCase(status)) {
                notifyManagerOfAttributeRejection(attribute, feedback);
            } else if ("In Progress".equalsIgnoreCase(status)) {
                notifyManagerOfAttributeAcceptance(updatedAttribute);
            }

            return updatedAttribute;
        }
        return null;
    }

    private void populateEmployeeNames(List<PerformanceAttribute> attributes) {
        for (PerformanceAttribute attribute : attributes) {
            employeeRepository.findByEmployeeId(attribute.getEmployeeId())
                    .ifPresent(emp -> attribute.setEmployeeName(emp.getFirstName() + " " + emp.getLastName()));
        }
    }

    public List<PerformanceAttribute> getFilteredAttributes(String employeeId, String attributeTitle, String status,
            java.util.Date startDate, java.util.Date endDate) {
        List<PerformanceAttribute> attributes = attributeRepository
                .findAll((Specification<PerformanceAttribute>) (root, query, criteriaBuilder) -> {
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
                    if (attributeTitle != null && !attributeTitle.trim().isEmpty()) {
                        predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("attributeTitle")),
                                "%" + attributeTitle.toLowerCase() + "%"));
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

        populateEmployeeNames(attributes);
        return attributes;
    }

    // ----------------- INTERNAL NOTIFICATION HELPERS -----------------

    private void notifyManagerOfAttributeRejection(PerformanceAttribute attribute, String feedback) {
        String managerId = attribute.getAssignedBy();
        String employeeId = attribute.getEmployeeId();

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
                    " %s has rejected the attribute. Reason: %s",
                    employee.getFirstName() + " " + employee.getLastName(),
                    (feedback != null && !feedback.isEmpty()) ? feedback : "No reason provided");
            sendNotificationToEmployee(manager, message, "Attribute Rejected");
        }
    }

    private void notifyManagerOfAttributeAcceptance(PerformanceAttribute attribute) {
        String managerId = attribute.getAssignedBy();
        String employeeId = attribute.getEmployeeId();

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
                    " %s has accepted the attribute: \"%s\".",
                    employee.getFirstName() + " " + employee.getLastName(),
                    attribute.getAttributeTitle());
            sendNotificationToEmployee(manager, message, "Attribute Accepted");
        }
    }

    public List<PerformanceAttribute> updateAttributesStatus(List<Long> attributeIds, String status) {
        List<PerformanceAttribute> updatedAttributes = new ArrayList<>();
        for (Long id : attributeIds) {
            PerformanceAttribute attribute = attributeRepository.findById(id).orElse(null);
            if (attribute != null) {
                attribute.setStatus(status);
                updatedAttributes.add(attributeRepository.save(attribute));
            }
        }
        return updatedAttributes;
    }

    // ----------------- EMPLOYEE SELF-ASSESSMENT SUBMISSION -----------------

    public List<PerformanceAttribute> submitBulkSelfAssessmentAndNotifyManager(
            List<EmployeeAttributeStatusDTO> assessments) {

        if (assessments == null || assessments.isEmpty()) {
            return Collections.emptyList();
        }

        List<PerformanceAttribute> updatedAttributes = new ArrayList<>();
        String employeeId = null;
        String managerId = null;
        List<String> submittedAttributeTitles = new ArrayList<>();

        for (EmployeeAttributeStatusDTO assessment : assessments) {
            PerformanceAttribute attribute = attributeRepository.findById(assessment.getAttributeId()).orElse(null);

            if (attribute != null) {
                if (employeeId == null) {
                    employeeId = attribute.getEmployeeId();
                    managerId = attribute.getAssignedBy();
                    if (managerId == null || managerId.isEmpty()) {
                        Employee emp = getEmployeeById(employeeId);
                        if (emp != null) {
                            managerId = emp.getAssignedManagerId();
                        }
                    }
                }

                if (assessment.getStatus() != null) {
                    attribute.setStatus(assessment.getStatus());
                }
                if (assessment.getSelfAssessment() != null) {
                    attribute.setSelfAssessment(assessment.getSelfAssessment());
                }
                if (assessment.getRating() != null) {
                    attribute.setRating(assessment.getRating());
                }

                attribute.setManagerRating(null);
                attribute.setManagerComments(null);

                PerformanceAttribute savedAttribute = attributeRepository.save(attribute);
                updatedAttributes.add(savedAttribute);
                if ("submitted".equalsIgnoreCase(savedAttribute.getStatus())) {
                    submittedAttributeTitles.add(savedAttribute.getAttributeTitle());
                }
            }
        }

        if (employeeId != null && managerId != null && !submittedAttributeTitles.isEmpty()) {
            notifyManagerOfEmployeeSelfAssessment(managerId, employeeId);
        }

        return updatedAttributes;
    }

    private void notifyManagerOfEmployeeSelfAssessment(String managerId, String employeeId) {
        Employee manager = getEmployeeById(managerId);
        Employee employee = getEmployeeById(employeeId);

        if (employee != null && manager != null) {
            String message = String.format(
                    " %s has submitted self-assessment for the assigned attributes. Please review and provide your feedback.",
                    employee.getFirstName() + " " + employee.getLastName());

            sendNotificationToEmployee(manager, message, "Employee Attribute Self-Assessments Submitted");
        }
    }

    // ----------------- MANAGER FEEDBACK -----------------

    public List<PerformanceAttribute> submitBulkManagerFeedback(List<EmployeeAttributeStatusDTO> feedbackList) {
        if (feedbackList == null || feedbackList.isEmpty()) {
            return Collections.emptyList();
        }

        List<PerformanceAttribute> updatedAttributes = new ArrayList<>();

        for (EmployeeAttributeStatusDTO feedback : feedbackList) {
            PerformanceAttribute attribute = attributeRepository.findById(feedback.getAttributeId()).orElse(null);
            if (attribute != null) {
                if (feedback.getManagerComments() != null) {
                    attribute.setManagerComments(feedback.getManagerComments());
                }
                if (feedback.getManagerRating() != null) {
                    attribute.setManagerRating(feedback.getManagerRating());
                }

                PerformanceAttribute savedAttribute = attributeRepository.save(attribute);
                updatedAttributes.add(savedAttribute);
            }
        }

        return updatedAttributes;
    }

    // ----------------- REVIEWER ACTION -----------------

    public List<PerformanceAttribute> reviewAttributesBulk(List<Long> attributeIds, String status,
            String rejectionReason) {
        if (attributeIds == null || attributeIds.isEmpty()) {
            return Collections.emptyList();
        }

        boolean isRejected = "Rejected by Reviewer".equalsIgnoreCase(status);
        Map<String, List<PerformanceAttribute>> attributesByManager = new HashMap<>();
        Map<String, List<PerformanceAttribute>> attributesByEmployee = new HashMap<>();

        List<PerformanceAttribute> updatedAttributes = new ArrayList<>();

        for (Long id : attributeIds) {
            PerformanceAttribute attribute = attributeRepository.findById(id).orElse(null);
            if (attribute != null) {
                if ("Complete".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)) {
                    attribute.setStatus("Completed");
                    attribute.setEndDate(java.sql.Date.valueOf(java.time.LocalDate.now()));
                } else {
                    attribute.setStatus(status);
                }

                if (isRejected && rejectionReason != null && !rejectionReason.isEmpty()) {
                    attribute.setRejectionReason(rejectionReason);
                } else {
                    attribute.setRejectionReason(null);
                }

                PerformanceAttribute savedAttribute = attributeRepository.save(attribute);
                updatedAttributes.add(savedAttribute);

                attributesByManager.computeIfAbsent(savedAttribute.getAssignedBy(), k -> new ArrayList<>())
                        .add(savedAttribute);
                attributesByEmployee.computeIfAbsent(savedAttribute.getEmployeeId(), k -> new ArrayList<>())
                        .add(savedAttribute);
            }
        }

        if (isRejected) {
            attributesByManager.forEach((managerId, attributesList) -> {
                Employee manager = getEmployeeById(managerId);

                if (manager == null && !attributesList.isEmpty()) {
                    String empId = attributesList.get(0).getEmployeeId();
                    Employee emp = getEmployeeById(empId);
                    if (emp != null && emp.getAssignedManagerId() != null) {
                        manager = getEmployeeById(emp.getAssignedManagerId());
                    }
                }

                if (manager != null && !attributesList.isEmpty()) {
                    String empId = attributesList.get(0).getEmployeeId();
                    Employee employee = getEmployeeById(empId);
                    if (employee != null) {
                        String message = String.format(
                                "The reviewer has REJECTED the attributes for %s. Please Check",
                                employee.getFirstName() + " " + employee.getLastName());
                        sendNotificationToEmployee(manager, message,
                                "Action Required: Attributes Rejected by Reviewer");
                    }
                }
            });
        } else if ("Complete".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)) {
            attributesByEmployee.forEach((employeeId, attributesList) -> {
                Employee employee = getEmployeeById(employeeId);
                if (employee != null) {
                    String message = "Your attributes have been APPROVED by the reviewer.";
                    sendNotificationToEmployee(employee, message, "Performance Attributes Approved!");

                    if (employee.getAssignedHrId() != null) {
                        Employee hr = getEmployeeById(employee.getAssignedHrId());
                        if (hr != null) {
                            String hrMessage = String.format(
                                    "The attributes for %s have been APPROVED by the reviewer. Please Check",
                                    employee.getFirstName() + " " + employee.getLastName());
                            sendNotificationToEmployee(hr, hrMessage,
                                    "Employee Attributes Approved (HR Notification)");
                        }
                    }
                }
            });
        } else if ("Approved".equalsIgnoreCase(status)) {
            attributesByEmployee.forEach((employeeId, attributesList) -> {
                Employee employee = getEmployeeById(employeeId);
                if (employee != null) {
                    String message = "Your manager has provided feedback and APPROVED your attributes. Please check.";
                    sendNotificationToEmployee(employee, message, "Manager Feedback & Approval Received");
                    if (employee.getReviewerId() != null) {
                        Employee reviewer = getReviewerById(employee.getReviewerId());
                        if (reviewer != null) {
                            List<String> attributeTitles = attributesList.stream()
                                    .map(PerformanceAttribute::getAttributeTitle)
                                    .collect(Collectors.toList());
                            sendNotificationToReviewer(
                                    reviewer,
                                    employee.getFirstName() + " " + employee.getLastName(),
                                    attributeTitles);
                        }
                    }
                }
            });
        }

        return updatedAttributes;
    }

    private void sendNotificationToReviewer(Employee reviewer, String employeeName, List<String> attributeTitles) {
        String attributeTitlesStr = String.join(", ", attributeTitles);

        String message = String.format(
                "Manager has submitted feedback for %s's attributes.",
                employeeName,
                attributeTitlesStr);

        sendNotificationToEmployee(reviewer, message, "Manager Feedback Submitted for Attributes");
    }

    // ----------------- EMPLOYEE LOOKUP -----------------

    public List<Employee> getEmployeesUnderManager(String managerId) {
        return employeeRepository.findByAssignedManagerId(managerId);
    }

    public List<Employee> getEmployeesUnderReviewer(String reviewerId) {
        return employeeRepository.findByReviewerId(reviewerId);
    }

    public List<Employee> getEmployeesByHrId(String hrId) {
        return employeeRepository.findByAssignedHrId(hrId);
    }
}
