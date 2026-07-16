package com.register.example.controller;

import com.register.example.entity.*;
import com.register.example.payload.PreOnboardingRequest;
import com.register.example.repository.*;
import com.register.example.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;


import java.time.LocalDate;
import java.util.*;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/preonboarding")
public class PreOnboardingController {

    private static final String CONST_APPLICANT_NOT_FOUND = "Applicant not found";
    private static final String CONST_EXISTS = "EXISTS";
    private static final String CONST_PERSONAL = "personal";
    private static final String CONST_ADDRESS = "address";
    private static final String CONST_ACADEMIC = "academic";
    private static final String CONST_DOCUMENTS = "documents";
    private static final String CONST_WORK_HISTORY = "workHistory";
    private static final String CONST_ENTRIES = " entries";
    private static final String CONST_PREONBOARDING = "PREONBOARDING";
    private static final String CONST_PREONBOARDING_DATA = "PreOnboardingData";
    private static final String CONST_APPLICANT = "APPLICANT";
    private static final String CONST_BASE64 = "base64";
    private static final String CONST_FILE_NAME = "fileName";
    private static final String CONST_SYSTEM = "SYSTEM";
    private static final String CONST_SUGGEST_WORK_EMAIL = "SUGGEST_WORK_EMAIL";
    private static final String CONST_WORK_EMAIL_SUGGESTION = "WorkEmailSuggestion";

    @Autowired @Lazy private PreOnboardingController self;

    @Autowired private ApplicantRepository applicantRepository;
    @Autowired private PreOnboardingPersonalRepository personalRepo;
    @Autowired private PreOnboardingAddressRepository addressRepo;
    @Autowired private PreOnboardingAcademicRepository academicRepo;
    @Autowired private PreOnboardingDocumentRepository documentRepo;
    @Autowired private PreOnboardingWorkHistoryRepository workRepo;
    
    @Autowired private EmployeeRepository employeeRepo;
    @Autowired private AuditService auditService;
    @Autowired private TenantRepository tenantRepository;


    private String trim(String s, int len){
        if (s == null) return null;
        return s.length() > len ? s.substring(0, len) : s;
    }

    private byte[] b64(String b){
        try { return b == null ? null : Base64.getDecoder().decode(b); }
        catch(Exception e){ return null; }
    }

    private LocalDate date(String iso){
        try { return (iso == null || iso.isBlank()) ? null : LocalDate.parse(iso); }
        catch(Exception e){ return null; }
    }

    // ============================================================
    // SAVE
    // ============================================================
    private void savePersonalDetails(String applicantId, PreOnboardingRequest.Personal pv) {
        PreOnboardingPersonalDetails p = personalRepo.findByApplicantId(applicantId)
                .orElseGet(PreOnboardingPersonalDetails::new);
        p.setApplicantId(applicantId);
        if (pv != null){
            p.setFirstName(trim(pv.getFirstName(),150));
            p.setLastName(trim(pv.getLastName(),150));
            p.setGender(trim(pv.getGender(),30));
            p.setDateOfBirth(date(pv.getDateOfBirth()));
            p.setPersonalEmail(trim(pv.getPersonalEmail(),200));
            p.setMobileNumber(trim(pv.getMobileNumber(),30));
            p.setAlternateMobileNumber(trim(pv.getAlternateMobileNumber(),30));
            p.setBloodGroup(trim(pv.getBloodGroup(),20));
            p.setFatherName(trim(pv.getFatherName(),150));
            p.setMotherName(trim(pv.getMotherName(),150));
            p.setMaritalStatus(trim(pv.getMaritalStatus(),30));
            p.setWorkEmail(trim(pv.getWorkEmail(),150));
            if (pv.getPassportPhoto() != null){
                p.setPassportPhoto(b64(pv.getPassportPhoto().getBase64()));
                p.setPassportPhotoName(trim(pv.getPassportPhoto().getFileName(), 150));
            }
            p.setEmergencyContactName(trim(pv.getEmergencyContactName(),150));
            p.setEmergencyContactRelationship(trim(pv.getEmergencyContactRelationship(),60));
            p.setEmergencyContactNumber(trim(pv.getEmergencyContactNumber(),30));
        }
        personalRepo.save(p);
    }

