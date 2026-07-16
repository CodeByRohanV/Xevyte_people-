package com.register.example.service;

import com.register.example.entity.Applicant;
import com.register.example.entity.Employee;
import com.register.example.entity.Payslip;
import com.register.example.repository.ApplicantRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.OnboardingTokenService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmployeeRepository employeeRepo;
    
    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private OnboardingTokenService tokenService;

    @Autowired
    private com.register.example.repository.TenantRepository tenantRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    @Value("${BASE_DOMAIN:hrms.scaloz.com}")
    private String baseDomain;

    public String getTenantFrontendUrl(String tenantId) {
        if (tenantId == null || tenantId.isEmpty()) {
            return frontendUrl;
        }
        return tenantRepository.findByTenantId(tenantId)
                .map(t -> {
                    String subdomain = t.getTenantId();
                    try {
                        java.net.URL url = new java.net.URL(frontendUrl);
                        String protocol = url.getProtocol();
                        String host = url.getHost();
                        int port = url.getPort();
                        String portStr = (port != -1) ? ":" + port : "";

                        if (host.equalsIgnoreCase("localhost") || host.contains(".localhost")) {
                            return protocol + "://" + subdomain + ".localhost" + portStr;
                        } else {
                            // Determine effective base domain
                            String effectiveBase = baseDomain;
                            if (effectiveBase == null || effectiveBase.isEmpty() || effectiveBase.equals("scaloz.com")) {
                                // If baseDomain is default or empty, try to derive from frontendUrl host
                                String[] parts = host.split("\\.");
                                if (parts.length >= 2) {
                                    // Take the last two parts (e.g., xevyte.com or scaloz.com)
                                    effectiveBase = parts[parts.length - 2] + "." + parts[parts.length - 1];
                                } else {
                                    effectiveBase = host;
                                }
                            }
                            // Result: https://subdomain.scaloz.com
                            return protocol + "://" + subdomain + "." + effectiveBase + portStr;
                        }
                    } catch (Exception e) {
                        // Fallback to baseDomain if parsing fails
                        return "https://" + subdomain + "." + baseDomain;
                    }
                })
                .orElse(frontendUrl);
    }

    public EmailService(JavaMailSender mailSender, EmployeeRepository employeeRepo) {
        this.mailSender = mailSender;
        this.employeeRepo = employeeRepo;
    }

    private String formatDate(String dateString) {
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(dateString);
            return date.format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e) {
            System.err.println("⚠️ Unable to format date: " + dateString);
            return dateString;
        }
    }

    @Async
    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Email not sent - recipient address is empty.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Error sending email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendExitInterviewEmail(String to,
            String employeeName,
            String dateTime, // expects: 2026-01-02 00:30:00
            String interviewer,
            String meetingLink,
            String feedbackLink,
            String resolvedCompanyName,
            String resolvedSupportEmail) {

        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Exit interview email not sent - missing recipient email.");
            return;
        }

        try {
            String subject = "Exit Interview Scheduled & Feedback Form - " + employeeName;

            // ✅ FORMAT DATE + TIME → dd-MM-yyyy hh:mm a
            String formattedDateTime = dateTime;
            try {
                java.time.LocalDateTime dt = java.time.LocalDateTime.parse(
                        dateTime,
                        java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")); 

                formattedDateTime = dt.format(
                        java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"));
            } catch (Exception e) {
                System.err.println("⚠️ Date format fallback used for: " + dateTime);
            }

            String body = "Dear " + employeeName + ",\n\n" +
                    "Your exit interview has been scheduled as part of your clearance process.\n\n" +
                    "📅 Date & Time: " + formattedDateTime + "\n" +
                    "👤 Interviewer: " + interviewer + "\n" +
                    "🔗 Meeting Link: " + meetingLink + "\n\n" +
                    "Before your interview, please complete this digital feedback form:\n" +
                    feedbackLink + "\n\n" +
                    "Thank you for your time and cooperation.\n\n" +
                    "Best regards,\n" +
                    "HR Department\n" +
                    resolvedCompanyName;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, resolvedCompanyName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            mailSender.send(message);
            System.out.println("✅ Exit interview email sent successfully to: " + to);

        } catch (Exception e) {
            System.err.println("❌ Failed to send exit interview email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendExitInterviewEmail(Employee employee, String date,
            String interviewer, String meetingLink, String feedbackLink) {

        if (employee == null || employee.getEmail() == null || employee.getEmail().trim().isEmpty()) {
            System.err.println("⚠️ Cannot send email - employee or email missing.");
            return;
        }

        String tenantId = employee.getTenantId();
        com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
        String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
        String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

        sendExitInterviewEmail(
                employee.getEmail(),
                employee.getFirstName() + " " + employee.getLastName(),
                date,
                interviewer,
                meetingLink,
                feedbackLink,
                resolvedCompanyName,
                resolvedSupportEmail);
    }

    // =====================================================================
    // ✅ UPDATED ONBOARDING EMAIL — NOW WITH CC TO AM AND HR (ONLY CHANGE)
    // =====================================================================
    @Async
    public void sendOnboardingInviteEmail(String to, String applicantName, String applicantId,
            String amId, String hrId) {

        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Onboarding email not sent - recipient missing.");
            return;
        }

        try {
            String subject = "Action Required – Complete Your Pre-Onboarding Documentation";

            String secureToken = tokenService.generateTokenForApplicant(applicantId);
            
            String tenantUrl = frontendUrl;
            Optional<Applicant> appOpt = applicantRepository.findByApplicantId(applicantId);
            if (appOpt.isPresent()) {
                tenantUrl = getTenantFrontendUrl(appOpt.get().getTenantId());
            }
            
            String onboardingUrl = tenantUrl + "/onboarding/verify?token=" + secureToken;

            // 🔥 FETCH AM EMAIL
            String amEmail = null;
            if (amId != null && !amId.trim().isEmpty()) {
                amEmail = employeeRepo.findByEmployeeId(amId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            // 🔥 FETCH HR EMAIL
            String hrEmail = null;
            if (hrId != null && !hrId.trim().isEmpty()) {
                hrEmail = employeeRepo.findByEmployeeId(hrId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            // 🔥 CC LIST SAME AS OFFER LETTER LOGIC
            List<String> ccList = new java.util.ArrayList<>();
            if (hrEmail != null && !hrEmail.trim().isEmpty())
                ccList.add(hrEmail);
            if (amEmail != null && !amEmail.trim().isEmpty())
                ccList.add(amEmail);

            String tenantId = null;
            if (appOpt.isPresent()) {
                tenantId = appOpt.get().getTenantId();
            }
            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            // EMAIL BODY (DYNAMIC BRANDING)
            String htmlBody = """
                     <p>Dear %s,</p>

                     <p>Congratulations on your selection with <strong>%s</strong></p>

                     <p>To initiate your onboarding process, please complete your
                     <strong>Pre-Employment Information & Document Submission</strong> using the link below:</p>

                     <p><a href="%s" target="_blank"
                        style="color:blue; font-weight:600; text-decoration:underline;">
                        Click Here
                     </a></p>

                    <p><i>This link will expire within 24 hours. Kindly ensure that you submit the required details before the expiry time.</i></p>


                     <p><i>(This link is unique to you. Do not share it.)</i></p>

                     <p>Warm Regards,<br/>HR Team<br/>%s</p>
                     """
                    .formatted(applicantName, resolvedCompanyName, onboardingUrl, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, resolvedCompanyName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);

            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);

            System.out.printf("✅ Onboarding invite sent to %s (CC: %s)%n",
                    to, ccList.isEmpty() ? "None" : String.join(", ", ccList));

        } catch (Exception e) {
            System.err.println("❌ Failed to send onboarding invite email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // =====================================================================

    @Async
    public void sendReuploadEmail(String to, String name, String applicantId, List<String> documents) {
        try {
            String subject = "Action Required – Re-upload Required for Your Documents";

            String secureToken = tokenService.generateTokenForApplicant(applicantId);
            
            String tenantUrl = frontendUrl;
            Optional<Applicant> appOpt = applicantRepository.findByApplicantId(applicantId);
            if (appOpt.isPresent()) {
                tenantUrl = getTenantFrontendUrl(appOpt.get().getTenantId());
            }
            
            String onboardingUrl = tenantUrl + "/onboarding/verify?token=" + secureToken;

            StringBuilder docList = new StringBuilder();
            for (String d : documents) {
                String cleanName = getReadableDocumentName(d);
                docList.append("<li>").append(cleanName).append("</li>");
            }

            String tenantId = null;
            if (appOpt.isPresent()) {
                tenantId = appOpt.get().getTenantId();
            }
            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String htmlBody = """
                    <p>Dear %s,</p>

                    <p>The following documents require re-upload:</p>
                    <ul>%s</ul>

                    <p>Please upload again:
                        <a href="%s" target="_blank"
                           style="color:blue; font-weight:600; text-decoration:underline;">
                           Click Here
                        </a>
                     <p><i>This link will expire within 24 hours. Kindly ensure that you submit the required details before the expiry time.</i></p>
                     <p>Regards,<br/>HR Team<br/>%s</p>
                     """.formatted(name, docList.toString(), onboardingUrl, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, resolvedCompanyName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Async
    public void sendOfferAndAppointmentEmail(String to,
            String name,
            String designation,
            String doj,
            String location,
            String ctc,
            byte[] offerLetterBytes,
            byte[] appointmentLetterBytes,
            String amId,
            String hrId,
            String tenantId,
            String senderName) {
        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Email not sent - candidate email missing.");
            return;
        }

        try {
            String amEmail = null;
            String hrEmail = null;

            if (amId != null && !amId.trim().isEmpty()) {
                amEmail = employeeRepo.findByEmployeeId(amId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            if (hrId != null && !hrId.trim().isEmpty()) {
                hrEmail = employeeRepo.findByEmployeeId(hrId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            List<String> ccList = new java.util.ArrayList<>();
            if (hrEmail != null && !hrEmail.trim().isEmpty())
                ccList.add(hrEmail);
            if (amEmail != null && !amEmail.trim().isEmpty())
                ccList.add(amEmail);

            String formattedDoj = formatDate(doj);

            String variablePay = null;

            String ctcDisplay;
            boolean hasVariable = variablePay != null &&
                    !variablePay.trim().equals("") &&
                    !variablePay.trim().equals("0");

            if (!hasVariable) {
                ctcDisplay = ctc;
            } else {
                double total = 0;
                try {
                    total = Double.parseDouble(ctc) + Double.parseDouble(variablePay);
                } catch (Exception ignored) {
                }

                ctcDisplay = ctc + " + Variable Pay (" + variablePay + ") = " + total;
            }

            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String subject = "Your Offer & Appointment Letters – " + resolvedCompanyName;

            String htmlBody = """
                    <p>Dear %s,</p>

                    <p>Congratulations!</p>

                    <p>Your Offer Letter and Appointment Letter are attached.</p>

                    <p><b>Designation:</b> %s<br/>
                    <b>DOJ:</b> %s<br/>
                    <b>Location:</b> %s<br/>
                    <b>CTC:</b> %s</p>

                    <p>Regards,<br/>HR Team<br/>%s</p>
                    """.formatted(name, designation, formattedDoj, location, ctcDisplay, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String personalName = resolvedCompanyName;
            if (senderName != null && !senderName.trim().isEmpty()) {
                personalName = senderName.trim() + " (" + resolvedCompanyName + " )";
            }

            try {
                String encodedPersonal = jakarta.mail.internet.MimeUtility.encodeText(personalName, "UTF-8", "B");
                jakarta.mail.internet.InternetAddress fromAddress = new jakarta.mail.internet.InternetAddress(fromEmail);
                fromAddress.setPersonal(encodedPersonal);
                helper.setFrom(fromAddress);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);

            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            helper.addAttachment("Offer_Letter_" + name.replaceAll(" ", "_") + ".docx",
                    new org.springframework.core.io.ByteArrayResource(offerLetterBytes));

            helper.addAttachment("Appointment_Letter_" + name.replaceAll(" ", "_") + ".docx",
                    new org.springframework.core.io.ByteArrayResource(appointmentLetterBytes));

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("❌ Failed to send offer+appointment email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendOfferAndAppointmentEmailPdf(String to,
            String name,
            String designation,
            String doj,
            String location,
            String ctc,
            byte[] offerLetterBytes,
            byte[] appointmentLetterBytes,
            String amId,
            String hrId,
            String tenantId,
            String senderName) {
        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Email not sent - candidate email missing.");
            return;
        }

        try {
            String amEmail = null;
            String hrEmail = null;

            if (amId != null && !amId.trim().isEmpty()) {
                amEmail = employeeRepo.findByEmployeeId(amId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            if (hrId != null && !hrId.trim().isEmpty()) {
                hrEmail = employeeRepo.findByEmployeeId(hrId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            List<String> ccList = new java.util.ArrayList<>();
            if (hrEmail != null && !hrEmail.trim().isEmpty())
                ccList.add(hrEmail);
            if (amEmail != null && !amEmail.trim().isEmpty())
                ccList.add(amEmail);

            String formattedDoj = formatDate(doj);

            String variablePay = null;

            String ctcDisplay;
            boolean hasVariable = variablePay != null &&
                    !variablePay.trim().equals("") &&
                    !variablePay.trim().equals("0");

            if (!hasVariable) {
                ctcDisplay = ctc;
            } else {
                double total = 0;
                try {
                    total = Double.parseDouble(ctc) + Double.parseDouble(variablePay);
                } catch (Exception ignored) {
                }
                ctcDisplay = ctc + " + Variable Pay (" + variablePay + ") = " + total;
            }

            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String subject = "Your Offer & Appointment Letters – " + resolvedCompanyName;

            String htmlBody = """
                    <p>Dear %s,</p>

                    <p>Congratulations!</p>

                    <p>Your Offer Letter and Appointment Letter are attached.</p>

                    <p><b>Designation:</b> %s<br/>
                    <b>DOJ:</b> %s<br/>
                    <b>Location:</b> %s<br/>
                    <b>CTC:</b> %s</p>

                    <p>Regards,<br/>HR Team<br/>%s</p>
                    """.formatted(name, designation, formattedDoj, location, ctcDisplay, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String personalName = resolvedCompanyName;
            if (senderName != null && !senderName.trim().isEmpty()) {
                personalName = senderName.trim() + " (" + resolvedCompanyName + " )";
            }

            try {
                String encodedPersonal = jakarta.mail.internet.MimeUtility.encodeText(personalName, "UTF-8", "B");
                jakarta.mail.internet.InternetAddress fromAddress = new jakarta.mail.internet.InternetAddress(fromEmail);
                fromAddress.setPersonal(encodedPersonal);
                helper.setFrom(fromAddress);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);

            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            helper.addAttachment("Offer_Letter_" + name.replaceAll(" ", "_") + ".pdf",
                    new ByteArrayResource(offerLetterBytes));

            helper.addAttachment("Appointment_Letter_" + name.replaceAll(" ", "_") + ".pdf",
                    new ByteArrayResource(appointmentLetterBytes));

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("❌ Failed to send offer+appointment email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendOfferLetterEmailPdf(String to,
            String name,
            String designation,
            String doj,
            String location,
            String ctc,
            byte[] offerLetterBytes,
            String amId,
            String hrId,
            String tenantId,
            String senderName) {
        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Email not sent - candidate email missing.");
            return;
        }

        try {
            String amEmail = null;
            String hrEmail = null;

            if (amId != null && !amId.trim().isEmpty()) {
                amEmail = employeeRepo.findByEmployeeId(amId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            if (hrId != null && !hrId.trim().isEmpty()) {
                hrEmail = employeeRepo.findByEmployeeId(hrId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            List<String> ccList = new java.util.ArrayList<>();
            if (hrEmail != null && !hrEmail.trim().isEmpty())
                ccList.add(hrEmail);
            if (amEmail != null && !amEmail.trim().isEmpty())
                ccList.add(amEmail);

            String formattedDoj = formatDate(doj);

            String variablePay = null;
            String ctcDisplay = ctc;

            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String subject = "Your Offer Letter – " + resolvedCompanyName;

            String htmlBody = """
                    <p>Dear %s,</p>

                    <p>Congratulations!</p>

                    <p>Your Offer Letter is attached.</p>

                    <p><b>Designation:</b> %s<br/>
                    <b>DOJ:</b> %s<br/>
                    <b>Location:</b> %s<br/>
                    <b>CTC:</b> %s</p>

                    <p>Regards,<br/>HR Team<br/>%s</p>
                    """.formatted(name, designation, formattedDoj, location, ctcDisplay, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String personalName = resolvedCompanyName;
            if (senderName != null && !senderName.trim().isEmpty()) {
                personalName = senderName.trim() + " (" + resolvedCompanyName + " )";
            }

            try {
                String encodedPersonal = jakarta.mail.internet.MimeUtility.encodeText(personalName, "UTF-8", "B");
                jakarta.mail.internet.InternetAddress fromAddress = new jakarta.mail.internet.InternetAddress(fromEmail);
                fromAddress.setPersonal(encodedPersonal);
                helper.setFrom(fromAddress);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);

            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            helper.addAttachment("Offer_Letter_" + name.replaceAll(" ", "_") + ".pdf",
                    new ByteArrayResource(offerLetterBytes));

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("❌ Failed to send offer email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendAppointmentLetterEmailPdf(String to,
            String name,
            String designation,
            String doj,
            String location,
            String ctc,
            byte[] appointmentLetterBytes,
            String amId,
            String hrId,
            String tenantId,
            String senderName) {
        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Email not sent - candidate email missing.");
            return;
        }

        try {
            String amEmail = null;
            String hrEmail = null;

            if (amId != null && !amId.trim().isEmpty()) {
                amEmail = employeeRepo.findByEmployeeId(amId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            if (hrId != null && !hrId.trim().isEmpty()) {
                hrEmail = employeeRepo.findByEmployeeId(hrId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            List<String> ccList = new java.util.ArrayList<>();
            if (hrEmail != null && !hrEmail.trim().isEmpty())
                ccList.add(hrEmail);
            if (amEmail != null && !amEmail.trim().isEmpty())
                ccList.add(amEmail);

            String formattedDoj = formatDate(doj);

            String variablePay = null;
            String ctcDisplay = ctc;

            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String subject = "Your Appointment Letter – " + resolvedCompanyName;

            String htmlBody = """
                    <p>Dear %s,</p>

                    <p>Congratulations!</p>

                    <p>Your Appointment Letter is attached.</p>

                    <p><b>Designation:</b> %s<br/>
                    <b>DOJ:</b> %s<br/>
                    <b>Location:</b> %s<br/>
                    <b>CTC:</b> %s</p>

                    <p>Regards,<br/>HR Team<br/>%s</p>
                    """.formatted(name, designation, formattedDoj, location, ctcDisplay, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String personalName = resolvedCompanyName;
            if (senderName != null && !senderName.trim().isEmpty()) {
                personalName = senderName.trim() + " (" + resolvedCompanyName + " )";
            }

            try {
                String encodedPersonal = jakarta.mail.internet.MimeUtility.encodeText(personalName, "UTF-8", "B");
                jakarta.mail.internet.InternetAddress fromAddress = new jakarta.mail.internet.InternetAddress(fromEmail);
                fromAddress.setPersonal(encodedPersonal);
                helper.setFrom(fromAddress);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);

            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            helper.addAttachment("Appointment_Letter_" + name.replaceAll(" ", "_") + ".pdf",
                    new ByteArrayResource(appointmentLetterBytes));

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("❌ Failed to send appointment email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // =====================================================================
    // ✅ FORM SUBMISSION CONFIRMATION EMAIL (TO APPLICANT, CC: AM & HR)
    // =====================================================================
    @Async
    public void sendFormSubmissionConfirmationEmail(String to, String applicantName,
            String amId, String hrId, byte[] pdfBytes, String tenantId) {

        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Form submission email not sent - recipient missing.");
            return;
        }

        try {
            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String subject = "Pre-Onboarding Form Submitted Successfully – " + resolvedCompanyName;

            // 🔥 FETCH AM EMAIL
            String amEmail = null;
            if (amId != null && !amId.trim().isEmpty()) {
                amEmail = employeeRepo.findByEmployeeId(amId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            // 🔥 FETCH HR EMAIL
            String hrEmail = null;
            if (hrId != null && !hrId.trim().isEmpty()) {
                hrEmail = employeeRepo.findByEmployeeId(hrId)
                        .map(Employee::getEmail)
                        .orElse(null);
            }

            // 🔥 CC LIST
            List<String> ccList = new java.util.ArrayList<>();
            if (hrEmail != null && !hrEmail.trim().isEmpty())
                ccList.add(hrEmail);
            if (amEmail != null && !amEmail.trim().isEmpty())
                ccList.add(amEmail);

            // EMAIL BODY
            String htmlBody = """
                    <p>Dear %s,</p>

                    <p>Thank you for completing and submitting your <strong>Pre-Onboarding Documentation Form</strong>.</p>

                    <p>Your submission has been received successfully and is now under review by our HR team.</p>

                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Our team will verify all the documents and information you provided</li>
                        <li>If any document requires re-upload, you will receive a notification email with specific instructions</li>
                        <li>Once verified, we will proceed with the next steps of your onboarding process</li>
                    </ul>

                    <p>If you have any questions or concerns, please feel free to reach out to the HR team.</p>

                    <p>We look forward to welcoming you to <strong>%s</strong></p>

                    <p>Warm Regards,<br/>HR Team<br/>%s</p>

                    <p style="font-size: 10px; color: #888;">
                    <i>Note: This is an automated confirmation email. Please find the attached summary of your submission.</i>
                    </p>
                    """
                    .formatted(applicantName, resolvedCompanyName, resolvedCompanyName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, resolvedCompanyName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(to);

            if (!ccList.isEmpty()) {
                helper.setCc(ccList.toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            // ✅ ATTACH PDF
            if (pdfBytes != null && pdfBytes.length > 0) {
                ByteArrayDataSource pdfDataSource = new ByteArrayDataSource(pdfBytes, "application/pdf");
                helper.addAttachment("PreOnboarding_Summary.pdf", pdfDataSource);
            }

            mailSender.send(message);

            System.out.printf("✅ Form submission confirmation sent to %s (CC: %s)%n",
                    to, ccList.isEmpty() ? "None" : String.join(", ", ccList));

        } catch (Exception e) {
            System.err.println("❌ Failed to send form submission confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // =====================================================
    // ✅ NEW: PAYSLIP EMAIL METHOD (Sends PDF attachment)
    // =====================================================
    @Async
    public void sendPayslipEmail(Payslip payslip, String recipientEmail) throws MessagingException {

        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            System.err.println("⚠️ Payslip email not sent - recipient address is missing or invalid for employee: "
                    + payslip.getEmployeeId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true, // multipart (for attachments)
                    StandardCharsets.UTF_8.name());

            // 1. Basic Info
            String employeeName;

            Optional<Employee> empOpt = employeeRepo.findByEmployeeId(payslip.getEmployeeId());
            if (empOpt.isPresent()) {
                Employee emp = empOpt.get();
                employeeName = emp.getFirstName() + " " + emp.getLastName();
            } else {
                employeeName = payslip.getEmployeeId(); // fallback safety
            }

            String subject = String.format("Salary Slip for %s - %s %d",
                    employeeName, payslip.getSalaryMonth(), payslip.getSalaryYear());

            // Using getDecimal helper from Payslip entity
            String netPayStr = payslip.getDecimal("netPay") != null ? payslip.getDecimal("netPay").toString() : "N/A";

            String tenantId = empOpt.isPresent() ? empOpt.get().getTenantId() : null;
            com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
            String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
            String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

            String htmlBody = String.format(
                    """
                            <p>Dear <b>%s</b>,</p>

                                            <p>Please find your salary slip for the month of <b>%s %d</b> attached to this email.</p>


                            <p>Best regards,<br/>
                                            Payroll Team<br/>
                                            %s</p>
                            <p style="font-size: 10px; color: #888;">
                            <i>Note: This is a system-generated email. Please do not reply.</i>
                            </p>
                                            """,
                    employeeName,
                    payslip.getSalaryMonth(),
                    payslip.getSalaryYear(),
                    resolvedCompanyName);

            try {
                helper.setFrom(fromEmail, resolvedCompanyName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML content

            // 2. Attach the PDF
            if (payslip.getPayslipPdf() != null && payslip.getPayslipPdf().length > 0) {
                ByteArrayDataSource dataSource = new ByteArrayDataSource(
                        payslip.getPayslipPdf(),
                        payslip.getPayslipPdfType() != null ? payslip.getPayslipPdfType() : "application/pdf");

                helper.addAttachment(payslip.getPayslipPdfName(), dataSource);
                System.out.println("✅ Payslip email successfully prepared with attachment for: " + recipientEmail);
            } else {
                System.err.println("⚠️ Payslip PDF data is missing for employee: " + payslip.getEmployeeId());
                // This exception will be caught by the calling service method
                throw new MessagingException("Payslip PDF data is missing.");
            }

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("❌ Error sending payslip email to " + recipientEmail + ": " + e.getMessage());
            e.printStackTrace();
            // Re-throw as MessagingException to be caught by the PayrollService
            throw new MessagingException("Failed to send payslip email: " + e.getMessage());
        }
    }

    @Async
    public void sendEmailWithAttachment(String to, String subject, String body, byte[] attachmentBytes,
            String fileName) {
        if (to == null || to.trim().isEmpty()) {
            System.err.println("⚠️ Email not sent - recipient address is empty.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            if (attachmentBytes != null && attachmentBytes.length > 0) {
                helper.addAttachment(fileName, new ByteArrayResource(attachmentBytes));
            }

            mailSender.send(message);
            System.out.println("✅ Email with attachment sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Error sending email with attachment to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getReadableDocumentName(String key) {

        key = key.toLowerCase(); // normalize

        if (key.contains("passportphoto"))
            return "Passport Photo";

        // Address Proofs
        if (key.contains("presentprooffile"))
            return "Present Address Proof";
        if (key.contains("permanentprooffile"))
            return "Permanent Address Proof";

        // Academic
        if (key.contains("schoolmarksheet"))
            return "School Marksheet";
        if (key.contains("intermediatemarksheet"))
            return "Intermediate Marksheet";
        if (key.contains("ugmarksheet"))
            return "UG Marksheet";
        if (key.contains("ugcertificate"))
            return "UG Certificate";
        if (key.contains("pgmarksheet"))
            return "PG Marksheet";
        if (key.contains("pgcertificate"))
            return "PG Certificate";

        // Identity
        if (key.contains("aadharfile"))
            return "Aadhaar Card";
        if (key.contains("panfile"))
            return "PAN Card";
        if (key.contains("passportfile"))
            return "Passport";
        if (key.contains("voterfile"))
            return "Voter ID";
        if (key.contains("drivingfile"))
            return "Driving License";

        // Work history
        if (key.contains("offerletter"))
            return "Offer Letter";
        if (key.contains("relievingletter"))
            return "Relieving Letter";
        if (key.contains("payslips"))
            return "Payslips";
        if (key.contains("form16"))
            return "Form 16";
        if (key.contains("pfservicehistoryfile"))
            return "PF Service History";

        // Documents
        if (key.contains("resumefile"))
            return "Resume";

        // Default fallback
        return key.substring(key.lastIndexOf(".") + 1); // removes leading 'section.'
    }

}
