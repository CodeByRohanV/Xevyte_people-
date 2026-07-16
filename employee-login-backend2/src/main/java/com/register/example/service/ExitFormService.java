package com.register.example.service;

import com.register.example.payload.ExitFormDto;
import com.register.example.entity.Employee;
import com.register.example.entity.ExitForm;
import com.register.example.repository.ExitFormRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ExitAnswerRepository;
import com.register.example.entity.ExitAnswer;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

public interface ExitFormService {
    ExitFormDto saveExitForm(ExitFormDto dto);

    List<ExitFormDto> getAllExitForms();

    List<ExitFormDto> getExitFormsByHr(String hrId);

    List<ExitFormDto> getExitFormsByEmployee(String employeeId);

    List<ExitFormDto> getByResignation(Long resignationId);

    ExitFormDto scheduleExitInterview(Long formId, String hrId, String dateIso,
            String interviewer, String meetingLink,
            boolean sendEmail, String employeeId, Long resignationId);

    ExitFormDto submitExitInterviewFeedback(Long formId, ExitFormDto dto);

    ExitFormDto submitExitInterviewFeedback(Long formId, Map<String, Object> answers);

    ExitFormDto getFeedbackFormData(Long formId, String employeeId);
}

@Service
@Transactional
class ExitFormServiceImpl implements ExitFormService {

    private final ExitFormRepository repo;
    private final EmployeeRepository employeeRepo;
    private final EmailService emailService;
    private final EntityManager entityManager;
    private final ResignationNotificationService resignationNotificationService;
    private final ExitAnswerRepository exitAnswerRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExitFormServiceImpl(
            ExitFormRepository repo,
            EmployeeRepository employeeRepo,
            EmailService emailService,
            EntityManager entityManager,
            ResignationNotificationService resignationNotificationService,
            ExitAnswerRepository exitAnswerRepository) {
        this.repo = repo;
        this.employeeRepo = employeeRepo;
        this.emailService = emailService;
        this.entityManager = entityManager;
        this.resignationNotificationService = resignationNotificationService;
        this.exitAnswerRepository = exitAnswerRepository;
    }

    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    // =====================================================================================
    // SAVE EXIT FORM
    // =====================================================================================
    @Override
    public ExitFormDto saveExitForm(ExitFormDto dto) {

        // SAFE employee lookup (no exception from getSingleResult)
        List<Employee> result = entityManager.createQuery(
                "SELECT e FROM Employee e WHERE e.employeeId = :empId", Employee.class)
                .setParameter("empId", dto.getEmployeeId())
                .getResultList();

        if (result.isEmpty()) {
            throw new IllegalArgumentException("Employee not found for ID: " + dto.getEmployeeId());
        }

        Employee employee = result.get(0);

        // Create new ExitForm
        ExitForm form = new ExitForm();
        form.setEmployee(employee);
        form.setAssignedHrId(employee.getAssignedHrId());
        form.setOverallExperienceRating(dto.getOverallExperienceRating());
        form.setReasonForLeavingDetailed(dto.getReasonForLeavingDetailed());
        form.setManagerRelationshipFeedback(dto.getManagerRelationshipFeedback());
        form.setManagerRelationshipRating(dto.getManagerRelationshipRating());
        form.setWorkEnvironmentFeedback(dto.getWorkEnvironmentFeedback());
        form.setWorkEnvironmentRating(dto.getWorkEnvironmentRating());
        form.setSuggestionsForImprovement(dto.getSuggestionsForImprovement());
        form.setRecommendXevyte(dto.getRecommendXevyte());
        form.setAnyOtherComments(dto.getAnyOtherComments());
        form.setResignationId(dto.getResignationId());

        // Default status
        if (form.getExitInterviewStatus() == null) {
            form.setExitInterviewStatus("INITIATED");
        }

        ExitForm saved = repo.save(form);

        return toDto(saved);
    }