    private void populateAddressBlock(PreOnboardingAddressDetails ad, PreOnboardingRequest.Address.Block b, boolean isPermanent) {
        if (b == null) return;
        if (!isPermanent) {
            ad.setPresentAddressLine(trim(b.getAddressLine(),50));
            ad.setPresentCity(trim(b.getCity(),50));
            ad.setPresentState(trim(b.getState(),50));
            ad.setPresentPincode(trim(b.getPincode(),50));
            ad.setPresentLandmark(trim(b.getLandmark(),50));
            ad.setPresentNearestPoliceStation(trim(b.getNearestPoliceStation(),50));
            ad.setPresentContactPersonName(trim(b.getContactPersonName(),50));
            ad.setPresentContactPersonRelationship(trim(b.getContactPersonRelationship(),50));
            ad.setPresentContactPersonMobile(trim(b.getContactPersonMobile(),50));
            ad.setPresentDurationOfStay(trim(b.getDurationOfStay(),50));
        } else {
            ad.setPermanentAddressLine(trim(b.getAddressLine(),50));
            ad.setPermanentCity(trim(b.getCity(),50));
            ad.setPermanentState(trim(b.getState(),50));
            ad.setPermanentPincode(trim(b.getPincode(),50)); 
            ad.setPermanentLandmark(trim(b.getLandmark(),50));
            ad.setPermanentNearestPoliceStation(trim(b.getNearestPoliceStation(),50));
            ad.setPermanentContactPersonName(trim(b.getContactPersonName(),50));
            ad.setPermanentContactPersonRelationship(trim(b.getContactPersonRelationship(),50));
            ad.setPermanentContactPersonMobile(trim(b.getContactPersonMobile(),50));
            ad.setPermanentDurationOfStay(trim(b.getDurationOfStay(),50));
        }
    }

    private void saveAddressDetails(String applicantId, PreOnboardingRequest.Address a, Boolean sameAsPresent) {
        PreOnboardingAddressDetails ad = addressRepo.findByApplicantId(applicantId)
                .orElseGet(PreOnboardingAddressDetails::new);
        ad.setApplicantId(applicantId);
        if (a != null){
            ad.setSameAsPresent(sameAsPresent);
            populateAddressBlock(ad, a.getPresent(), false);
            populateAddressBlock(ad, a.getPermanent(), true);

            if (a.getPresentProofFile() != null) {
                ad.setPresentAddressProof(b64(a.getPresentProofFile().getBase64()));
                ad.setPresentAddressProofName(trim(a.getPresentProofFile().getFileName(),100));
                ad.setPresentAddressProofType(trim(a.getPresentProofFile().getFileType(),50));
            }

            if (a.getPermanentProofFile() != null) {
                ad.setPermanentAddressProof(b64(a.getPermanentProofFile().getBase64()));
                ad.setPermanentAddressProofName(trim(a.getPermanentProofFile().getFileName(),100));
                ad.setPermanentAddressProofType(trim(a.getPermanentProofFile().getFileType(),50));
            }
        }
        addressRepo.save(ad);
    }

    private void saveAcademicDetails(String applicantId, PreOnboardingRequest.Academic av) {
        PreOnboardingAcademicDetails ac = academicRepo.findByApplicantId(applicantId)
                .orElseGet(PreOnboardingAcademicDetails::new);
        ac.setApplicantId(applicantId);
        if (av != null){ 
            ac.setSchoolName(trim(av.getSchoolName(),200));
            ac.setSchoolBoard(trim(av.getSchoolBoard(),100));
            ac.setSchoolYearOfPassing(trim(av.getSchoolYearOfPassing(),10));
            ac.setSchoolCgpaPercentage(trim(av.getSchoolCgpaPercentage(),20));

            if (av.getSchoolMarksheet()!=null){
                ac.setSchoolMarksheet(b64(av.getSchoolMarksheet().getBase64()));
                ac.setSchoolMarksheetName(trim(av.getSchoolMarksheet().getFileName(),100));
                ac.setSchoolMarksheetType(trim(av.getSchoolMarksheet().getFileType(),50));
            }

            ac.setIntermediateCollegeName(trim(av.getIntermediateCollegeName(),150));
            ac.setIntermediateBoard(trim(av.getIntermediateBoard(),100));
            ac.setIntermediateYearOfPassing(trim(av.getIntermediateYearOfPassing(),10));
            ac.setIntermediateCgpaPercentage(trim(av.getIntermediateCgpaPercentage(),20));

            if (av.getIntermediateMarksheet()!=null){
                ac.setIntermediateMarksheet(b64(av.getIntermediateMarksheet().getBase64()));
                ac.setIntermediateMarksheetName(trim(av.getIntermediateMarksheet().getFileName(),100));
                ac.setIntermediateMarksheetType(trim(av.getIntermediateMarksheet().getFileType(),50));
            }

            ac.setUgDegreeType(trim(av.getUgDegreeType(),50));
            ac.setUgCourse(trim(av.getUgCourse(),100));
            ac.setUgCollegeName(trim(av.getUgCollegeName(),150));
            ac.setUgUniversity(trim(av.getUgUniversity(),100));
            ac.setUgLocation(trim(av.getUgLocation(),150));
            ac.setUgStudyType(trim(av.getUgStudyType(),20));
            ac.setUgYearOfPassing(trim(av.getUgYearOfPassing(),10));
            ac.setUgRegistrationNumber(trim(av.getUgRegistrationNumber(),50));

            if (av.getUgMarksheet()!=null){
                ac.setUgMarksheet(b64(av.getUgMarksheet().getBase64()));
                ac.setUgMarksheetName(trim(av.getUgMarksheet().getFileName(),100));
                ac.setUgMarksheetType(trim(av.getUgMarksheet().getFileType(),50));
            }

            if (av.getUgCertificate()!=null){
                ac.setUgCertificate(b64(av.getUgCertificate().getBase64()));
                ac.setUgCertificateName(trim(av.getUgCertificate().getFileName(),100));
                ac.setUgCertificateType(trim(av.getUgCertificate().getFileType(),50));
            }

            ac.setPgDegreeType(trim(av.getPgDegreeType(),50));
            ac.setPgCourse(trim(av.getPgCourse(),100));
            ac.setPgCollegeName(trim(av.getPgCollegeName(),150));
            ac.setPgUniversity(trim(av.getPgUniversity(),100));
            ac.setPgLocation(trim(av.getPgLocation(),150));
            ac.setPgStudyType(trim(av.getPgStudyType(),20));
            ac.setPgYearOfPassing(trim(av.getPgYearOfPassing(),10));
            ac.setPgRegistrationNumber(trim(av.getPgRegistrationNumber(),50));

            if (av.getPgMarksheet()!=null){
                ac.setPgMarksheet(b64(av.getPgMarksheet().getBase64()));
                ac.setPgMarksheetName(trim(av.getPgMarksheet().getFileName(),100));
                ac.setPgMarksheetType(trim(av.getPgMarksheet().getFileType(),50));
            }

            if (av.getPgCertificate()!=null){
                ac.setPgCertificate(b64(av.getPgCertificate().getBase64()));
                ac.setPgCertificateName(trim(av.getPgCertificate().getFileName(),100));
                ac.setPgCertificateType(trim(av.getPgCertificate().getFileType(),50));
            }
        }
        academicRepo.save(ac);
    }

