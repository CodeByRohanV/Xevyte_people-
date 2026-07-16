package com.register.example.service;

import com.register.example.entity.Applicant;
import com.register.example.entity.Employee;
import com.register.example.entity.Notification;
import com.register.example.payload.ApplicantRequest;
import com.register.example.repository.ApplicantRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicantService {

        private static final String CONST_APPLICANT_NOT_FOUND = "Applicant not found";

        @Autowired
        private ApplicantRepository applicantRepository;

        @Autowired
        private EmployeeRepository employeeRepository;

        @Autowired
        private jakarta.servlet.http.HttpServletRequest request;

        @Autowired
        private NotificationRepository notificationRepo;

        // ✅ Added for email support (NO logic change)
        @Autowired
        private EmailService emailService;

        @Autowired
        private PreOnboardingPdfService pdfService;

        // =====================================
        // 🔔 NOTIFICATION
        // =====================================
        public void sendNotification(String employeeId, String message) {
                if (employeeId == null || employeeId.isEmpty())
                        return;
                Notification notification = new Notification();
                notification.setEmployeeId(employeeId);
                notification.setMessage(message);
                notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
                notification.setRead(false);
                notificationRepo.save(notification);
        }

        public List<Notification> getNotifications(String employeeId) {
                return notificationRepo.findByEmployeeId(employeeId);
        }

        public String markNotificationAsRead(Long id) {
                return notificationRepo.findById(id).map(n -> {
                        n.setRead(true);
                        notificationRepo.save(n);
                        return "Notification marked as read.";
                }).orElse("Notification not found.");
        }

        // =====================================
        // GENERATE APPLICANT ID
        // =====================================
        private String generateApplicantId(String tenantId) {
                String yearMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
                List<String> ids;
                if (tenantId != null && !tenantId.isEmpty()) {
                        ids = applicantRepository.findLatestApplicantIdByTenantIdAndYearMonth(tenantId, yearMonth);
                } else {
                        ids = applicantRepository.findLatestApplicantIdWithoutTenantAndYearMonth(yearMonth);
                }

                String lastId = ids.isEmpty() ? null : ids.get(0);
                int nextSequence = 1;

                if (lastId != null) {
                        String seqPart = lastId;
                        if (seqPart.contains("_")) {
                                seqPart = seqPart.substring(seqPart.lastIndexOf('_') + 1);
                        }
                        if (seqPart.length() >= 10) {
                                String lastSeq = seqPart.substring(6);
                                try {
                                        nextSequence = Integer.parseInt(lastSeq) + 1;
                                } catch (NumberFormatException e) {
                                        System.err.println("Could not parse sequence part of applicant ID: " + lastSeq);
                                }
                        }
                }

                String suffix = String.format("%04d", nextSequence);
                String fullSeq = yearMonth + suffix;
                return (tenantId != null && !tenantId.isEmpty()) ? (tenantId + "_" + fullSeq) : fullSeq;
        }

        // ============================================
        // 1️⃣ AM SUBMITS → Notify FINANCE + Notify AM (Confirmation)
        // ============================================
        public Applicant createApplicant(ApplicantRequest request) {
                if (request.getEmail() != null) {
                        com.register.example.util.EmailValidator.validate(request.getEmail());
                }

                validateUniqueEmailAndPhone(request.getEmail(), request.getPhone());

                // Resolve tenantId first
                String tenantId = null;
                Employee am = null;
                if (request.getAmId() != null && !request.getAmId().isEmpty()) {
                    am = employeeRepository.findByEmployeeId(request.getAmId())
                            .orElse(null);
                }
                if (am != null) {
                    tenantId = am.getTenantId();
                }
                if (tenantId == null || tenantId.isEmpty()) {
                    tenantId = getCurrentUserTenantId();
                }

                String applicantId = generateApplicantId(tenantId);

                Applicant applicant = new Applicant();
                applicant.setApplicantId(applicantId);
                applicant.setFirstName(request.getFirstName());
                applicant.setLastName(request.getLastName());
                applicant.setEmail(request.getEmail());
                applicant.setPhone(request.getPhone());
                applicant.setPosition(request.getPosition());
                applicant.setClient(request.getClient());
                applicant.setResumeName(request.getResumeName());
                applicant.setBase64Resume(request.getBase64Resume());
                applicant.setAmId(request.getAmId());

                // 2. Automatically assign Finance & HR from AM's profile if not provided
                // am was already fetched above
                
                // If AM not found, use default values or leave null
                String financeId = (request.getFinanceId() != null && !request.getFinanceId().isEmpty()) 
                                   ? request.getFinanceId() : (am != null ? am.getAssignedFinanceId() : null);
                String hrId = (am != null) ? am.getAssignedHrId() : null;

                applicant.setFinanceId(financeId);
                applicant.setHrId(hrId);
                applicant.setTenantId(tenantId);

                applicant.setStatus("Initiated");
                 applicant.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"))
                                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

                Applicant saved = applicantRepository.save(applicant);

                // --- 1. NOTIFY FINANCE (Only if assigned) ---
                if (financeId != null && !financeId.isEmpty()) {
                    String financeMessage = "New applicant (" + applicantId + ") submitted by AM for your approval.";
                    sendNotification(financeId, financeMessage);

                    employeeRepository.findByEmployeeId(financeId)
                                    .ifPresent(fin -> emailService.sendEmail(
                                                    fin.getEmail(),
                                                    "New Applicant Submitted",
                                                    financeMessage));
                }

                return saved;
        }

        private void validateUniqueEmailAndPhone(String email, String phone) {
                // 1. Check for existing APPLICANT
                if (applicantRepository.existsByEmail(email)) {
                        throw new RuntimeException("Applicant already exists with email: " + email);
                }
                if (applicantRepository.existsByPhone(phone)) {
                        throw new RuntimeException("Applicant already exists with phone: " + phone);
                }

                // 2. Check for existing EMPLOYEE (Rehire scenario)
                if (employeeRepository.existsByEmail(email)) {
                        throw new RuntimeException("Employee already exists with email: " + email);
                }
                if (employeeRepository.existsByPersonalMail(email)) {
                        throw new RuntimeException(
                                        "Employee already exists with personal email: " + email);
                }
                if (employeeRepository.existsByContactNo(phone)) {
                        throw new RuntimeException("Employee already exists with phone: " + phone);
                }
        }

        private String getCurrentUserTenantId() {
                try {
                        Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
                        if (tenantIdAttr != null) {
                                return tenantIdAttr.toString();
                        }
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth != null && auth.getPrincipal() != null) {
                                String employeeId = auth.getPrincipal().toString();
                                Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                                if (empOpt.isPresent()) {
                                        return empOpt.get().getTenantId();
                                }
                        }
                } catch (Exception e) {
                        // Safe fallback
                }
                return null;
        }

        // =====================================
        // Get all applicants
        // =====================================
        public List<Applicant> getAllApplicants() {
                String tenantId = getCurrentUserTenantId();
                if (tenantId != null && !tenantId.isEmpty()) {
                        return applicantRepository.findAll().stream()
                                .filter(a -> tenantId.equals(a.getTenantId()))
                                .collect(java.util.stream.Collectors.toList());
                }
                return applicantRepository.findAll();
        }

        // ============================================
        // 2️⃣ Finance Approves → Notify HR + Email
        // ============================================
        public Applicant approveCandidate(ApplicantRequest request) {

                Applicant applicant = applicantRepository.findByApplicantId(request.getApplicantId())
                                .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

                applicant.setFixedCtc(request.getProposedCtc());
                applicant.setFinanceId(request.getFinanceId());
                applicant.setApprovedLocation(request.getWorkLocation());
                applicant.setApprovedDoj(request.getDoj());
                applicant.setApprovalNotes(request.getNotes());
                applicant.setVariablePay(request.getVariablePay());
                applicant.setDesignation(request.getDesignation());
                applicant.setNoticePeriod(request.getNoticePeriod());
                applicant.setStatus("CTC Approval In Progress");

                try {
                        ObjectMapper mapper = new ObjectMapper();
                        applicant.setVerificationStatus(
                                        mapper.writeValueAsString(request.getVerificationStatus()));
                } catch (Exception e) {
                        throw new RuntimeException("Failed to convert verificationStatus to JSON");
                }

                Applicant saved = applicantRepository.save(applicant);

                String message = "AM approved applicant " + applicant.getApplicantId() + ". Pending your review.";

                // --- 2. NOTIFY FINANCE ---
                String financeMessage = "AM approved applicant " + applicant.getApplicantId()
                                + ". Please review for CTC approval.";
                sendNotification(request.getFinanceId(), financeMessage);

                employeeRepository.findByEmployeeId(request.getFinanceId())
                                .ifPresent(fin -> emailService.sendEmail(
                                                fin.getEmail(),
                                                "Applicant Approved by AM - Pending CTC Approval",
                                                financeMessage));

                // In-app
                sendNotification(applicant.getHrId(), message);

                // 📧 Email to HR (Added)
                employeeRepository.findByEmployeeId(applicant.getHrId())
                                .ifPresent(hr -> emailService.sendEmail(
                                                hr.getEmail(),
                                                "Applicant Ready for HR Review",
                                                message));

                return saved;
        }

        // ============================================
        // 3️⃣ Finance Rejects → Notify AM + Email
        // ============================================
        public Applicant markRevisionPending(String applicantId, String revisionReason) {

                Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                                .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

                applicant.setStatus("Revision Pending by AM");
                applicant.setRevisionReason(revisionReason);

                Applicant saved = applicantRepository.save(applicant);

                String message = "Finance rejected applicant " + applicantId + ". Reason: " + revisionReason;

                sendNotification(applicant.getAmId(), message);

                // 📧 Email to AM (Added)
                employeeRepository.findByEmployeeId(applicant.getAmId())
                                .ifPresent(am -> emailService.sendEmail(
                                                am.getEmail(),
                                                "Applicant Rejected by Finance",
                                                message));

                return saved;
        }

        public Applicant submitApplicantDetails(ApplicantRequest request) {
                Applicant applicant = applicantRepository.findByApplicantId(request.getApplicantId())
                                .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

                // update applicant-filled fields
                applicant.setFirstName(request.getFirstName());
                applicant.setLastName(request.getLastName());
                applicant.setPhone(request.getPhone());
                applicant.setResumeName(request.getResumeName());
                applicant.setBase64Resume(request.getBase64Resume());
                applicant.setStatus("Applicant Submitted");

                Applicant saved = applicantRepository.save(applicant);

                // 🔔 Notify AM
                String message = "Applicant has submitted the form. Applicant ID: " + applicant.getApplicantId();
                sendNotification(applicant.getAmId(), message);

                // 📧 Email to AM
                employeeRepository.findByEmployeeId(applicant.getAmId())
                                .ifPresent(am -> emailService.sendEmail(
                                                am.getEmail(),
                                                "Applicant Form Submitted",
                                                message));

                return saved;
        }

        // ============================================
        // 4️⃣ HR Approves → Notify AM + Email
        // ============================================
        public Applicant approveByFinance(String applicantId) {

                Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                                .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

                applicant.setStatus("Offer Generation In Progress");

                Applicant saved = applicantRepository.save(applicant);

                String message = "Finance approved applicant " + applicantId + ". Offer letter is being generated.";

                sendNotification(applicant.getAmId(), message);

                // 📧 Email to AM (Added)
                employeeRepository.findByEmployeeId(applicant.getAmId())
                                .ifPresent(am -> emailService.sendEmail(
                                                am.getEmail(),
                                                "Applicant Approved by HR",
                                                message));

                return saved;
        }

        // ============================================
        // 5️⃣ HR Rejects → Notify AM + Email
        // ============================================
        public Applicant rejectByHr(String applicantId, String reason, String hrId) {

                Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                                .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

                applicant.setStatus("Rejected by HR");
                applicant.setRevisionReason(reason);

                Applicant saved = applicantRepository.save(applicant);

                String message = "HR rejected applicant " + applicantId + ". Reason: " + reason;

                sendNotification(applicant.getAmId(), message);

                // 📧 Email to AM (Added)
                employeeRepository.findByEmployeeId(applicant.getAmId())
                                .ifPresent(am -> emailService.sendEmail(
                                                am.getEmail(),
                                                "Applicant Rejected by HR",
                                                message));

                return saved;
        }

        // =====================================
        // Candidate ACCEPT / DECLINE → Notify AM + Email
        // =====================================
        public Applicant updateApplicantStatus(String applicantId, String status, String reason) {

                Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                                .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

                applicant.setStatus(status);

                // DROPPED BY AM
                if ("Dropped".equalsIgnoreCase(status)) {

                        applicant.setDropReason(reason);

                        String hrId = applicant.getHrId();
                        String amId = applicant.getAmId();

                        String message = "Applicant " + applicantId + " has been DROPPED by AM. Reason: " + reason;

                        // 🔔 Notify HR
                        if (hrId != null) {
                                sendNotification(hrId, message);

                                // 📧 Email to HR
                                employeeRepository.findByEmployeeId(hrId)
                                                .ifPresent(hr -> emailService.sendEmail(
                                                                hr.getEmail(),
                                                                "Applicant Dropped",
                                                                message));
                        }

                        // 🔔 Notify AM (self confirmation)
                        if (amId != null) {
                                sendNotification(amId, "You have dropped applicant " + applicantId);
                        }
                }

                Applicant saved = applicantRepository.save(applicant);

                // ACCEPT
                if ("Accepted".equalsIgnoreCase(status)) {
                        String message = "Candidate has ACCEPTED the offer for Applicant ID: " + applicantId;

                        sendNotification(applicant.getAmId(), message);

                        // 📧 Email to AM
                        employeeRepository.findByEmployeeId(applicant.getAmId())
                                        .ifPresent(am -> emailService.sendEmail(
                                                        am.getEmail(),
                                                        "Candidate Accepted Offer",
                                                        message));
                }

                // DECLINE
                if ("Declined".equalsIgnoreCase(status)) {

                        String message = "Candidate has DECLINED the offer for Applicant ID: " + applicantId
                                        + ". Please review and take action.";

                        sendNotification(applicant.getAmId(), message);

                        // 📧 Email to AM
                        employeeRepository.findByEmployeeId(applicant.getAmId())
                                        .ifPresent(am -> emailService.sendEmail(
                                                        am.getEmail(),
                                                        "Candidate Declined Offer",
                                                        message));
                }

                // FORM SUBMITTED
                if ("Form Submitted".equalsIgnoreCase(status)) {

                        String message = "Applicant has successfully submitted the pre-onboarding form. Applicant ID: "
                                        + applicantId
                                        + ". Please review the submitted details.";

                        sendNotification(applicant.getAmId(), message);

                        // 📧 Email to AM & Applicant with PDF
                        byte[] pdfBytes = null;
                        try {
                                pdfBytes = pdfService.generatePdf(applicantId);
                        } catch (Exception e) {
                                System.err.println("❌ Failed to generate PDF for applicant " + applicantId + ": "
                                                + e.getMessage());
                                e.printStackTrace();
                        }

                        byte[] finalPdfBytes = pdfBytes;
                        employeeRepository.findByEmployeeId(applicant.getAmId())
                                        .ifPresent(am -> emailService.sendFormSubmissionConfirmationEmail(
                                                         applicant.getEmail(), // Send to Applicant
                                                         applicant.getFirstName() + " " + applicant.getLastName(),
                                                         applicant.getAmId(),
                                                         applicant.getHrId(),
                                                         finalPdfBytes,
                                                         applicant.getTenantId()));
                }

                return saved;
        }

        // =====================================
        // Upload signed documents (NO CHANGE)
        // =====================================
        public String uploadSignedDocuments(
                        String applicantId,
                        MultipartFile offerLetter,
                        MultipartFile appointmentLetter,
                        MultipartFile document3) throws Exception {

                Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                                .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                String baseFolder = "uploads/signed-documents/" + applicantId;
                java.nio.file.Path folderPath = java.nio.file.Paths.get(baseFolder);
                java.nio.file.Files.createDirectories(folderPath);

                java.util.function.BiFunction<MultipartFile, String, String> saveFile = (file, prefix) -> {
                        try {
                                if (file == null || file.isEmpty()) {
                                        return null;
                                }

                                String original = java.nio.file.Paths.get(file.getOriginalFilename())
                                                .getFileName().toString();

                                String timestamp = java.time.LocalDateTime.now()
                                                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

                                String finalName = prefix + "_" + timestamp + "_" + original;
                                java.nio.file.Path target = folderPath.resolve(finalName);

                                java.nio.file.Files.copy(file.getInputStream(), target,
                                                java.nio.file.StandardCopyOption.REPLACE_EXISTING);

                                return finalName;

                        } catch (Exception ex) {
                                throw new RuntimeException("Error saving " + prefix + ": " + ex.getMessage());
                        }
                };

                String savedOffer = saveFile.apply(offerLetter, "signedOffer");
                String savedAppointment = saveFile.apply(appointmentLetter, "signedAppointment");
                String savedDoc3 = saveFile.apply(document3, "document3");

                if (savedOffer != null) {
                        applicant.setSignedOfferLetter(savedOffer);
                        applicant.setStatus("Offer Accepted");
                }
                if (savedAppointment != null) {
                        applicant.setSignedAppointmentLetter(savedAppointment);
                        applicant.setStatus("Accepted");
                }
                if (savedDoc3 != null) {
                        applicant.setSignedDocument3(savedDoc3);
                }

                applicantRepository.save(applicant);
                return applicant.getStatus();
        }

        public List<Applicant> getFilteredApplicants(String position, String client, String status, String startDate,
                        String endDate) {
                String tenantId = getCurrentUserTenantId();
                List<Applicant> all = applicantRepository.findAll();
                return all.stream()
                                .filter(a -> tenantId == null || tenantId.isEmpty() || tenantId.equals(a.getTenantId()))
                                .filter(a -> position == null || position.isEmpty()
                                                || (a.getPosition() != null
                                                                && a.getPosition().equalsIgnoreCase(position)))
                                .filter(a -> client == null || client.isEmpty()
                                                || (a.getClient() != null && a.getClient().equalsIgnoreCase(client)))
                                .filter(a -> status == null || status.isEmpty()
                                                || (a.getStatus() != null && a.getStatus().equalsIgnoreCase(status)))
                                .filter(a -> isWithinDateRange(a.getTimestamp(), startDate, endDate))
                                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                                .collect(java.util.stream.Collectors.toList());
        }

        private boolean isWithinDateRange(String timestamp, String startDate, String endDate) {
                if (timestamp == null) {
                        return false;
                }
                String appDate = timestamp.split(" ")[0]; // "yyyy-MM-dd"
                if (startDate != null && !startDate.isEmpty() && appDate.compareTo(startDate) < 0) {
                        return false;
                }
                if (endDate != null && !endDate.isEmpty() && appDate.compareTo(endDate) > 0) {
                        return false;
                }
                return true;
        }

        public List<String> getDistinctClients() {
                String tenantId = getCurrentUserTenantId();
                if (tenantId != null && !tenantId.isEmpty()) {
                        return applicantRepository.findDistinctClientsByTenant(tenantId);
                }
                return applicantRepository.findDistinctClients();
        }

        public List<String> getDistinctPositions() {
                String tenantId = getCurrentUserTenantId();
                if (tenantId != null && !tenantId.isEmpty()) {
                        return applicantRepository.findDistinctPositionsByTenant(tenantId);
                }
                return applicantRepository.findDistinctPositions();
        }

        public List<String> getDistinctStatuses() {
                String tenantId = getCurrentUserTenantId();
                if (tenantId != null && !tenantId.isEmpty()) {
                        return applicantRepository.findDistinctStatusesByTenant(tenantId);
                }
                return applicantRepository.findDistinctStatuses();
        }
}
