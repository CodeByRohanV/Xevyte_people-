package com.register.example.service;

import com.register.example.entity.ApplicantDocuments;
import com.register.example.repository.ApplicantDocumentsRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.entity.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class ApplicantDocumentsService {

    private final ApplicantDocumentsRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public ApplicantDocumentsService(ApplicantDocumentsRepository repository) {
        this.repository = repository;
    }

    private String getCurrentUserTenantId() {
        try {
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

    // ✅ Save or update documents linked to applicantId
    // ✅ Always create new record — no overwriting
    public ApplicantDocuments uploadDocuments(
            Long applicantId,
            MultipartFile offerLetter,
            MultipartFile appointmentLetter,
            String financeId) throws Exception {

        ApplicantDocuments docs = new ApplicantDocuments();
        docs.setApplicantId(applicantId);
        docs.setFinanceId(financeId); // ✅ SAVE FINANCE ID
        docs.setTenantId(getCurrentUserTenantId()); // ✅ SAVE TENANT ID

        if (offerLetter != null && !offerLetter.isEmpty()) {
            docs.setOfferLetter(offerLetter.getBytes());
            docs.setOfferLetterFileName(offerLetter.getOriginalFilename());
            docs.setOfferLetterContentType(offerLetter.getContentType());
        }

        if (appointmentLetter != null && !appointmentLetter.isEmpty()) {
            docs.setAppointmentLetter(appointmentLetter.getBytes());
            docs.setAppointmentLetterFileName(appointmentLetter.getOriginalFilename());
            docs.setAppointmentLetterContentType(appointmentLetter.getContentType());
        }

        return repository.save(docs);
    }

    // ✅ Return lightweight list without large byte[] fields
    public List<ApplicantDocuments> getAllDocuments() {
        String tenantId = getCurrentUserTenantId();
        return repository.findAll().stream()
                .filter(doc -> tenantId == null || tenantId.isEmpty() || tenantId.equals(doc.getTenantId()))
                .map(doc -> {
                    ApplicantDocuments safeDoc = new ApplicantDocuments();
                    safeDoc.setId(doc.getId());
                    safeDoc.setApplicantId(doc.getApplicantId());
                    safeDoc.setOfferLetterFileName(doc.getOfferLetterFileName());
                    safeDoc.setAppointmentLetterFileName(doc.getAppointmentLetterFileName());
                    safeDoc.setTenantId(doc.getTenantId());
                    return safeDoc;
                }).toList();
    }

    public void deleteDocuments(Long id) {
        repository.deleteById(id);
    }
}