    private void saveIdentityDetails(String applicantId, PreOnboardingRequest.Identity ids) {
        PreOnboardingDocumentDetails idd = documentRepo.findByApplicantId(applicantId)
                .orElseGet(PreOnboardingDocumentDetails::new);
        idd.setApplicantId(applicantId);
        if (ids != null){
            idd.setAadharNumber(trim(ids.getAadharNumber(),20));
            if (ids.getAadharFile()!=null){
                idd.setAadharFile(b64(ids.getAadharFile().getBase64()));
                idd.setAadharFileName(trim(ids.getAadharFile().getFileName(),100));
                idd.setAadharFileType(trim(ids.getAadharFile().getFileType(),50));
            }

            idd.setPanNumber(trim(ids.getPanNumber(),20));
            if (ids.getPanFile()!=null){
                idd.setPanFile(b64(ids.getPanFile().getBase64()));
                idd.setPanFileName(trim(ids.getPanFile().getFileName(),100));
                idd.setPanFileType(trim(ids.getPanFile().getFileType(),50));
            }

            idd.setPassportNumber(trim(ids.getPassportNumber(),20));
            if (ids.getPassportFile()!=null){
                idd.setPassportFile(b64(ids.getPassportFile().getBase64()));
                idd.setPassportFileName(trim(ids.getPassportFile().getFileName(),100));
                idd.setPassportFileType(trim(ids.getPassportFile().getFileType(),50));
            }

            idd.setVoterNumber(trim(ids.getVoterNumber(),20));
            if (ids.getVoterFile()!=null){
                idd.setVoterFile(b64(ids.getVoterFile().getBase64()));
                idd.setVoterFileName(trim(ids.getVoterFile().getFileName(),100));
                idd.setVoterFileType(trim(ids.getVoterFile().getFileType(),50));
            }

            idd.setDrivingNumber(trim(ids.getDrivingNumber(),20));
            if (ids.getDrivingFile()!=null){
                idd.setDrivingFile(b64(ids.getDrivingFile().getBase64()));
                idd.setDrivingFileName(trim(ids.getDrivingFile().getFileName(),100));
                idd.setDrivingFileType(trim(ids.getDrivingFile().getFileType(),50));
            }

            idd.setUtilityNumber(trim(ids.getUtilityNumber(),20));
            if (ids.getUtilityFile()!=null){
                idd.setUtilityFile(b64(ids.getUtilityFile().getBase64()));
                idd.setUtilityFileName(trim(ids.getUtilityFile().getFileName(),100));
                idd.setUtilityFileType(trim(ids.getUtilityFile().getFileType(),50));
            }
        }
        documentRepo.save(idd);
    }

