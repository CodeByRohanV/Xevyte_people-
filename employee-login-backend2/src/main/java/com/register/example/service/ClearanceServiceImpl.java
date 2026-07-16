package com.register.example.service;
//
import com.register.example.entity.Clearance;
import com.register.example.entity.Resignation;
import com.register.example.payload.ClearanceDto;
import com.register.example.repository.ClearanceRepository;
import com.register.example.repository.ResignationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
//
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
//
@Service
@Transactional
public class ClearanceServiceImpl implements ClearanceService {
//
    private final ClearanceRepository clearanceRepository;
    private final ResignationRepository resignationRepository;
    private final FileStorageService fileStorageService;
    private final ResignationService resignationService;
//
    private final DateTimeFormatter INPUT_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");
//
    public ClearanceServiceImpl(
            ClearanceRepository clearanceRepository,
            ResignationRepository resignationRepository,
            FileStorageService fileStorageService,
            ResignationService resignationService) {
        this.clearanceRepository = clearanceRepository;
        this.resignationRepository = resignationRepository;
        this.fileStorageService = fileStorageService;
        this.resignationService = resignationService;
    }
//
    @Override
    public Clearance createOrUpdateClearance(
            Long resignationId,
            ClearanceDto dto,
            MultipartFile hrFile,
            MultipartFile adminFile,
            String actorId) {
//
        Resignation resignation = resignationRepository.findById(resignationId)
                .orElseThrow(() -> new IllegalArgumentException("Resignation not found with id: " + resignationId));
//
        Clearance clearance = clearanceRepository.findByResignationId(resignationId)
                .orElse(new Clearance());
//
        clearance.setResignation(resignation);
//
        // MAP DTO FIELDS
        clearance.setLaptopSerial(dto.getLaptopSerial());
        clearance.setAccessCard(dto.getAccessCard());
        clearance.setEmailClosed(dto.getEmailClosed());
        clearance.setVpnRevoked(dto.getVpnRevoked());
        clearance.setSoftwareDeallocated(dto.getSoftwareDeallocated());
        clearance.setIdCardReturned(dto.getIdCardReturned());
//
        clearance.setAccessCardComment(dto.getAccessCardComment());
        clearance.setEmailClosedComment(dto.getEmailClosedComment());
        clearance.setVpnRevokedComment(dto.getVpnRevokedComment());
        clearance.setSoftwareDeallocatedComment(dto.getSoftwareDeallocatedComment());
        clearance.setIdCardReturnedComment(dto.getIdCardReturnedComment());
//
        clearance.setExitInterviewCompleted(dto.getExitInterviewCompleted());
        clearance.setDocumentHandover(dto.getDocumentHandover());
        clearance.setKnowledgeTransfer(dto.getKnowledgeTransfer());
        clearance.setTimesheetFilled(dto.getTimesheetFilled());
        clearance.setInsuranceDeactivation(dto.getInsuranceDeactivation());
        clearance.setHrFinalApproval(dto.getHrFinalApproval());
//
        clearance.setExitInterviewComment(dto.getExitInterviewComment());
        clearance.setDocumentHandoverComment(dto.getDocumentHandoverComment());
        clearance.setKnowledgeTransferComment(dto.getKnowledgeTransferComment());
        clearance.setTimesheetFilledComment(dto.getTimesheetFilledComment());
        clearance.setInsuranceDeactivationComment(dto.getInsuranceDeactivationComment());
//
        clearance.setHrComments(dto.getHrComments());
        clearance.setAdminComments(dto.getAdminComments());
//
        if (dto.getLastWorkingDay() != null && !dto.getLastWorkingDay().trim().isEmpty()) {
            LocalDate parsed = LocalDate.parse(dto.getLastWorkingDay(), INPUT_FORMATTER);
            clearance.setLastWorkingDay(parsed);
        }
//
        // SAVE HR DOCUMENT
        if (hrFile != null && !hrFile.isEmpty()) {
            String hrPath = fileStorageService.storeHrFile(hrFile, resignationId);
            clearance.setHrDocumentPath(hrPath);
        }
//
        // SAVE ADMIN DOCUMENT
        if (adminFile != null && !adminFile.isEmpty()) {
            String adminPath = fileStorageService.storeAdminFile(adminFile, resignationId);
            clearance.setAdminDocumentPath(adminPath);
        }
//
        // UPDATE STATUS & FLAGS AUTOMATICALLY ONLY IF IS_FINAL is TRUE
        if (Boolean.TRUE.equals(dto.getIsFinal())) {
            String role = dto.getActingRole();
            if (role != null) {
                resignationService.markClearanceComplete(resignationId, role.toUpperCase(), true, actorId);
            }
        }
//
        return clearanceRepository.save(clearance);
    }
//
    @Override
    @Transactional(readOnly = true)
    public Optional<Clearance> getByResignationId(Long resignationId) {
        return clearanceRepository.findByResignationId(resignationId);
    }
}