    // =====================================================================================
    @Override
    public List<ExitFormDto> getAllExitForms() {
        return repo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    // =====================================================================================
    @Override
    public List<ExitFormDto> getExitFormsByHr(String hrId) {
        return repo.findByAssignedHrId(hrId).stream().map(this::toDto).collect(Collectors.toList());
    }

    // =====================================================================================
    @Override
    public List<ExitFormDto> getExitFormsByEmployee(String employeeId) {
        return repo.findByEmployee_EmployeeId(employeeId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<ExitFormDto> getByResignation(Long resignationId) {
        return repo.findByResignationId(resignationId).stream().map(this::toDto).collect(Collectors.toList());
    }

    // =====================================================================================
    // SCHEDULE EXIT INTERVIEW
    // =====================================================================================
    @Override
    public ExitFormDto scheduleExitInterview(
            Long formId,
            String hrId,
            String dateIso,
            String interviewer,
            String meetingLink,
            boolean sendEmail,
            String employeeId,
            Long resignationId) {

        ExitForm form = null;

        if (formId != null && formId > 0) {
            form = repo.findById(formId).orElse(null);
        } else if (resignationId != null) {
            form = repo.findByResignationId(resignationId).stream().findFirst().orElse(null);
        }

        if (form == null) {
            Optional<Employee> empOpt = Optional.empty();

            if (employeeId != null && !employeeId.isBlank()) {
                empOpt = employeeRepo.findByEmployeeId(employeeId);
            }

            if (empOpt.isEmpty() && hrId != null && !hrId.isBlank()) {
                empOpt = employeeRepo.findByAssignedHrId(hrId).stream().findFirst();
            }

            if (empOpt.isEmpty()) {
                throw new IllegalArgumentException("Cannot auto-create ExitForm. Employee not found.");
            }

            Employee emp = empOpt.get();

            form = new ExitForm();
            form.setEmployee(emp);
            form.setResignationId(resignationId);
            form.setAssignedHrId(emp.getAssignedHrId());
            form.setExitInterviewStatus("INITIATED");
            form.setOverallExperienceRating(0);
            form.setManagerRelationshipRating(0);
            form.setWorkEnvironmentRating(0);
            form.setRecommendXevyte("N/A");

            repo.save(form);
        }

        String dateToStore = (dateIso == null || dateIso.isBlank())
                ? LocalDateTime.now().plusDays(2).toString()
                : dateIso;

        form.setExitInterviewStatus("SCHEDULED");
        form.setExitInterviewDate(dateToStore);
        form.setInterviewer(
                interviewer == null || interviewer.isBlank() ? "HR Representative" : interviewer);
        form.setHrScheduledBy(hrId);
        form.setExitInterviewMeetingLink(meetingLink);

        ExitForm updated = repo.save(form);

        if (sendEmail) {
            try {
                Employee emp = updated.getEmployee();
                String token = Base64.getEncoder()
                        .encodeToString((updated.getId() + ":" + emp.getEmployeeId()).getBytes());
                String tenantUrl = emailService.getTenantFrontendUrl(emp.getTenantId());
                String link = tenantUrl + "/employee/feedback/form?token=" + token;

                String body = "Dear " + emp.getFirstName() + " " + emp.getLastName() + ",\n\n"

                        + "Your exit interview has been scheduled.\n"
                        + "Date: " + formatDate(dateToStore) + "\n"
                        + "Interviewer: " + form.getInterviewer() + "\n"
                        + "Meeting Link: " + meetingLink + "\n\n"
                        + "Please fill out the exit interview feedback form using the link below:\n"
                        + link + "\n\n"
                        + "Thanks & Regards,\n"
                        + "HR Team";

                emailService.sendEmail(emp.getEmail(), "Exit Interview Scheduled", body);
            } catch (Exception ignored) {
            }

            // --- ADD IN-APP NOTIFICATION ---
            try {
                String notifMsg = String.format(
                        "An exit interview has been scheduled for %s. Please check your email for details.",
                        formatDate(dateToStore));
                resignationNotificationService.createNotification(updated.getEmployee().getEmployeeId(), "EMPLOYEE",
                        updated.getResignationId(), notifMsg);
            } catch (Exception e) {
                System.err.println("Failed to send in-app notification to employee: " + e.getMessage());
            }
        }

        return toDto(updated);
    }

    // =====================================================================================
    // SUBMIT FEEDBACK DTO VERSION
    // =====================================================================================
    @Override
    public ExitFormDto submitExitInterviewFeedback(Long formId, ExitFormDto dto) {

        ExitForm form = repo.findById(formId)
                .orElseThrow(() -> new IllegalArgumentException("ExitForm not found"));

        if ("COMPLETED".equalsIgnoreCase(form.getExitInterviewStatus())) {
            throw new IllegalStateException("Feedback already submitted.");
        }

        if (dto.getAnswers() != null) {
            form.setFeedbackAnswersJson(toNormalizedJson(dto.getAnswers()));
            
            // Store individual answers in exit_answers table
            String empId = form.getEmployee().getEmployeeId();
            dto.getAnswers().forEach((qIdStr, ansVal) -> {
                try {
                    Long qId = Long.parseLong(qIdStr);
                    ExitAnswer exitAnswer = new ExitAnswer();
                    exitAnswer.setFormId(formId);
                    exitAnswer.setQuestionId(qId);
                    exitAnswer.setEmployeeId(empId);
                    exitAnswer.setAnswer(String.valueOf(ansVal));
                    exitAnswerRepository.save(exitAnswer);
                } catch (NumberFormatException e) {
                    // Ignore invalid keys
                }
            });
        }

        applyLegacyFields(form, dto);

        form.setExitInterviewStatus("COMPLETED");
        form.setExitInterviewSubmissionDate(LocalDateTime.now());

        ExitForm saved = repo.save(form);
        notifyHrAboutFeedback(saved);
        return toDto(saved);
    }

    // =====================================================================================
    // SUBMIT FEEDBACK MAP VERSION NOW NORMALIZED
    // =====================================================================================
    @Override
    public ExitFormDto submitExitInterviewFeedback(Long formId, Map<String, Object> answers) {

        ExitForm form = repo.findById(formId)
                .orElseThrow(() -> new IllegalArgumentException("ExitForm not found"));

        if ("COMPLETED".equalsIgnoreCase(form.getExitInterviewStatus())) {
            throw new IllegalStateException("FEEDBACK_ALREADY_SUBMITTED");
        }

        form.setFeedbackAnswersJson(toNormalizedJson(answers));
        
        // Store individual answers in exit_answers table
        if (answers != null) {
            String empId = form.getEmployee().getEmployeeId();
            answers.forEach((qIdStr, ansVal) -> {
                try {
                    Long qId = Long.parseLong(qIdStr);
                    ExitAnswer exitAnswer = new ExitAnswer();
                    exitAnswer.setFormId(formId);
                    exitAnswer.setQuestionId(qId);
                    exitAnswer.setEmployeeId(empId);
                    exitAnswer.setAnswer(String.valueOf(ansVal));
                    exitAnswerRepository.save(exitAnswer);
                } catch (NumberFormatException e) {
                    // Ignore invalid keys
                }
            });
        }
        form.setExitInterviewStatus("COMPLETED");
        form.setExitInterviewSubmissionDate(LocalDateTime.now());

        ExitForm saved = repo.save(form);
        notifyHrAboutFeedback(saved);
        return toDto(saved);
    }

    // =====================================================================================
    // GET FEEDBACK FORM DATA
    // =====================================================================================
    @Override
    public ExitFormDto getFeedbackFormData(Long formId, String employeeId) {

        ExitForm form = repo.findById(formId)
                .orElseThrow(() -> new IllegalArgumentException("ExitForm not found"));

        if (!form.getEmployee().getEmployeeId().equalsIgnoreCase(employeeId)) {
            throw new IllegalArgumentException("Invalid employee for this form");
        }

        // ❌ REMOVE THIS BLOCK
        // HR MUST be able to VIEW completed feedback

        return toDto(form);

    }

    // =====================================================================================
    // HELPERS
    // =====================================================================================

    private void applyLegacyFields(ExitForm form, ExitFormDto dto) {
        if (dto.getOverallExperienceRating() != null)
            form.setOverallExperienceRating(dto.getOverallExperienceRating());
        if (dto.getReasonForLeavingDetailed() != null)
            form.setReasonForLeavingDetailed(dto.getReasonForLeavingDetailed());
        if (dto.getManagerRelationshipFeedback() != null)
            form.setManagerRelationshipFeedback(dto.getManagerRelationshipFeedback());
        if (dto.getManagerRelationshipRating() != null)
            form.setManagerRelationshipRating(dto.getManagerRelationshipRating());
        if (dto.getWorkEnvironmentFeedback() != null)
            form.setWorkEnvironmentFeedback(dto.getWorkEnvironmentFeedback());
        if (dto.getWorkEnvironmentRating() != null)
            form.setWorkEnvironmentRating(dto.getWorkEnvironmentRating());
        if (dto.getSuggestionsForImprovement() != null)
            form.setSuggestionsForImprovement(dto.getSuggestionsForImprovement());
        if (dto.getRecommendXevyte() != null)
            form.setRecommendXevyte(dto.getRecommendXevyte());
        if (dto.getAnyOtherComments() != null)
            form.setAnyOtherComments(dto.getAnyOtherComments());
    }

    // Normalizes answer keys to Strings ALWAYS
    private String toNormalizedJson(Map<String, Object> answers) {
        try {
            Map<String, Object> normalized = new HashMap<>();
            answers.forEach((k, v) -> normalized.put(String.valueOf(k), v));
            return objectMapper.writeValueAsString(normalized);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize answers", e);
        }
    }

    private ExitFormDto toDto(ExitForm e) {
        ExitFormDto dto = new ExitFormDto();

        dto.setId(e.getId());
        dto.setEmployeeId(e.getEmployee().getEmployeeId());
        dto.setAssignedHrId(e.getAssignedHrId());
        dto.setOverallExperienceRating(e.getOverallExperienceRating());
        dto.setReasonForLeavingDetailed(e.getReasonForLeavingDetailed());
        dto.setManagerRelationshipFeedback(e.getManagerRelationshipFeedback());
        dto.setManagerRelationshipRating(e.getManagerRelationshipRating());
        dto.setWorkEnvironmentFeedback(e.getWorkEnvironmentFeedback());
        dto.setWorkEnvironmentRating(e.getWorkEnvironmentRating());
        dto.setSuggestionsForImprovement(e.getSuggestionsForImprovement());
        dto.setRecommendXevyte(e.getRecommendXevyte());
        dto.setAnyOtherComments(e.getAnyOtherComments());
        dto.setExitInterviewStatus(e.getExitInterviewStatus());
        dto.setExitInterviewMeetingLink(e.getExitInterviewMeetingLink());
        dto.setInterviewer(e.getInterviewer());
        dto.setExitInterviewDate(formatDate(e.getExitInterviewDate()));
        dto.setResignationId(e.getResignationId());

        if (e.getFeedbackAnswersJson() != null && !e.getFeedbackAnswersJson().isBlank()) {
            try {
                Map<String, Object> parsed = objectMapper.readValue(
                        e.getFeedbackAnswersJson(), Map.class);

                // normalize keys again, guarantee string keys
                Map<String, Object> normalized = new HashMap<>();
                parsed.forEach((k, v) -> normalized.put(String.valueOf(k), v));

                dto.setAnswers(normalized);
            } catch (Exception ignored) {
            }
        }

        return dto;
    }

    private void notifyHrAboutFeedback(ExitForm form) {
        String hrId = form.getAssignedHrId();
        if (hrId == null || hrId.isBlank()) {
            return;
        }

        Optional<Employee> hrOpt = employeeRepo.findByEmployeeId(hrId);
        if (hrOpt.isPresent()) {
            Employee hr = hrOpt.get();
            Employee emp = form.getEmployee();
            String subject = "Exit Interview Feedback Submitted - " + emp.getFirstName() + " " + emp.getLastName();
            String body = "Dear " + hr.getFirstName() + " " + hr.getLastName() + ",\n\n"
                    + "The employee " + emp.getFirstName() + " " + emp.getLastName() + " (" + emp.getEmployeeId() + ") "
                    + "has submitted their exit interview feedback form.\n\n"
                    + "You can now view this feedback in the Exit Management module.\n\n"
                    + "Thanks & Regards,\n"
                    + "HR Portal";

            try {
                emailService.sendEmail(hr.getEmail(), subject, body);
            } catch (Exception e) {
                // Log and ignore to prevent failure of the main transaction
                System.err.println("Failed to send HR notification email: " + e.getMessage());
            }

            // --- ADD IN-APP NOTIFICATION ---
            try {
                String notifMsg = String.format("Employee %s %s has submitted their exit feedback form.",
                        emp.getFirstName(), emp.getLastName());
                resignationNotificationService.createNotification(hr.getEmployeeId(), "HR", form.getResignationId(),
                        notifMsg);
            } catch (Exception e) {
                System.err.println("Failed to send in-app notification to HR: " + e.getMessage());
            }
        }
    }

    private String formatDate(String isoStr) {
        try {
            LocalDateTime dt = LocalDateTime.parse(isoStr);
            return dt.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e) {
            return isoStr;
        }
    }
}