    private void populateWorkEntryDocuments(PreOnboardingWorkHistory wh, PreOnboardingRequest.WorkEntry wv) {
        if (wv.getOfferLetter() != null) {
            wh.setOfferLetter(b64(wv.getOfferLetter().getBase64()));
            wh.setOfferLetterName(trim(wv.getOfferLetter().getFileName(), 150));
            wh.setOfferLetterType(trim(wv.getOfferLetter().getFileType(), 50));
        }

        if (wv.getRelievingLetter() != null) {
            wh.setRelievingLetter(b64(wv.getRelievingLetter().getBase64()));
            wh.setRelievingLetterName(trim(wv.getRelievingLetter().getFileName(), 150));
            wh.setRelievingLetterType(trim(wv.getRelievingLetter().getFileType(), 50));
        }

        if (wv.getPayslips() != null) {
            wh.setPayslips(b64(wv.getPayslips().getBase64()));
            wh.setPayslipsName(trim(wv.getPayslips().getFileName(), 150));
            wh.setPayslipsType(trim(wv.getPayslips().getFileType(), 50));
        }

        if (wv.getForm16() != null) {
            wh.setForm16(b64(wv.getForm16().getBase64()));
            wh.setForm16Name(trim(wv.getForm16().getFileName(), 150));
            wh.setForm16Type(trim(wv.getForm16().getFileType(), 50));
        }

        if (wv.getPfServiceHistoryFile() != null) {
            wh.setPfServiceHistory(b64(wv.getPfServiceHistoryFile().getBase64()));
            wh.setPfServiceHistoryName(trim(wv.getPfServiceHistoryFile().getFileName(), 150));
            wh.setPfServiceHistoryType(trim(wv.getPfServiceHistoryFile().getFileType(), 50));
        }
    }

    private void saveWorkHistory(String applicantId, List<PreOnboardingRequest.WorkEntry> workHistory) {
        workRepo.deleteByApplicantId(applicantId);
        if (workHistory != null){
            for (var wv : workHistory){
                PreOnboardingWorkHistory wh = new PreOnboardingWorkHistory();
                wh.setApplicantId(applicantId);
                wh.setCompanyName(trim(wv.getCompanyName(),200));
                wh.setOfficeLocation(trim(wv.getOfficeLocation(),200));
                wh.setDesignation(trim(wv.getDesignation(),150));
                wh.setDateOfJoining(date(wv.getDateOfJoining()));
                wh.setDateOfRelieving(date(wv.getDateOfRelieving()));
                wh.setEmployeeId(trim(wv.getEmployeeId(),50));
                wh.setSalaryDrawn(trim(wv.getSalaryDrawn(),100));
                wh.setReportingManagerName(trim(wv.getReportingManagerName(),150));
                wh.setReportingManagerEmail(trim(wv.getReportingManagerEmail(),150));
                wh.setReportingManagerPhone(trim(wv.getReportingManagerPhone(),20));
                wh.setHrManagerName(trim(wv.getHrManagerName(),150));
                wh.setHrManagerEmail(trim(wv.getHrManagerEmail(),150));
                wh.setHrManagerPhone(trim(wv.getHrManagerPhone(),20));
                wh.setReasonForLeaving(trim(wv.getReasonForLeaving(),500));

                populateWorkEntryDocuments(wh, wv);
                workRepo.save(wh);
            }
        }
    }

    private Map<String, Object> getPreOnboardingStatusMap(String applicantId) {
        Map<String, Object> data = new HashMap<>();
        var personal = personalRepo.findByApplicantId(applicantId).orElse(null);
        var address = addressRepo.findByApplicantId(applicantId).orElse(null);
        var academic = academicRepo.findByApplicantId(applicantId).orElse(null);
        var documents = documentRepo.findByApplicantId(applicantId).orElse(null);
        var work = workRepo.findAllByApplicantId(applicantId);
        
        data.put(CONST_PERSONAL, personal != null ? CONST_EXISTS : "NULL");
        data.put(CONST_ADDRESS, address != null ? CONST_EXISTS : "NULL");
        data.put(CONST_ACADEMIC, academic != null ? CONST_EXISTS : "NULL");
        data.put(CONST_DOCUMENTS, documents != null ? CONST_EXISTS : "NULL");
        data.put(CONST_WORK_HISTORY, work.size() + CONST_ENTRIES);
        return data;
    }

