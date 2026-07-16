package com.register.example.service;

import com.register.example.repository.ExitReasonRepository;
import com.register.example.entity.ExitQuestion;
import com.register.example.repository.ExitQuestionRepository;
import java.util.Map;
import java.util.HashMap;

// import com.register.example.entity.Clearance; // Commented out as Clearance is disabled
import com.register.example.entity.Employee;
import com.register.example.entity.Resignation;
import com.register.example.entity.Delegation;
// import com.register.example.payload.ClearanceDto; // Commented out as Clearance is disabled
import com.register.example.payload.ResignationDto;
// import com.register.example.repository.ClearanceRepository; // Commented out as Clearance is disabled
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ResignationRepository;
import com.register.example.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import com.register.example.entity.ExitReason;
import com.register.example.entity.NoticePeriod;
import com.register.example.repository.NoticePeriodRepository;
import com.register.example.repository.ClearanceChecklistRepository;
import java.time.DayOfWeek;
import com.register.example.entity.Holiday;
import com.register.example.repository.AllocationRepository;
import com.register.example.entity.Allocation;
import com.register.example.repository.DelegationRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ResignationService {

	private final ResignationRepository resignationRepository;
	// private final ClearanceRepository clearanceRepository; // Commented out as
	// Clearance is disabled
	private final EmailService emailService;
	private final EmployeeRepository employeeRepository;
	private final ResignationNotificationService resignationNotificationService;
	private final ExitFormService exitFormService;

	private final ExitReasonRepository exitReasonRepository;

	private final ClearanceChecklistRepository clearanceChecklistRepository;
	private static final DateTimeFormatter DD_MM_YYYY = DateTimeFormatter.ofPattern("dd-MM-yyyy");

	private final AllocationRepository allocationRepository;
	private final NoticePeriodRepository noticePeriodRepository;

	@Autowired
	private TenantRepository tenantRepository;

	@Autowired
	private ExitQuestionRepository exitQuestionRepository;

	@Autowired
	private HolidayService holidayService; // ⭐ Inject your existing HolidayService

	@Autowired
	private com.register.example.service.DelegationService delegationService;

	@Autowired
	private DelegationRepository delegationRepository;

	@Autowired
	private AuditService auditService;

	@jakarta.persistence.PersistenceContext
	private jakarta.persistence.EntityManager entityManager;

	@org.springframework.transaction.annotation.Transactional
	@org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
	public void dropExitReasonUniqueConstraint() {
		try {
			// Find unique constraints/indexes on exit_reasons for column reason
			List<String> indexNames = entityManager.createNativeQuery(
				"SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS " +
				"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exit_reasons' " +
				"AND COLUMN_NAME = 'reason' AND NON_UNIQUE = 0"
			).getResultList();

			for (String indexName : indexNames) {
				if (!"PRIMARY".equalsIgnoreCase(indexName)) {
					entityManager.createNativeQuery("ALTER TABLE exit_reasons DROP INDEX " + indexName).executeUpdate();
					System.out.println("Successfully dropped unique index: " + indexName + " on exit_reasons");
				}
			}
		} catch (Exception e) {
			System.err.println("Note: Could not drop exit_reasons unique constraint automatically: " + e.getMessage());
		}
	}

	private boolean isNonWorkingDay(LocalDate date, List<LocalDate> holidays) {
		DayOfWeek day = date.getDayOfWeek();
		return day.equals(DayOfWeek.SATURDAY)
				|| day.equals(DayOfWeek.SUNDAY)
				|| holidays.contains(date);
	}

	@Autowired
	public ResignationService(
			ResignationRepository resignationRepository,
			// ClearanceRepository clearanceRepository, // Commented out as Clearance is
			// disabled
			EmailService emailService,
			EmployeeRepository employeeRepository,
			ResignationNotificationService resignationNotificationService,
			ExitFormService exitFormService,
			ExitReasonRepository exitReasonRepository,
			NoticePeriodRepository noticePeriodRepository,
			ExitQuestionRepository exitQuestionRepository,
			ClearanceChecklistRepository clearanceChecklistRepository,
			AllocationRepository allocationRepository) {
		this.resignationRepository = resignationRepository;
		// this.clearanceRepository = clearanceRepository; // Commented out as Clearance
		// is disabled
		this.emailService = emailService;
		this.employeeRepository = employeeRepository;
		this.resignationNotificationService = resignationNotificationService;
		this.exitFormService = exitFormService;
		this.exitReasonRepository = exitReasonRepository;
		this.noticePeriodRepository = noticePeriodRepository;
		this.exitQuestionRepository = exitQuestionRepository;
		this.clearanceChecklistRepository = clearanceChecklistRepository; // ⭐ NEW
		this.allocationRepository = allocationRepository;
	}

	// -------------------- Helper --------------------
	private void validateAndSetResignationFields(ResignationDto dto, Resignation resignation, String status,
			String employeeId) {
		String lwdString = dto.getLastWorkingDay() != null ? dto.getLastWorkingDay().trim() : "";
		String reasonString = dto.getReasonForExit() != null ? dto.getReasonForExit().trim() : "";

		if (!"Draft".equalsIgnoreCase(status)) {
			if (lwdString.isEmpty())
				throw new IllegalArgumentException("Last Working Day is required.");
			if (reasonString.isEmpty())
				throw new IllegalArgumentException("Reason for Exit is required.");
		}

		if (!lwdString.isEmpty()) {
			LocalDate lwd = null;
			try {
				lwd = LocalDate.parse(lwdString, DD_MM_YYYY);
			} catch (DateTimeParseException e) {
				try {
					lwd = LocalDate.parse(lwdString); // Fallback to ISO (YYYY-MM-DD)
				} catch (DateTimeParseException ex) {
					throw new IllegalArgumentException(
							"Invalid date format for Last Working Day. Expected dd-MM-yyyy or YYYY-MM-DD");
				}
			}

			if (lwd != null) {
				Employee employee = employeeRepository.findByEmployeeId(employeeId)
						.orElseThrow(() -> new RuntimeException("Employee not found"));

				// AUTO ADJUST LWD BASED ON WEEKENDS + HOLIDAYS FOR LOCATION
				LocalDate adjusted = adjustLwd(employee, lwd);
				resignation.setLastWorkingDay(adjusted);
			}
		}

		resignation.setReasonForExit(dto.getReasonForExit());
		resignation.setComments(dto.getComments());
		resignation.setDocumentName(dto.getDocumentName());

		if (dto.getBase64Document() != null && !dto.getBase64Document().isEmpty()) {
			resignation.setDocument(Base64.getDecoder().decode(dto.getBase64Document()));
		} else if (dto.getDocumentName() == null || dto.getDocumentName().equals("No file uploaded")) {
			resignation.setDocument(null);
			resignation.setDocumentName("No file uploaded");
		}
	}

	/**
	 * Handles notifications for all status changes (Approval, Clearance, and
	 * Rejection).
	 */
	public void sendNotificationForNextStep(Resignation resignation) {
		String status = resignation.getStatus();
		Employee employee = employeeRepository.findByEmployeeId(resignation.getEmployeeId()).orElse(null);
		String employeeName = (employee != null)
				? employee.getFirstName() + " " + employee.getLastName()
				: "Employee";

		String employeeId = resignation.getEmployeeId();

		// -------------------- 🛑 REJECTION NOTIFICATIONS --------------------
		// -------------------- 🛑 REJECTION NOTIFICATIONS --------------------
		if (status.startsWith("Rejected")) {
			if (employee != null) {

				String rejecterRole = status.substring("Rejected by ".length());
				String comment = "No specific comments provided.";

				switch (rejecterRole) {
					case "Manager":
						comment = resignation.getManagerComment() != null ? resignation.getManagerComment() : comment;
						break;
					case "Reviewer":
						comment = resignation.getReviewerComment() != null ? resignation.getReviewerComment() : comment;
						break;
				}

				// ------------------------------ EMPLOYEE ALWAYS NOTIFIED
				// ------------------------------
				resignationNotificationService.createNotification(
						employeeId,
						null,
						null,
						"Your resignation has been rejected by " + rejecterRole + ". Reason: " + comment);

				emailService.sendEmail(
						employee.getEmail(),
						"Resignation Rejected by " + rejecterRole,
						"Dear " + employeeName + ",\n\n" +
								"Your resignation has been rejected by " + rejecterRole + ".\n" +
								"Reason: " + comment + "\n\nRegards,\nHR Team");

				// ------------------------------ HR ALWAYS NOTIFIED
				// ------------------------------
				if (employee.getAssignedHrId() != null) {
					employeeRepository.findByEmployeeId(employee.getAssignedHrId()).ifPresent(hr -> {

						resignationNotificationService.createNotification(
								hr.getEmployeeId(),
								null,
								null,
								"Resignation of " + employeeName + " (" + employeeId + ") was rejected by "
										+ rejecterRole + ".");

						emailService.sendEmail(
								hr.getEmail(),
								"Resignation Rejected - " + employeeName,
								"Dear " + hr.getFirstName() + " " + hr.getLastName() + ",\n\n"
										+
										"The resignation of " + employeeName + " (" + employeeId + ") " +
										"was rejected by " + rejecterRole + ".\n\nRegards,\nSystem");
					});
				}

				// ------------------------------ SPECIAL CASE: HR REJECTED
				// ------------------------------
				if ("HR".equalsIgnoreCase(rejecterRole)) {

					// Notify Manager
					if (employee.getAssignedManagerId() != null) {
						resignationNotificationService.createNotification(
								employee.getAssignedManagerId(),
								null,
								null,
								"Resignation of " + employeeName + " (" + employeeId + ") was rejected by HR.");

						employeeRepository.findByEmployeeId(employee.getAssignedManagerId())
								.ifPresent(manager -> {
									emailService.sendEmail(
											manager.getEmail(),
											"Resignation Rejected by HR",
											"Dear " + manager.getFirstName() + " " + manager.getLastName() + ",\n\n"
													+
													"The resignation of " + employeeName + " (" + employeeId
													+ ") was rejected by HR.\n\nRegards,\nSystem");
								});
					}

					// Notify Reviewer
					if (employee.getReviewerId() != null) {
						resignationNotificationService.createNotification(
								employee.getReviewerId(),
								null,
								null,
								"Resignation of " + employeeName + " (" + employeeId + ") was rejected by HR.");

						employeeRepository.findByEmployeeId(employee.getReviewerId())
								.ifPresent(reviewer -> {
									emailService.sendEmail(
											reviewer.getEmail(),
											"Resignation Rejected by HR",
											"Dear " + reviewer.getFirstName() + " " + reviewer.getLastName() + ",\n\n"
													+
													"The resignation of " + employeeName + " (" + employeeId
													+ ") was rejected by HR.\n\nRegards,\nSystem");
								});
					}
				}

			}
			return;
		}

		// -------------------- ✅ APPROVAL & CLEARANCE STAGE NOTIFICATIONS
		// --------------------
		switch (status) {

			case "Approved by Manager and Reviewer":
				if (employee != null) {
					// ✅ Notify Employee
					resignationNotificationService.createNotification(
							employeeId,
							"EMPLOYEE",
							resignation.getId(),
							"Your resignation has been approved by Manager and Reviewer. Routed to HR.");
					emailService.sendEmail(
							employee.getEmail(),
							"Resignation Approved by M&R",
							String.format(
									"Dear %s,\n\nYour resignation is moving to HR for final approval and clearance steps.\n\nRegards,\nSystem",
									employeeName));

					// ✅ Notify HR (Notification + Email)
					if (employee.getAssignedHrId() != null) {
						Optional<Employee> hr = employeeRepository.findByEmployeeId(employee.getAssignedHrId());
						hr.ifPresent(hrEmp -> {
							// In-app notification
							resignationNotificationService.createNotification(
									hrEmp.getEmployeeId(),
									"HR",
									resignation.getId(),
									String.format(
											"Resignation for %s approved by Manager & Reviewer. HR approval required.",
											employeeName));

							// Email to HR
							emailService.sendEmail(
									hrEmp.getEmail(),
									"ACTION REQUIRED: HR Approval - " + employeeName,
									String.format(
											"Dear %s,\n\nResignation for %s (ID: %s) has been approved by Manager & Reviewer. "
													+
													"Please review and approve.\n\nRegards,\nSystem",
											hrEmp.getFirstName() + " " + hrEmp.getLastName(), employeeName,
											resignation.getEmployeeId()));
						});
					}
				}

				break;

			case "HR Approved":
				if (employee != null) {
					// Notify Employee (Clearance Initiated)
					resignationNotificationService.createNotification(employeeId, "EMPLOYEE", resignation.getId(),
							"HR has approved your resignation. Clearance process (HR & Admin) is now initiated.");
					emailService.sendEmail(employee.getEmail(), "HR Approval Received - Clearance Started",
							String.format(
									"Dear %s,\n\nHR has approved your resignation. The next step is parallel clearance by HR and Admin teams.\n\nRegards,\nSystem",
									employeeName));

					// Notify HR (Action Required: Clearance)
					if (employee.getAssignedHrId() != null) {
						Optional<Employee> hr = employeeRepository.findByEmployeeId(employee.getAssignedHrId());
						hr.ifPresent(hrEmp -> {
							resignationNotificationService.createNotification(
									hrEmp.getEmployeeId(), "HR", resignation.getId(),
									String.format("Resignation for %s is HR approved. Please complete HR Clearance.",
											employeeName));
						});
					}
					// Notify Admin (Action Required: Clearance)
					if (employee.getAssignedAdminId() != null) {
						Optional<Employee> admin = employeeRepository.findByEmployeeId(employee.getAssignedAdminId());
						admin.ifPresent(adminEmp -> {
							resignationNotificationService.createNotification(
									adminEmp.getEmployeeId(), "ADMIN", resignation.getId(),
									String.format("Resignation for %s is HR approved. Please complete Admin Clearance.",
											employeeName));
							emailService.sendEmail(
									adminEmp.getEmail(),
									"ADMIN CLEARANCE: " + employeeName,
									String.format(
											"Dear %s,\n\nResignation for %s (ID: %s) is HR approved. Please proceed with Admin clearance in parallel with HR.\n\nRegards,\nSystem",
											adminEmp.getFirstName() + " " + adminEmp.getLastName(),
											employeeName,
											resignation.getEmployeeId())

							);
						});
					}
				}
				break;

			case "Clearance Completed":
				// Notify Employee
				resignationNotificationService.createNotification(employeeId, "EMPLOYEE", resignation.getId(),
						"HR and Admin clearance is complete. Final settlement process started.");
				emailService.sendEmail(employee.getEmail(), "Clearance Complete", String.format(
						"Dear %s,\n\nYour HR and Admin clearance process is completed successfully. The finance team will now process your final settlement.\n\nRegards,\nHR Team",
						employeeName));

				// Notify Finance (Action Required)
				if (employee != null && employee.getAssignedFinanceId() != null) {
					Optional<Employee> finance = employeeRepository.findByEmployeeId(employee.getAssignedFinanceId());
					finance.ifPresent(finEmp -> {
						resignationNotificationService.createNotification(
								finEmp.getEmployeeId(), "FINANCE", resignation.getId(),
								String.format("Clearance completed for %s. Please complete Finance settlement.",
										employeeName));
						emailService.sendEmail(
								finEmp.getEmail(),
								"FINANCE ACTION REQUIRED: " + employeeName,
								String.format(
										"Dear %s,\n\nClearance for %s (ID: %s) has been completed by HR & Admin. Please perform the final settlement.\n\nRegards,\nSystem",
										finEmp.getFirstName() + " " + finEmp.getLastName(), employeeName,
										resignation.getEmployeeId()));
					});
				}
				break;

			case "Settlement Done → Exit Completed":
				resignation.setStatus("Final Approved - Exit Complete");
				resignationRepository.save(resignation);
				if (employee != null && employee.getEmail() != null) {
					// Notify Employee (Final)
					resignationNotificationService.createNotification(employeeId, "EMPLOYEE", resignation.getId(),
							"Your exit process has been successfully completed.");
					emailService.sendEmail(
							employee.getEmail(),
							"Exit Complete - " + employeeName,
							String.format(
									"Dear %s,\n\nYour exit process is now complete and the final settlement has been processed.\n\nRegards,\nSystem",
									employeeName));
				}
				break;
		}
	}

	// -------------------- Employee functions --------------------
	public Resignation submitResignation(ResignationDto dto, String employeeId, String employeeName) {
		if (dto.getStatus() == null || !dto.getStatus().equalsIgnoreCase("Draft")) {
			validateProjectAssignment(employeeId);
		}

		Resignation resignation = new Resignation();
		resignation.setEmployeeId(employeeId);
		resignation.setEmployeeName(employeeName);

		String status = "Pending Approval";
		if (dto.getStatus() != null && dto.getStatus().equalsIgnoreCase("Draft")) {
			status = "Draft";
		}
		resignation.setStatus(status);

		resignation.setManagerApproved(false);
		resignation.setReviewerApproved(false);
		resignation.setHrCleared(false);
		resignation.setAdminCleared(false);

		// --- STICKY DELEGATION ---
		// Fetch employee to get default approvers
		Employee empForDelegation = employeeRepository.findByEmployeeId(employeeId)
				.orElseThrow(() -> new RuntimeException("Employee not found"));

		resignation.setAssignedManagerId(delegationService.getEffectiveApprover(empForDelegation.getAssignedManagerId(), "Exit Management"));
		resignation.setAssignedReviewerId(delegationService.getEffectiveApprover(empForDelegation.getReviewerId(), "Exit Management"));
		resignation.setAssignedHrId(delegationService.getEffectiveApprover(empForDelegation.getAssignedHrId(), "Exit Management"));
		resignation.setAssignedAdminId(delegationService.getEffectiveApprover(empForDelegation.getAssignedAdminId(), "Exit Management"));
		resignation.setAssignedFinanceId(delegationService.getEffectiveApprover(empForDelegation.getAssignedFinanceId(), "Exit Management"));

		validateAndSetResignationFields(dto, resignation, status, employeeId);

		Resignation saved = resignationRepository.save(resignation);

		// 📌 Send notifications only when NOT a draft
		if (!"Draft".equalsIgnoreCase(status)) {

			Optional<Employee> emp = employeeRepository.findByEmployeeId(employeeId);

			emp.ifPresent(employee -> {

				// ---------------------- MANAGER Notification + Email ----------------------
				if (employee.getAssignedManagerId() != null) {
					// In-app notification
					resignationNotificationService.createNotification(
							employee.getAssignedManagerId(),
							null, // role removed
							null, // resignationId removed
							"New resignation pending your approval from " + employeeName + " "
									+ employee.getEmployeeId() + " .");

					// Email to Manager
					employeeRepository.findByEmployeeId(employee.getAssignedManagerId())
							.ifPresent(manager -> {
								emailService.sendEmail(
										manager.getEmail(),
										"New Resignation Submitted",
										"New resignation submitted from " +
												employeeName + " (" + employee.getEmployeeId()
												+ "), pending your approval.");
							});
				}

				// ---------------------- REVIEWER Notification + Email ----------------------
				if (employee.getReviewerId() != null) {
					// In-app notification
					resignationNotificationService.createNotification(
							employee.getReviewerId(),
							null, // role removed
							null, // resignationId removed
							"New resignation pending your review from " + employeeName + " " + employee.getEmployeeId()
									+ " .");

					// Email to Reviewer
					employeeRepository.findByEmployeeId(employee.getReviewerId())
							.ifPresent(reviewer -> {
								emailService.sendEmail(
										reviewer.getEmail(),
										"New Resignation Submitted",
										"New resignation submitted from " +
												employeeName + " (" + employee.getEmployeeId()
												+ "), pending your review.");
							});
				}

				// ---------------------- HR Notification (NEW) ----------------------
				if (employee.getAssignedHrId() != null) {
					resignationNotificationService.createNotification(
							employee.getAssignedHrId(),
							"HR",
							saved.getId(),
							"New resignation submitted by " + employeeName + " (ID: " + employeeId + ").");

					// Optional email to HR
					employeeRepository.findByEmployeeId(employee.getAssignedHrId()).ifPresent(hr -> {
						emailService.sendEmail(
								hr.getEmail(),
								"New Resignation Submitted",
								"New resignation submitted from " + employeeName + " (" + employee.getEmployeeId()
										+ ").");
					});

				}

			});
		}

		return saved;
	}

	public Resignation editLastWorkingDayByHr(
			Long resignationId,
			String hrId,
			String newLwdDdMmYyyy,
			String hrComments) {

		Resignation res = getResignationById(resignationId);
		if (res == null) {
			throw new IllegalArgumentException("Resignation not found for ID: " + resignationId);
		}

		// Validate HR inputs
		if (newLwdDdMmYyyy == null || newLwdDdMmYyyy.isBlank()) {
			throw new IllegalArgumentException("New Last Working Day is required.");
		}
		if (hrComments == null || hrComments.isBlank()) {
			throw new IllegalArgumentException("Comments are required when editing Last Working Day.");
		}

		Employee employee = employeeRepository.findByEmployeeId(res.getEmployeeId())
				.orElseThrow(() -> new RuntimeException("Employee not found"));

		// Optional check for HR authorization
		if (res.getAssignedHrId() == null || !res.getAssignedHrId().equals(hrId)) {
			System.err.println("⚠️ Warning: HR editing LWD but HR not assigned to this employee => " + hrId);
		}

		try {
			LocalDate originalLwd = res.getLastWorkingDay(); // ⭐ OLD DATE

			LocalDate newLwd = LocalDate.parse(newLwdDdMmYyyy, DD_MM_YYYY);

			// ⭐ CALL YOUR ADJUSTMENT LOGIC
			LocalDate adjustedLwd = adjustLwd(employee, newLwd);

			// Set new date
			res.setLastWorkingDay(adjustedLwd);

			// Append HR comment into main comments thread
			String existing = res.getComments();
			String updated = (existing == null || existing.isBlank())
					? String.format("HR updated LWD on %s. Reason: %s", LocalDate.now(), hrComments)
					: existing + "\n" + String.format("HR updated LWD on %s. Reason: %s", LocalDate.now(), hrComments);

			res.setComments(updated);

			Resignation saved = resignationRepository.save(res);

			// ⭐ TRIGGER BROADCAST NOTIFICATIONS
			sendLwdChangeNotifications(saved, originalLwd, adjustedLwd, hrComments);

			adjustAllocationsForExitDate(saved);

			return saved;

		} catch (Exception e) {
			throw new IllegalArgumentException("Invalid date format for LWD. Expected dd-MM-yyyy");
		}
	}

	public Resignation editLastWorkingDayByManager(
			Long resignationId,
			String managerId,
			String newLwdDdMmYyyy,
			String managerComments) {

		Resignation res = getResignationById(resignationId);
		if (res == null) {
			throw new IllegalArgumentException("Resignation not found for ID: " + resignationId);
		}

		// Validate manager inputs
		if (newLwdDdMmYyyy == null || newLwdDdMmYyyy.isBlank()) {
			throw new IllegalArgumentException("New Last Working Day is required.");
		}
		if (managerComments == null || managerComments.isBlank()) {
			throw new IllegalArgumentException("Comments are required when editing Last Working Day.");
		}

		Employee employee = employeeRepository.findByEmployeeId(res.getEmployeeId())
				.orElseThrow(() -> new RuntimeException("Employee not found"));

		// Optional check for Manager authorization
		if (res.getAssignedManagerId() == null || !res.getAssignedManagerId().equals(managerId)) {
			System.err.println("⚠️ Warning: Manager editing LWD but Manager not assigned to this employee => " + managerId);
		}

		try {
			LocalDate originalLwd = res.getLastWorkingDay(); // ⭐ OLD DATE

			LocalDate newLwd = LocalDate.parse(newLwdDdMmYyyy, DD_MM_YYYY);

			// ⭐ CALL YOUR ADJUSTMENT LOGIC
			LocalDate adjustedLwd = adjustLwd(employee, newLwd);

			// Set new date
			res.setLastWorkingDay(adjustedLwd);

			// Append Manager comment into main comments thread
			String existing = res.getComments();
			String updated = (existing == null || existing.isBlank())
					? String.format("Manager updated LWD on %s. Reason: %s", LocalDate.now(), managerComments)
					: existing + "\n" + String.format("Manager updated LWD on %s. Reason: %s", LocalDate.now(), managerComments);

			res.setComments(updated);

			Resignation saved = resignationRepository.save(res);

			// ⭐ TRIGGER BROADCAST NOTIFICATIONS
			sendLwdChangeNotificationsByManager(saved, originalLwd, adjustedLwd, managerComments);

			adjustAllocationsForExitDate(saved);

			return saved;

		} catch (Exception e) {
			throw new IllegalArgumentException("Invalid date format for LWD. Expected dd-MM-yyyy");
		}
	}

	public List<Resignation> getMyResignationHistory(String employeeId) {
		return resignationRepository.findByEmployeeId(employeeId);
	}

	public Resignation getResignationById(Long id) {
		return resignationRepository.findById(id).orElse(null);
	}

	public void deleteResignation(Long id) {
		if (!resignationRepository.existsById(id)) {
			throw new IllegalArgumentException("Resignation not found with id: " + id);
		}
		resignationRepository.deleteById(id);
	}

	public Resignation updateResignation(Long id, ResignationDto dto, String employeeId, String employeeName) {
		Resignation resignation = getResignationById(id);
		if (resignation == null)
			throw new IllegalStateException("Resignation draft not found with ID: " + id);
		if (!resignation.getEmployeeId().equals(employeeId))
			throw new IllegalArgumentException("Cannot update another employee's resignation.");

		String status = "Pending Approval";
		if (dto.getStatus() != null && dto.getStatus().equalsIgnoreCase("Draft"))
			status = "Draft";

		if (!"Draft".equalsIgnoreCase(status)) {
			validateProjectAssignment(employeeId);
		}

		resignation.setStatus(status);

		// --- STICKY DELEGATION ---
		Employee empSnapshot = employeeRepository.findByEmployeeId(employeeId)
				.orElseThrow(() -> new RuntimeException("Employee not found"));

		resignation.setAssignedManagerId(delegationService.getEffectiveApprover(empSnapshot.getAssignedManagerId(), "Exit Management"));
		resignation.setAssignedReviewerId(delegationService.getEffectiveApprover(empSnapshot.getReviewerId(), "Exit Management"));
		resignation.setAssignedHrId(delegationService.getEffectiveApprover(empSnapshot.getAssignedHrId(), "Exit Management"));
		resignation.setAssignedAdminId(delegationService.getEffectiveApprover(empSnapshot.getAssignedAdminId(), "Exit Management"));
		resignation.setAssignedFinanceId(delegationService.getEffectiveApprover(empSnapshot.getAssignedFinanceId(), "Exit Management"));

		validateAndSetResignationFields(dto, resignation, status, employeeId);

		Resignation updated = resignationRepository.save(resignation);
		return updated;
	}

	public List<Resignation> getAssignedResignations(String role, String userId) {
		if (userId == null || userId.isEmpty())
			return List.of();

		Set<Resignation> allResignations = new HashSet<>(fetchDirectResignations(role, userId));
		
		// Add delegated resignations
		List<Delegation> activeDels = delegationService.getActiveDelegationsForDelegate(userId, "Exit Management");
		activeDels.addAll(delegationService.getActiveDelegationsForDelegate(userId, "All"));
		
		for (Delegation d : activeDels) {
			String delegatorId = d.getDelegatorId();
			if (!delegatorId.equals(userId)) {
				allResignations.addAll(fetchDirectResignations(role, delegatorId));
			}
		}
		
		return new ArrayList<>(allResignations);
	}

	private List<Resignation> fetchDirectResignations(String role, String userId) {
		switch (role.toUpperCase()) {
			case "MANAGER":
				return resignationRepository.findPendingResignationsForManager(userId);
			case "REVIEWER":
				return resignationRepository.findPendingResignationsForReviewer(userId);
			case "HR":
				return resignationRepository.findApprovedResignationsForHR(userId);
			case "ADMIN":
				return resignationRepository.findPendingResignationsForAdmin(userId);
			case "FINANCE":
				return resignationRepository.findPendingResignationsForFinance(userId);
			default:
				return List.of();
		}
	}

	// -------------------- Approval Logic --------------------
	public Resignation approveResignation(Long id, String approverRole, String approverEmployeeId, String comment) {

		Resignation resignation = resignationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Resignation not found"));

		Employee employee = employeeRepository.findByEmployeeId(resignation.getEmployeeId())
				.orElseThrow(() -> new RuntimeException("Employee not found for resignation"));

		// ---------- ROLE LOGIC ----------
		final String actingId = approverEmployeeId;
		final Employee actor = employeeRepository.findByEmployeeId(actingId).orElse(null);
		final String actorName = actor != null ? (actor.getFirstName() + " " + actor.getLastName()) : "Unknown";

		switch (approverRole.toUpperCase()) {

			case "MANAGER":
				if (resignation.getAssignedManagerId() == null ||
						!resignation.getAssignedManagerId().equals(actingId))
					throw new IllegalStateException("You are not authorized to approve as Manager.");

				resignation.setManagerApproved(true);
				resignation.setManagerComment(comment);
				resignation.setManagerActorId(actingId);
				resignation.setManagerActorName(actorName + " (" + actingId + ")");
				
				// Record delegator if actingId is not the original manager
				if (employee.getAssignedManagerId() != null && !employee.getAssignedManagerId().equals(actingId)) {
					resignation.setManagerDelegatorId(employee.getAssignedManagerId());
					employeeRepository.findByEmployeeId(employee.getAssignedManagerId()).ifPresent(orig -> 
						resignation.setManagerDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + employee.getAssignedManagerId() + ")")
					);
				}
				break;

			case "REVIEWER":
				if (resignation.getAssignedReviewerId() == null ||
						!resignation.getAssignedReviewerId().equals(actingId))
					throw new IllegalStateException("You are not authorized to approve as Reviewer.");

				resignation.setReviewerApproved(true);
				resignation.setReviewerComment(comment);
				resignation.setReviewerActorId(actingId);
				resignation.setReviewerActorName(actorName + " (" + actingId + ")");

				// Record delegator if actingId is not the original reviewer
				if (employee.getReviewerId() != null && !employee.getReviewerId().equals(actingId)) {
					resignation.setReviewerDelegatorId(employee.getReviewerId());
					employeeRepository.findByEmployeeId(employee.getReviewerId()).ifPresent(orig -> 
						resignation.setReviewerDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + employee.getReviewerId() + ")")
					);
				}
				break;

			case "HR":
				if (resignation.getAssignedHrId() == null ||
						!resignation.getAssignedHrId().equals(actingId))
					throw new IllegalStateException("You are not authorized to approve as HR.");

				if (Boolean.TRUE.equals(resignation.getManagerApproved()) &&
						Boolean.TRUE.equals(resignation.getReviewerApproved())) {

					resignation.setStatus("HR Approved");
					resignation.setHrApproved(true);
					resignation.setHrActorId(actingId);
					resignation.setHrActorName(actorName + " (" + actingId + ")");

					// Record delegator if actingId is not the original HR
					if (employee.getAssignedHrId() != null && !employee.getAssignedHrId().equals(actingId)) {
						resignation.setHrDelegatorId(employee.getAssignedHrId());
						employeeRepository.findByEmployeeId(employee.getAssignedHrId()).ifPresent(orig -> 
							resignation.setHrDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + employee.getAssignedHrId() + ")")
						);
					}

					String prev = resignation.getComments();
					String updatedComment = "HR Comment: " + comment;

					resignation.setComments(prev != null && !prev.isBlank()
							? prev + "\n" + updatedComment
							: updatedComment);

				} else {
					throw new IllegalStateException("Cannot HR approve before Manager and Reviewer approval.");
				}
				break;

			default:
				throw new IllegalArgumentException("Invalid approver role: " + approverRole);
		}

		// ---------- UPDATED APPROVAL STATUS LOGIC ----------

		if (!"HR Approved".equals(resignation.getStatus())) {

			boolean managerApproved = Boolean.TRUE.equals(resignation.getManagerApproved());
			boolean reviewerApproved = Boolean.TRUE.equals(resignation.getReviewerApproved());

			if (managerApproved && reviewerApproved) {
				resignation.setStatus("Approved by Manager and Reviewer");
			} else if (managerApproved) {
				resignation.setStatus("Approved by Manager");
			} else if (reviewerApproved) {
				resignation.setStatus("Approved by Reviewer");
			} else {
				resignation.setStatus("Pending Approval");
			}
		}

		// ---------- SAVE & NOTIFY ----------
		Resignation saved = resignationRepository.save(resignation);
		sendNotificationForNextStep(saved);

		adjustAllocationsForExitDate(saved);

		return saved;
	}

	public Resignation markClearanceComplete(Long resignationId, String role, boolean cleared, String actorId) {
		Resignation resignation = resignationRepository.findById(resignationId)
				.orElseThrow(() -> new RuntimeException("Resignation not found"));

		Employee requester = employeeRepository.findByEmployeeId(resignation.getEmployeeId()).orElse(null);
		final Employee actor = employeeRepository.findByEmployeeId(actorId).orElse(null);
		final String actorName = actor != null ? (actor.getFirstName() + " " + actor.getLastName()) : "Unknown";

		switch (role.toUpperCase()) {
			case "HR":
				resignation.setHrCleared(cleared);
				resignation.setHrActorId(actorId);
				resignation.setHrActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getAssignedHrId() != null && !requester.getAssignedHrId().equals(actorId)) {
					resignation.setHrDelegatorId(requester.getAssignedHrId());
					employeeRepository.findByEmployeeId(requester.getAssignedHrId()).ifPresent(orig ->
						resignation.setHrDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedHrId() + ")")
					);
				}
				break;

			case "ADMIN":
				resignation.setAdminCleared(cleared);
				resignation.setAdminActorId(actorId);
				resignation.setAdminActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getAssignedAdminId() != null && !requester.getAssignedAdminId().equals(actorId)) {
					resignation.setAdminDelegatorId(requester.getAssignedAdminId());
					employeeRepository.findByEmployeeId(requester.getAssignedAdminId()).ifPresent(orig ->
						resignation.setAdminDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedAdminId() + ")")
					);
				}
				break;

			case "IT":
				resignation.setItCleared(cleared);
				break;

			default:
				throw new IllegalArgumentException("Invalid clearance role: " + role);
		}

		// ⭐ Central dynamic logic will set status & notifications
		return recomputeClearanceStatus(resignation);
	}

	public Resignation markFinanceSettlementDone(Long resignationId, String actorId) {
		Resignation resignation = resignationRepository.findById(resignationId)
				.orElseThrow(() -> new RuntimeException("Resignation not found"));

		Employee requester = employeeRepository.findByEmployeeId(resignation.getEmployeeId()).orElse(null);
		final Employee actor = employeeRepository.findByEmployeeId(actorId).orElse(null);
		final String actorName = actor != null ? (actor.getFirstName() + " " + actor.getLastName()) : "Unknown";

		// STEP 1: Update resignation status and attribution
		resignation.setStatus("Final Approved - Exit Complete");
		resignation.setFinanceActorId(actorId);
		resignation.setFinanceActorName(actorName + " (" + actorId + ")");
		if (requester != null && requester.getAssignedFinanceId() != null && !requester.getAssignedFinanceId().equals(actorId)) {
			resignation.setFinanceDelegatorId(requester.getAssignedFinanceId());
			employeeRepository.findByEmployeeId(requester.getAssignedFinanceId()).ifPresent(orig ->
				resignation.setFinanceDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedFinanceId() + ")")
			);
		}
		Resignation saved = resignationRepository.save(resignation);

		// STEP 2: Update employee ACTIVE status (REMOVED: Now handled by LWD in
		// AuthController)

		// STEP 3: Send final notifications
		sendNotificationForNextStep(saved);

		adjustAllocationsForExitDate(saved);

		return saved;
	}

	public Resignation approveResignation(Long id, String approverRole, String approverEmployeeId) {
		return approveResignation(id, approverRole, approverEmployeeId, "");
	}

	public Resignation rejectResignation(Long id, String role, String comment, String actorId) {
		Resignation res = getResignationById(id);
		if (res == null)
			throw new IllegalArgumentException("Resignation not found with ID: " + id);

		Employee requester = employeeRepository.findByEmployeeId(res.getEmployeeId()).orElse(null);
		final Employee actor = employeeRepository.findByEmployeeId(actorId).orElse(null);
		final String actorName = actor != null ? (actor.getFirstName() + " " + actor.getLastName()) : "Unknown";

		switch (role.toUpperCase()) {
			case "MANAGER":
				res.setStatus("Rejected by Manager");
				res.setManagerApproved(false);
				res.setManagerComment(comment);
				res.setManagerActorId(actorId);
				res.setManagerActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getAssignedManagerId() != null && !requester.getAssignedManagerId().equals(actorId)) {
					res.setManagerDelegatorId(requester.getAssignedManagerId());
					employeeRepository.findByEmployeeId(requester.getAssignedManagerId()).ifPresent(orig ->
						res.setManagerDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedManagerId() + ")")
					);
				}
				break;
			case "REVIEWER":
				res.setStatus("Rejected by Reviewer");
				res.setReviewerApproved(false);
				res.setReviewerComment(comment);
				res.setReviewerActorId(actorId);
				res.setReviewerActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getReviewerId() != null && !requester.getReviewerId().equals(actorId)) {
					res.setReviewerDelegatorId(requester.getReviewerId());
					employeeRepository.findByEmployeeId(requester.getReviewerId()).ifPresent(orig ->
						res.setReviewerDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getReviewerId() + ")")
					);
				}
				break;
			case "HR":
				res.setStatus("Rejected by HR");
				res.setHrActorId(actorId);
				res.setHrActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getAssignedHrId() != null && !requester.getAssignedHrId().equals(actorId)) {
					res.setHrDelegatorId(requester.getAssignedHrId());
					employeeRepository.findByEmployeeId(requester.getAssignedHrId()).ifPresent(orig ->
						res.setHrDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedHrId() + ")")
					);
				}
				break;
			case "ADMIN":
				res.setStatus("Rejected by Admin");
				res.setAdminActorId(actorId);
				res.setAdminActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getAssignedAdminId() != null && !requester.getAssignedAdminId().equals(actorId)) {
					res.setAdminDelegatorId(requester.getAssignedAdminId());
					employeeRepository.findByEmployeeId(requester.getAssignedAdminId()).ifPresent(orig ->
						res.setAdminDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedAdminId() + ")")
					);
				}
				break;
			case "FINANCE":
				res.setStatus("Rejected by Finance");
				res.setFinanceActorId(actorId);
				res.setFinanceActorName(actorName + " (" + actorId + ")");
				if (requester != null && requester.getAssignedFinanceId() != null && !requester.getAssignedFinanceId().equals(actorId)) {
					res.setFinanceDelegatorId(requester.getAssignedFinanceId());
					employeeRepository.findByEmployeeId(requester.getAssignedFinanceId()).ifPresent(orig ->
						res.setFinanceDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + requester.getAssignedFinanceId() + ")")
					);
				}
				break;
			default:
				res.setStatus("Rejected by " + role);
		}

		Resignation updated = resignationRepository.save(res);
		sendNotificationForNextStep(updated);
		return updated;
	}

	public Resignation rejectResignation(Long id, String role, String actorId) {
		return rejectResignation(id, role, "No comments provided.", actorId);
	}

	public Resignation saveResignation(Resignation resignation) {
		return resignationRepository.save(resignation);
	}

	public List<Resignation> getPendingResignationsForAdmin(String adminId) {
		List<Resignation> list = resignationRepository.findPendingResignationsForAdmin(adminId);
		return list != null ? list : List.of();
	}

	public Resignation updateResignationStatus(Long id, String action) {
		Resignation res = resignationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Resignation not found"));

		switch (action.toLowerCase()) {

			case "employee_submitted":
				res.setStatus("Pending Approval");
				break;

			case "manager_reviewer_approved":
				res.setStatus("Approved by Manager and Reviewer");
				break;

			case "clearance_completed":
				res.setStatus("Clearance Completed");
				break;

			case "final_settlement_done":
				res.setStatus("Final Approved - Exit Complete");
				break;

			case "rejected":
				res.setStatus("Rejected");
				break;

			default:
				throw new RuntimeException("Invalid action: " + action);
		}

		return resignationRepository.save(res);
	}

	// FETCH ACTIVE EXIT REASONS
	public List<ExitReason> getExitReasons(String tenantId) {
		if (tenantId == null || tenantId.trim().isEmpty()) {
			return exitReasonRepository.findByActiveTrue();
		}
		return exitReasonRepository.findActiveByTenantIdOrGlobal(tenantId);
	}

	public List<Resignation> getFilteredResignations(String employeeId, String status, String reason,
			LocalDate startDate, LocalDate endDate, String tenantId) {
		List<String> tenantEmployeeIds = null;
		String tenantCode = null;
		if (tenantId != null && !tenantId.trim().isEmpty()) {
			try {
				if (tenantId.matches("\\d+")) {
					java.util.Optional<com.register.example.entity.Tenant> tOpt = tenantRepository.findById(Long.parseLong(tenantId));
					if (tOpt.isPresent()) {
						tenantCode = tOpt.get().getTenantId();
					}
				}
			} catch (Exception ignored) {}

			List<Employee> tenantEmployees = employeeRepository.findByTenantId(tenantId);
			if (tenantEmployees.isEmpty()) {
				return new java.util.ArrayList<>();
			}
			tenantEmployeeIds = tenantEmployees.stream().map(Employee::getEmployeeId).toList();
		}

		List<String> searchEmployeeIds = null;
		if (employeeId != null && !employeeId.trim().isEmpty()) {
			searchEmployeeIds = new java.util.ArrayList<>();
			searchEmployeeIds.add(employeeId.trim());
			if (tenantCode != null) {
				searchEmployeeIds.add(tenantCode + "_" + employeeId.trim());
			}
			if (tenantId != null) {
				searchEmployeeIds.add(tenantId + "_" + employeeId.trim());
			}
		}

		return resignationRepository.getFilteredResignations(
				(searchEmployeeIds == null || searchEmployeeIds.isEmpty()) ? null : searchEmployeeIds,
				(status == null || status.trim().isEmpty()) ? null : status,
				(reason == null || reason.trim().isEmpty()) ? null : reason,
				startDate,
				endDate,
				tenantEmployeeIds);
	}

	// SAVE EXIT REASON
	public ExitReason saveExitReason(ExitReason reason) {
		return exitReasonRepository.save(reason);
	}

	public void deleteExitReason(Long id) {
		exitReasonRepository.deleteById(id);
	}

	// ---------------- GLOBAL NOTICE PERIOD ----------------

	public Integer getNoticePeriod(String tenantId) {
		if (tenantId == null || tenantId.trim().isEmpty()) {
			return noticePeriodRepository.findAll()
					.stream()
					.findFirst()
					.map(NoticePeriod::getNoticePeriodDays)
					.orElse(60); // default if empty
		}
		return noticePeriodRepository.findByTenantId(tenantId)
				.map(NoticePeriod::getNoticePeriodDays)
				.orElseGet(() -> {
					return noticePeriodRepository.findAll()
							.stream()
							.filter(np -> np.getTenantId() == null)
							.findFirst()
							.map(NoticePeriod::getNoticePeriodDays)
							.orElse(60);
				});
	}

	public Integer updateNoticePeriod(Integer days, String tenantId) {
		NoticePeriod settings;
		if (tenantId == null || tenantId.trim().isEmpty()) {
			settings = noticePeriodRepository.findAll()
					.stream()
					.filter(np -> np.getTenantId() == null)
					.findFirst()
					.orElse(new NoticePeriod());
		} else {
			settings = noticePeriodRepository.findByTenantId(tenantId)
					.orElseGet(() -> {
						NoticePeriod np = new NoticePeriod();
						np.setTenantId(tenantId);
						return np;
					});
		}

		settings.setNoticePeriodDays(days);
		noticePeriodRepository.save(settings);
		return days;
	}

	// ================= EXIT QUESTIONS =================

	public List<ExitQuestion> getExitQuestions(String tenantId) {
		if (tenantId == null || tenantId.trim().isEmpty()) {
			return exitQuestionRepository.findAllByOrderByDisplayOrderAsc();
		}
		return exitQuestionRepository.findQuestionsByTenantIdOrGlobal(tenantId);
	}

	public ExitQuestion saveExitQuestion(ExitQuestion question) {
		return exitQuestionRepository.save(question);
	}

	public void deleteExitQuestion(Long id) {
		exitQuestionRepository.deleteById(id);
	}

	private boolean isDeptEnabled(String deptCode) {
		return clearanceChecklistRepository.existsByDepartmentIgnoreCase(deptCode);
	}

	public Resignation recomputeClearanceStatus(Resignation resignation) {

		boolean hrOk = Boolean.TRUE.equals(resignation.getHrCleared());
		boolean adminOk = Boolean.TRUE.equals(resignation.getAdminCleared());

		boolean allDone = hrOk && adminOk;

		if (allDone) {
			resignation.setStatus("Clearance Completed");
			Resignation saved = resignationRepository.save(resignation);
			sendNotificationForNextStep(saved);
			return saved;
		}

		return resignationRepository.save(resignation);
	}

	// ResignationService.java

	// ResignationService.java
	private LocalDate adjustLwd(Employee employee, LocalDate lwd) {

		String location = employee.getWorkLocation();
		List<LocalDate> holidays = List.of();

		if (location != null && !location.isBlank()) {
			try {
				holidays = holidayService.getHolidaysByLocation(location)
						.stream()
						.map(Holiday::getDate)
						.toList();
			} catch (Exception e) {
				System.err.println("⚠️ Warning: Could not fetch holidays for location: " + location);
			}
		}

		LocalDate finalLwd = lwd;

		// 🚀 MOVE BACKWARD UNTIL A WORKING DAY IS FOUND
		while (isNonWorkingDay(finalLwd, holidays)) {
			finalLwd = finalLwd.minusDays(1);
		}

		return finalLwd;
	}

	/**
	 * Helper to check if a given date is a weekend or a public holiday.
	 */
	// used when moving backward from Saturday
	// when moving backward
	private boolean isNonWorkingBackward(LocalDate date, List<LocalDate> holidays) {
		DayOfWeek day = date.getDayOfWeek();
		return day.equals(DayOfWeek.SATURDAY)
				|| day.equals(DayOfWeek.SUNDAY)
				|| holidays.contains(date);
	}

	// when moving forward from Sunday
	private boolean isNonWorkingForward(LocalDate date, List<LocalDate> holidays) {
		DayOfWeek day = date.getDayOfWeek();
		return day.equals(DayOfWeek.SUNDAY) || holidays.contains(date);
	}

	public Map<String, String> adjustLwdForUi(String employeeId, String date) {
		Map<String, String> response = new HashMap<>();
		try {
			Employee employee = employeeRepository.findByEmployeeId(employeeId)
					.orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

			LocalDate original;
			try {
				original = LocalDate.parse(date, DD_MM_YYYY);
			} catch (DateTimeParseException e) {
				try {
					original = LocalDate.parse(date); // Fallback to ISO
				} catch (DateTimeParseException ex) {
					throw new IllegalArgumentException(
							"Invalid date format: " + date + ". Expected dd-MM-yyyy or YYYY-MM-DD");
				}
			}

			LocalDate adjusted = adjustLwd(employee, original);

			String reason = "none";
			final LocalDate originalLwd = original;

			// ⭐ Only assign a reason IF adjustment actually changed the date
			if (!adjusted.equals(original)) {
				if (original.getDayOfWeek().equals(DayOfWeek.SATURDAY)) {
					reason = "Saturday";
				} else if (original.getDayOfWeek().equals(DayOfWeek.SUNDAY)) {
					reason = "Sunday";
				} else {
					String loc = employee.getWorkLocation();
					if (loc != null && !loc.isBlank()) {
						try {
							if (holidayService.getHolidaysByLocation(loc)
									.stream().anyMatch(h -> h.getDate().equals(originalLwd))) {
								reason = "Holiday";
							}
						} catch (Exception e) {
							// Ignore holiday fetch error for reason string
						}
					}
				}
			}

			response.put("originalDate", date);
			response.put("adjustedDate", adjusted.format(DD_MM_YYYY));
			response.put("reason", reason);

		} catch (IllegalArgumentException e) {
			response.put("error", e.getMessage());
		} catch (Exception e) {
			response.put("error", "Unexpected error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
		}

		return response;
	}

	private void sendLwdChangeNotificationsByManager(Resignation resignation, LocalDate oldLwd, LocalDate newLwd,
			String managerComments) {

		Employee employee = employeeRepository.findByEmployeeId(resignation.getEmployeeId())
				.orElse(null);

		if (employee == null)
			return;

		String employeeName = employee.getFirstName() + " " + employee.getLastName();

		String employeeId = employee.getEmployeeId();

		String msg = String.format(
				"Manager has updated Last Working Day for %s (%s) from %s to %s.\nReason: %s",
				employeeName,
				employeeId,
				oldLwd.format(DD_MM_YYYY),
				newLwd.format(DD_MM_YYYY),
				managerComments);

		// ---------------- EMPLOYEE ----------------
		resignationNotificationService.createNotification(
				employeeId, "EMPLOYEE", resignation.getId(), msg);
		emailService.sendEmail(employee.getEmail(),
				"Last Working Day Updated",
				msg);

		// ---------------- MANAGER ----------------
		if (employee.getAssignedManagerId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedManagerId(),
					"MANAGER",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedManagerId())
					.ifPresent(manager -> emailService.sendEmail(
							manager.getEmail(), "LWD Updated", msg));
		}

		// ---------------- REVIEWER ----------------
		if (employee.getReviewerId() != null) {
			resignationNotificationService.createNotification(
					employee.getReviewerId(),
					"REVIEWER",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getReviewerId())
					.ifPresent(reviewer -> emailService.sendEmail(
							reviewer.getEmail(), "LWD Updated", msg));
		}

		// ---------------- HR ----------------
		if (employee.getAssignedHrId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedHrId(),
					"HR",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedHrId())
					.ifPresent(hr -> emailService.sendEmail(
							hr.getEmail(), "LWD Updated", msg));
		}

		// ---------------- ADMIN ----------------
		if (employee.getAssignedAdminId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedAdminId(),
					"ADMIN",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedAdminId())
					.ifPresent(admin -> emailService.sendEmail(
							admin.getEmail(), "LWD Updated", msg));
		}

		// ---------------- FINANCE ----------------
		if (employee.getAssignedFinanceId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedFinanceId(),
					"FINANCE",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedFinanceId())
					.ifPresent(fin -> emailService.sendEmail(
							fin.getEmail(), "LWD Updated", msg));
		}
	}

	private void sendLwdChangeNotifications(Resignation resignation, LocalDate oldLwd, LocalDate newLwd,
			String hrComments) {

		Employee employee = employeeRepository.findByEmployeeId(resignation.getEmployeeId())
				.orElse(null);

		if (employee == null)
			return;

		String employeeName = employee.getFirstName() + " " + employee.getLastName();

		String employeeId = employee.getEmployeeId();

		String msg = String.format(
				"HR has updated Last Working Day for %s (%s) from %s to %s.\nReason: %s",
				employeeName,
				employeeId,
				oldLwd.format(DD_MM_YYYY),
				newLwd.format(DD_MM_YYYY),
				hrComments);

		// ---------------- EMPLOYEE ----------------
		resignationNotificationService.createNotification(
				employeeId, "EMPLOYEE", resignation.getId(), msg);
		emailService.sendEmail(employee.getEmail(),
				"Last Working Day Updated",
				msg);

		// ---------------- MANAGER ----------------
		if (employee.getAssignedManagerId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedManagerId(),
					"MANAGER",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedManagerId())
					.ifPresent(manager -> emailService.sendEmail(
							manager.getEmail(), "LWD Updated", msg));
		}

		// ---------------- REVIEWER ----------------
		if (employee.getReviewerId() != null) {
			resignationNotificationService.createNotification(
					employee.getReviewerId(),
					"REVIEWER",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getReviewerId())
					.ifPresent(reviewer -> emailService.sendEmail(
							reviewer.getEmail(), "LWD Updated", msg));
		}

		// ---------------- ADMIN ----------------
		if (employee.getAssignedAdminId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedAdminId(),
					"ADMIN",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedAdminId())
					.ifPresent(admin -> emailService.sendEmail(
							admin.getEmail(), "LWD Updated", msg));
		}

		// ---------------- FINANCE ----------------
		if (employee.getAssignedFinanceId() != null) {
			resignationNotificationService.createNotification(
					employee.getAssignedFinanceId(),
					"FINANCE",
					resignation.getId(),
					msg);

			employeeRepository.findByEmployeeId(employee.getAssignedFinanceId())
					.ifPresent(fin -> emailService.sendEmail(
							fin.getEmail(), "LWD Updated", msg));
		}
	}

	private void validateProjectAssignment(String employeeId) {
		java.time.LocalDate today = java.time.LocalDate.now();
		List<Allocation> allocations = allocationRepository
				.findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
						employeeId, today, today);

		if (allocations == null || allocations.isEmpty()) {
			throw new RuntimeException("You are not assigned to any project , please contact your manager or admin");
		}
	}

	private void adjustAllocationsForExitDate(Resignation resignation) {
		if (resignation == null || resignation.getLastWorkingDay() == null) {
			return;
		}
		String status = resignation.getStatus();
		if (status == null) {
			return;
		}

		boolean isApproved = status.equalsIgnoreCase("HR Approved")
				|| status.equalsIgnoreCase("Final Approved - Exit Complete");

		if (!isApproved) {
			return;
		}

		LocalDate exitDate = resignation.getLastWorkingDay();
		String employeeId = resignation.getEmployeeId();

		List<Allocation> allocations = allocationRepository.findByEmployeeId(employeeId);
		if (allocations == null || allocations.isEmpty()) {
			return;
		}

		for (Allocation allocation : allocations) {
			if (allocation.getEndDate() != null && exitDate.isBefore(allocation.getEndDate())) {
				LocalDate oldEndDate = allocation.getEndDate();
				allocation.setEndDate(exitDate);
				allocationRepository.save(allocation);

				try {
					auditService.logAction(
							"UPDATE",
							"Project Allocation",
							"Allocation",
							allocation.getAllocationId(),
							"SYSTEM",
							"SYSTEM",
							String.format("Automatic update of allocation end date from %s to %s based on resignation approval exit date", oldEndDate, exitDate),
							oldEndDate.toString(),
							exitDate.toString(),
							null,
							null,
							"SUCCESS",
							null,
							resignation.getId().toString()
					);
				} catch (Exception e) {
					System.err.println("Failed to log audit for automatic project allocation update: " + e.getMessage());
				}
			}
		}
	}

}