    @Transactional
    @PostMapping("/{applicantId}/save")
    public ResponseEntity<String> save(
            @PathVariable String applicantId,
            @RequestBody PreOnboardingRequest req,
            HttpServletRequest request) {

        try {
            Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                    .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

            // Store old data for audit
            Map<String, Object> oldData = getPreOnboardingStatusMap(applicantId);
            
            // Save details
            savePersonalDetails(applicantId, req.getPersonal());
            saveAddressDetails(applicantId, req.getAddress(), req.getSameAsPresent());
            saveAcademicDetails(applicantId, req.getAcademic());
            saveIdentityDetails(applicantId, req.getIdentity());
            saveWorkHistory(applicantId, req.getWorkHistory());

            // ------------------ RESUME IN APPLICANT ------------------
            boolean resumeUpdated = false;
            if (req.getDocuments() != null && req.getDocuments().getResumeFile() != null){
                var f = req.getDocuments().getResumeFile();
                applicant.setBase64Resume(f.getBase64());
                applicant.setResumeName(trim(f.getFileName(),150));
                applicantRepository.save(applicant);
                resumeUpdated = true;
            }

            // Store new data for audit
            Map<String, Object> newData = getPreOnboardingStatusMap(applicantId);
            newData.put("resumeUpdated", resumeUpdated);

            // Log successful preonboarding data save
            auditService.logCustomAction("SAVE_PREONBOARDING_DATA", CONST_PREONBOARDING, CONST_PREONBOARDING_DATA, null, 
                    applicantId, CONST_APPLICANT, "Preonboarding data saved successfully", oldData, newData, null, request);

            return ResponseEntity.ok().build();

        } catch (Exception e){
            e.printStackTrace();
            auditService.logCustomAction("SAVE_PREONBOARDING_DATA", CONST_PREONBOARDING, CONST_PREONBOARDING_DATA, null, 
                    applicantId, CONST_APPLICANT, "Failed to save preonboarding data - Error: " + e.getMessage(), null, null, null, request);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // ============================================================
    // GET
    // ============================================================
    private Map<String, Object> buildPersonalResponse(PreOnboardingPersonalDetails personal) {
        Map<String,Object> p = new LinkedHashMap<>();
        if (personal != null){
            p.put("firstName", personal.getFirstName());
            p.put("lastName", personal.getLastName());
            p.put("gender", personal.getGender());
            p.put("dateOfBirth", personal.getDateOfBirth() != null ? personal.getDateOfBirth().toString() : null);
            p.put("personalEmail", personal.getPersonalEmail());
            p.put("mobileNumber", personal.getMobileNumber());
            p.put("alternateMobileNumber", personal.getAlternateMobileNumber());
            p.put("bloodGroup", personal.getBloodGroup());
            p.put("fatherName", personal.getFatherName());
            p.put("motherName", personal.getMotherName());
            p.put("maritalStatus", personal.getMaritalStatus());
            p.put("workEmail", personal.getWorkEmail());

            Map<String,Object> photo = new LinkedHashMap<>();
            photo.put(CONST_BASE64,
                personal.getPassportPhoto() == null ? null :
                Base64.getEncoder().encodeToString(personal.getPassportPhoto())
            );
            photo.put(CONST_FILE_NAME, personal.getPassportPhotoName());
            p.put("passportPhoto", photo);

            p.put("emergencyContactName", personal.getEmergencyContactName());
            p.put("emergencyContactRelationship", personal.getEmergencyContactRelationship());
            p.put("emergencyContactNumber", personal.getEmergencyContactNumber());
        }
        return p;
    }

    private Map<String, Object> buildAddressResponse(PreOnboardingAddressDetails addr) {
        Map<String,Object> a = new LinkedHashMap<>();
        if (addr != null){
            Map<String,Object> present = new LinkedHashMap<>();
            present.put("addressLine", addr.getPresentAddressLine());
            present.put("city", addr.getPresentCity());
            present.put("state", addr.getPresentState());
            present.put("pincode", addr.getPresentPincode());
            present.put("landmark", addr.getPresentLandmark());
            present.put("nearestPoliceStation", addr.getPresentNearestPoliceStation());
            present.put("contactPersonName", addr.getPresentContactPersonName());
            present.put("contactPersonRelationship", addr.getPresentContactPersonRelationship());
            present.put("contactPersonMobile", addr.getPresentContactPersonMobile());
            present.put("durationOfStay", addr.getPresentDurationOfStay());

            Map<String,Object> permanent = new LinkedHashMap<>();
            permanent.put("addressLine", addr.getPermanentAddressLine());
            permanent.put("city", addr.getPermanentCity());
            permanent.put("state", addr.getPermanentState());
            permanent.put("pincode", addr.getPermanentPincode());
            permanent.put("landmark", addr.getPermanentLandmark());
            permanent.put("nearestPoliceStation", addr.getPermanentNearestPoliceStation());
            permanent.put("contactPersonName", addr.getPermanentContactPersonName());
            permanent.put("contactPersonRelationship", addr.getPermanentContactPersonRelationship());
            permanent.put("contactPersonMobile", addr.getPermanentContactPersonMobile());
            permanent.put("durationOfStay", addr.getPermanentDurationOfStay());

            a.put("present", present);
            a.put("permanent", permanent);

            a.put("presentProofFile", fileBlock(
                    addr.getPresentAddressProof(),
                    addr.getPresentAddressProofName(),
                    addr.getPresentAddressProofType()
            ));

            a.put("permanentProofFile", fileBlock(
                    addr.getPermanentAddressProof(),
                    addr.getPermanentAddressProofName(),
                    addr.getPermanentAddressProofType()
            ));
        }
        return a;
    }

    private Map<String, Object> buildIdentityResponse(PreOnboardingDocumentDetails idd) {
        Map<String,Object> ids = new LinkedHashMap<>();
        if (idd != null){
            ids.put("aadharNumber", idd.getAadharNumber());
            ids.put("panNumber", idd.getPanNumber());
            ids.put("passportNumber", idd.getPassportNumber());
            ids.put("voterNumber", idd.getVoterNumber());
            ids.put("drivingNumber", idd.getDrivingNumber());
            ids.put("utilityNumber", idd.getUtilityNumber());

            ids.put("aadharFile", fileBlock(idd.getAadharFile(), idd.getAadharFileName(), idd.getAadharFileType()));
            ids.put("panFile", fileBlock(idd.getPanFile(), idd.getPanFileName(), idd.getPanFileType()));
            ids.put("passportFile", fileBlock(idd.getPassportFile(), idd.getPassportFileName(), idd.getPassportFileType()));
            ids.put("voterFile", fileBlock(idd.getVoterFile(), idd.getVoterFileName(), idd.getVoterFileType()));
            ids.put("drivingFile", fileBlock(idd.getDrivingFile(), idd.getDrivingFileName(), idd.getDrivingFileType()));
            ids.put("utilityFile", fileBlock(idd.getUtilityFile(), idd.getUtilityFileName(), idd.getUtilityFileType()));
        }
        return ids;
    }

    private Map<String, Object> buildAcademicResponse(PreOnboardingAcademicDetails acad) {
        Map<String,Object> acMap = new LinkedHashMap<>();
        if (acad != null){
            acMap.put("schoolName", acad.getSchoolName());
            acMap.put("schoolBoard", acad.getSchoolBoard());
            acMap.put("schoolYearOfPassing", acad.getSchoolYearOfPassing());
            acMap.put("schoolCgpaPercentage", acad.getSchoolCgpaPercentage());
            acMap.put("schoolMarksheet", fileBlock(acad.getSchoolMarksheet(), acad.getSchoolMarksheetName(), acad.getSchoolMarksheetType()));

            acMap.put("intermediateCollegeName", acad.getIntermediateCollegeName());
            acMap.put("intermediateBoard", acad.getIntermediateBoard());
            acMap.put("intermediateYearOfPassing", acad.getIntermediateYearOfPassing());
            acMap.put("intermediateCgpaPercentage", acad.getIntermediateCgpaPercentage());
            acMap.put("intermediateMarksheet", fileBlock(acad.getIntermediateMarksheet(), acad.getIntermediateMarksheetName(), acad.getIntermediateMarksheetType()));

            acMap.put("ugDegreeType", acad.getUgDegreeType());
            acMap.put("ugCourse", acad.getUgCourse());
            acMap.put("ugCollegeName", acad.getUgCollegeName());
            acMap.put("ugUniversity", acad.getUgUniversity());
            acMap.put("ugLocation", acad.getUgLocation());
            acMap.put("ugStudyType", acad.getUgStudyType());
            acMap.put("ugYearOfPassing", acad.getUgYearOfPassing());
            acMap.put("ugRegistrationNumber", acad.getUgRegistrationNumber());
            acMap.put("ugMarksheet", fileBlock(acad.getUgMarksheet(), acad.getUgMarksheetName(), acad.getUgMarksheetType()));
            acMap.put("ugCertificate", fileBlock(acad.getUgCertificate(), acad.getUgCertificateName(), acad.getUgCertificateType()));

            acMap.put("pgDegreeType", acad.getPgDegreeType());
            acMap.put("pgCourse", acad.getPgCourse());
            acMap.put("pgCollegeName", acad.getPgCollegeName());
            acMap.put("pgUniversity", acad.getPgUniversity());
            acMap.put("pgLocation", acad.getPgLocation());
            acMap.put("pgStudyType", acad.getPgStudyType());
            acMap.put("pgYearOfPassing", acad.getPgYearOfPassing());
            acMap.put("pgRegistrationNumber", acad.getPgRegistrationNumber());
            acMap.put("pgMarksheet", fileBlock(acad.getPgMarksheet(), acad.getPgMarksheetName(), acad.getPgMarksheetType()));
            acMap.put("pgCertificate", fileBlock(acad.getPgCertificate(), acad.getPgCertificateName(), acad.getPgCertificateType()));
        }
        return acMap;
    }

    private List<Map<String, Object>> buildWorkHistoryResponse(List<PreOnboardingWorkHistory> work) {
        List<Map<String,Object>> whList = new ArrayList<>();
        if (work != null) {
            for (var w : work){
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("companyName", w.getCompanyName());
                m.put("officeLocation", w.getOfficeLocation());
                m.put("designation", w.getDesignation());
                m.put("dateOfJoining", w.getDateOfJoining() != null ? w.getDateOfJoining().toString() : null);
                m.put("dateOfRelieving", w.getDateOfRelieving() != null ? w.getDateOfRelieving().toString() : null);
                m.put("employeeId", w.getEmployeeId());
                m.put("salaryDrawn", w.getSalaryDrawn());
                m.put("reportingManagerName", w.getReportingManagerName());
                m.put("reportingManagerEmail", w.getReportingManagerEmail());
                m.put("reportingManagerPhone", w.getReportingManagerPhone());
                m.put("hrManagerName", w.getHrManagerName());
                m.put("hrManagerEmail", w.getHrManagerEmail());
                m.put("hrManagerPhone", w.getHrManagerPhone());
                m.put("reasonForLeaving", w.getReasonForLeaving());

                m.put("offerLetter", fileBlock(w.getOfferLetter(), w.getOfferLetterName(), w.getOfferLetterType()));
                m.put("relievingLetter", fileBlock(w.getRelievingLetter(), w.getRelievingLetterName(), w.getRelievingLetterType()));
                m.put("payslips", fileBlock(w.getPayslips(), w.getPayslipsName(), w.getPayslipsType()));
                m.put("form16", fileBlock(w.getForm16(), w.getForm16Name(), w.getForm16Type()));
                m.put("pfServiceHistoryFile", fileBlock(w.getPfServiceHistory(), w.getPfServiceHistoryName(), w.getPfServiceHistoryType()));

                whList.add(m);
            }
        }
        return whList;
    }

    private Map<String, Object> buildDocumentsResponse(Applicant applicant) {
        Map<String,Object> docs = new LinkedHashMap<>();
        if (applicant.getBase64Resume() != null){
            Map<String,Object> rf = new LinkedHashMap<>();
            rf.put(CONST_BASE64, applicant.getBase64Resume());
            rf.put(CONST_FILE_NAME, applicant.getResumeName());
            rf.put("fileType", "application/pdf");
            docs.put("resumeFile", rf);
        } else {
            docs.put("resumeFile", null);
        }
        docs.put("others", List.of()); 
        return docs;
    }

    @GetMapping("/{applicantId}")
    public ResponseEntity<Object> get(@PathVariable String applicantId, HttpServletRequest request) {

        try {
            Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                    .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

            var personal = personalRepo.findByApplicantId(applicantId).orElse(null);
            var addr = addressRepo.findByApplicantId(applicantId).orElse(null);
            var acad = academicRepo.findByApplicantId(applicantId).orElse(null);
            var idd = documentRepo.findByApplicantId(applicantId).orElse(null);
            var work = workRepo.findAllByApplicantId(applicantId);

            Map<String,Object> out = new LinkedHashMap<>();
            out.put("applicantId", applicantId);
            out.put("applicant", applicant);
            out.put(CONST_PERSONAL, buildPersonalResponse(personal));
            out.put(CONST_ADDRESS, buildAddressResponse(addr));
            out.put("sameAsPresent", addr != null ? addr.getSameAsPresent() : null);
            out.put("identity", buildIdentityResponse(idd));
            out.put(CONST_ACADEMIC, buildAcademicResponse(acad));
            out.put(CONST_WORK_HISTORY, buildWorkHistoryResponse(work));
            out.put("email", applicant.getEmail());
            out.put(CONST_DOCUMENTS, buildDocumentsResponse(applicant));

            // Log successful preonboarding data retrieval
            Map<String, Object> retrievedData = new HashMap<>();
            retrievedData.put(CONST_PERSONAL, personal != null ? CONST_EXISTS : "NULL");
            retrievedData.put(CONST_ADDRESS, addr != null ? CONST_EXISTS : "NULL");
            retrievedData.put(CONST_ACADEMIC, acad != null ? CONST_EXISTS : "NULL");
            retrievedData.put(CONST_DOCUMENTS, idd != null ? CONST_EXISTS : "NULL");
            retrievedData.put(CONST_WORK_HISTORY, work.size() + CONST_ENTRIES);
            retrievedData.put("resume", applicant.getBase64Resume() != null ? CONST_EXISTS : "NULL");
            
            auditService.logCustomAction("VIEW_PREONBOARDING_DATA", CONST_PREONBOARDING, CONST_PREONBOARDING_DATA, null, 
                    applicantId, CONST_APPLICANT, "Preonboarding data viewed successfully", null, retrievedData, null, request);

            return ResponseEntity.ok(out);

        } catch (Exception e){
            e.printStackTrace();
            auditService.logCustomAction("VIEW_PREONBOARDING_DATA", CONST_PREONBOARDING, CONST_PREONBOARDING_DATA, null, 
                    applicantId, CONST_APPLICANT, "Failed to view preonboarding data - Error: " + e.getMessage(), null, null, null, request);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    private Map<String,Object> fileBlock(byte[] data, String name, String type){
        Map<String,Object> f = new LinkedHashMap<>();
        f.put(CONST_BASE64, data == null ? null : Base64.getEncoder().encodeToString(data));
        f.put(CONST_FILE_NAME, name);
        f.put("fileType", type);
        return f;
    }
    
    @GetMapping("/suggest-work-email")
    public ResponseEntity<List<String>> suggestWorkEmail(
            @RequestParam String firstName,
            @RequestParam String lastName,
            HttpServletRequest request) {

        try {
            if (firstName == null || firstName.isBlank() ||
                lastName == null || lastName.isBlank()) {
                auditService.logCustomAction(CONST_SUGGEST_WORK_EMAIL, CONST_PREONBOARDING, CONST_WORK_EMAIL_SUGGESTION, null, null, CONST_SYSTEM,
                        "Work email suggestion failed - Empty first or last name", null, null, null, request);
                return ResponseEntity.ok(Collections.emptyList());
            }

            String f = firstName.trim().toLowerCase().replaceAll("\\s+", "");
            String l = lastName.trim().toLowerCase().replaceAll("\\s+", "");
            String domain = "@xevyte.com";

            String tenantId = (String) request.getAttribute("X-Tenant-ID");
            if (tenantId == null) {
                tenantId = (String) request.getAttribute("X-Tenant-ID-Num");
            }
            if (tenantId != null && !tenantId.isEmpty() && tenantRepository != null) {
                com.register.example.entity.Tenant tenant = tenantRepository.findByTenantId(tenantId).orElse(null);
                if (tenant != null) {
                    if (tenant.getAdminEmail() != null && tenant.getAdminEmail().contains("@")) {
                        domain = tenant.getAdminEmail().substring(tenant.getAdminEmail().indexOf("@"));
                    } else {
                        domain = "@" + tenant.getTenantId() + ".com";
                    }
                }
            }

            List<String> baseSuggestions = List.of(
                f + "." + l,
                f.charAt(0) + "." + l,
                f + "." + l.charAt(0),
                f + l,
                l + "." + f,
                f + "_" + l
            );

            List<String> finalList = new ArrayList<>();

            for (String base : baseSuggestions) {
                String email = base + domain;

                if (employeeRepo.existsByEmail(email) ||
                    personalRepo.existsByWorkEmail(email)) {
                    continue;
                }

                finalList.add(email);

                if (finalList.size() == 6) break;
            }

            // Log successful work email suggestion
            Map<String, Object> suggestionData = new HashMap<>();
            suggestionData.put("firstName", firstName);
            suggestionData.put("lastName", lastName);
            suggestionData.put("suggestions", finalList.size());
            
            auditService.logCustomAction(CONST_SUGGEST_WORK_EMAIL, CONST_PREONBOARDING, CONST_WORK_EMAIL_SUGGESTION, null, null, CONST_SYSTEM,
                    "Work email suggestions generated successfully", null, suggestionData, null, request);

            return ResponseEntity.ok(finalList);
        } catch (Exception e) {
            auditService.logCustomAction(CONST_SUGGEST_WORK_EMAIL, CONST_PREONBOARDING, CONST_WORK_EMAIL_SUGGESTION, null, null, CONST_SYSTEM,
                    "Failed to generate work email suggestions - Error: " + e.getMessage(), null, null, null, request);
            throw e;
        }
    }

    // ============================================================
    // ✅ SAVE DRAFT (SEPARATE API)
    // ============================================================
    @PostMapping("/{applicantId}/save-draft")
    @Transactional
    public ResponseEntity<Object> saveDraftOnly(
            @PathVariable String applicantId,
            @RequestBody PreOnboardingRequest req,
            HttpServletRequest request) {

        try {
            Applicant applicant = applicantRepository.findByApplicantId(applicantId)
                    .orElseThrow(() -> new RuntimeException(CONST_APPLICANT_NOT_FOUND));

            // Store old data for audit
            Map<String, Object> oldData = getPreOnboardingStatusMap(applicantId);

            // ✅ Only save form data via the self proxy to preserve Transactional behavior
            self.save(applicantId, req, request);

            // Store new data for audit
            Map<String, Object> newData = getPreOnboardingStatusMap(applicantId);

            // Log successful draft save
            auditService.logCustomAction("SAVE_PREONBOARDING_DRAFT", CONST_PREONBOARDING, "PreOnboardingDraft", null, 
                    applicantId, CONST_APPLICANT, "Preonboarding draft saved successfully", oldData, newData, null, request);

            return ResponseEntity.ok("✅ Draft saved successfully (Status remains Initiated)");

        } catch (Exception e) {
            e.printStackTrace();
            auditService.logCustomAction("SAVE_PREONBOARDING_DRAFT", CONST_PREONBOARDING, "PreOnboardingDraft", null, 
                    applicantId, CONST_APPLICANT, "Failed to save preonboarding draft - Error: " + e.getMessage(), null, null, null, request);
            return ResponseEntity.internalServerError()
                    .body("❌ Draft Save Failed: " + e.getMessage());
        }
    }
}