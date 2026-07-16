package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class PreOnboardingPdfService {

        @Autowired
        private ApplicantRepository applicantRepo;
        @Autowired
        private PreOnboardingPersonalRepository personalRepo;
        @Autowired
        private PreOnboardingAddressRepository addressRepo;
        @Autowired
        private PreOnboardingAcademicRepository academicRepo;
        @Autowired
        private PreOnboardingDocumentRepository documentRepo;
        @Autowired
        private PreOnboardingWorkHistoryRepository workRepo;

        public byte[] generatePdf(String applicantId) throws IOException {

                Optional<Applicant> applicantOpt = applicantRepo.findByApplicantId(applicantId);
                if (applicantOpt.isEmpty()) {
                        throw new RuntimeException("Applicant not found: " + applicantId);
                }
                Applicant applicant = applicantOpt.get();

                PreOnboardingPersonalDetails personal = personalRepo.findByApplicantId(applicantId)
                                .orElse(new PreOnboardingPersonalDetails());
                PreOnboardingAddressDetails address = addressRepo.findByApplicantId(applicantId)
                                .orElse(new PreOnboardingAddressDetails());
                PreOnboardingAcademicDetails academic = academicRepo.findByApplicantId(applicantId)
                                .orElse(new PreOnboardingAcademicDetails());
                PreOnboardingDocumentDetails documents = documentRepo.findByApplicantId(applicantId)
                                .orElse(new PreOnboardingDocumentDetails());
                List<PreOnboardingWorkHistory> workHistory = workRepo.findAllByApplicantId(applicantId);

                try (PDDocument document = new PDDocument()) {
                        PDPage page = new PDPage();
                        document.addPage(page);

                        final float[] yPos = { 750 };
                        final PDPageContentStream[] contentStream = { new PDPageContentStream(document, page) };
                        float margin = 50;
                        float width = page.getMediaBox().getWidth() - 2 * margin;

                        // Title
                        contentStream[0].setFont(PDType1Font.HELVETICA_BOLD, 20);
                        contentStream[0].setNonStrokingColor(Color.DARK_GRAY);
                        contentStream[0].beginText();
                        contentStream[0].newLineAtOffset(margin, yPos[0]);
                        contentStream[0].showText("Pre-Onboarding Details Summary");
                        contentStream[0].endText();
                        yPos[0] -= 10;

                        drawSeparator(contentStream[0], margin, yPos[0], width);
                        yPos[0] -= 25;

                        // Applicant Info
                        addSectionHeader(document, contentStream, "Applicant Information", margin, yPos);
                        addKVPair(document, contentStream, "Applicant ID", applicant.getApplicantId(), margin, yPos);
                        addKVPair(document, contentStream, "Full Name",
                                        safe(personal.getFirstName()) + " " + safe(personal.getLastName()), margin,
                                        yPos);
                        addKVPair(document, contentStream, "Position", safe(applicant.getPosition()), margin, yPos);
                        addKVPair(document, contentStream, "Email", safe(applicant.getEmail()), margin, yPos);
                        addKVPair(document, contentStream, "Phone", safe(applicant.getPhone()), margin, yPos);
                        yPos[0] -= 15;

                        // Personal Details
                        addSectionHeader(document, contentStream, "Personal Details", margin, yPos);
                        addKVPair(document, contentStream, "Gender", safe(personal.getGender()), margin, yPos);
                        addKVPair(document, contentStream, "Date of Birth",
                                        safe(String.valueOf(personal.getDateOfBirth())), margin, yPos);
                        addKVPair(document, contentStream, "Blood Group", safe(personal.getBloodGroup()), margin, yPos);
                        addKVPair(document, contentStream, "Marital Status", safe(personal.getMaritalStatus()), margin,
                                        yPos);
                        addKVPair(document, contentStream, "Father's Name", safe(personal.getFatherName()), margin,
                                        yPos);
                        addKVPair(document, contentStream, "Mother's Name", safe(personal.getMotherName()), margin,
                                        yPos);

                        addLine(document, contentStream, "Emergency Contact:", margin, yPos);
                        addLine(document, contentStream,
                                        "  " + safe(personal.getEmergencyContactName()) + " ("
                                                        + safe(personal.getEmergencyContactRelationship()) + ")",
                                        margin, yPos);
                        addLine(document, contentStream, "  " + safe(personal.getEmergencyContactNumber()), margin,
                                        yPos);
                        yPos[0] -= 15;

                        // Address
                        addSectionHeader(document, contentStream, "Address Details", margin, yPos);

                        addLine(document, contentStream, "Present Address:", margin, yPos);
                        wrapText(document, contentStream,
                                        safe(address.getPresentAddressLine()) + ", " + safe(address.getPresentCity())
                                                        + ", " + safe(address.getPresentState()) + " - "
                                                        + safe(address.getPresentPincode()),
                                        margin + 10, width - 10, yPos);
                        yPos[0] -= 5;

                        addLine(document, contentStream, "Permanent Address:", margin, yPos);
                        wrapText(document, contentStream, safe(address.getPermanentAddressLine()) + ", "
                                        + safe(address.getPermanentCity()) + ", " + safe(address.getPermanentState())
                                        + " - " + safe(address.getPermanentPincode()), margin + 10, width - 10, yPos);
                        yPos[0] -= 15;

                        // Academic
                        addSectionHeader(document, contentStream, "Academic Qualifications", margin, yPos);

                        addSubHeader(document, contentStream, "10th Grade / Schooling", margin, yPos);
                        addKVPair(document, contentStream, "School",
                                        safe(academic.getSchoolName()) + " (" + safe(academic.getSchoolBoard()) + ")",
                                        margin + 10, yPos);
                        addKVPair(document, contentStream, "Result",
                                        "Year: " + safe(academic.getSchoolYearOfPassing()) + " | Score: "
                                                        + safe(academic.getSchoolCgpaPercentage()) + "%",
                                        margin + 10, yPos);
                        yPos[0] -= 5;

                        if (isValid(academic.getIntermediateCollegeName())) {
                                addSubHeader(document, contentStream, "12th Grade / Diploma", margin, yPos);
                                addKVPair(document, contentStream, "College",
                                                safe(academic.getIntermediateCollegeName()) + " ("
                                                                + safe(academic.getIntermediateBoard()) + ")",
                                                margin + 10, yPos);
                                addKVPair(document, contentStream, "Result",
                                                "Year: " + safe(academic.getIntermediateYearOfPassing()) + " | Score: "
                                                                + safe(academic.getIntermediateCgpaPercentage()) + "%",
                                                margin + 10, yPos);
                                yPos[0] -= 5;
                        }

                        if (isValid(academic.getUgCollegeName())) {
                                addSubHeader(document, contentStream, "Undergraduate", margin, yPos);
                                addKVPair(document, contentStream, "Degree",
                                                safe(academic.getUgDegreeType()) + " - " + safe(academic.getUgCourse()),
                                                margin + 10, yPos);
                                addKVPair(document, contentStream, "College",
                                                safe(academic.getUgCollegeName()) + " ("
                                                                + safe(academic.getUgUniversity()) + ")",
                                                margin + 10, yPos);
                                addKVPair(document, contentStream, "Passing Year", safe(academic.getUgYearOfPassing()),
                                                margin + 10, yPos);
                                yPos[0] -= 5;
                        }

                        if (isValid(academic.getPgCollegeName())) {
                                addSubHeader(document, contentStream, "Postgraduate", margin, yPos);
                                addKVPair(document, contentStream, "Degree",
                                                safe(academic.getPgDegreeType()) + " - " + safe(academic.getPgCourse()),
                                                margin + 10, yPos);
                                addKVPair(document, contentStream, "College",
                                                safe(academic.getPgCollegeName()) + " ("
                                                                + safe(academic.getPgUniversity()) + ")",
                                                margin + 10, yPos);
                                addKVPair(document, contentStream, "Passing Year", safe(academic.getPgYearOfPassing()),
                                                margin + 10, yPos);
                                yPos[0] -= 5;
                        }
                        yPos[0] -= 10;

                        // Identity
                        addSectionHeader(document, contentStream, "Identity Details", margin, yPos);
                        addKVPair(document, contentStream, "Aadhaar Number", safe(documents.getAadharNumber()), margin,
                                        yPos);
                        addKVPair(document, contentStream, "PAN Number", safe(documents.getPanNumber()), margin, yPos);
                        if (isValid(documents.getPassportNumber())) {
                                addKVPair(document, contentStream, "Passport Number",
                                                safe(documents.getPassportNumber()), margin, yPos);
                        }
                        if (isValid(documents.getDrivingNumber())) {
                                addKVPair(document, contentStream, "Driving License",
                                                safe(documents.getDrivingNumber()), margin, yPos);
                        }
                        yPos[0] -= 15;

                        // Work History
                        if (workHistory != null && !workHistory.isEmpty()) {
                                addSectionHeader(document, contentStream, "Work History", margin, yPos);
                                for (PreOnboardingWorkHistory wh : workHistory) {
                                        addSubHeader(document, contentStream, safe(wh.getCompanyName()), margin, yPos);
                                        addKVPair(document, contentStream, "Designation", safe(wh.getDesignation()),
                                                        margin + 10, yPos);
                                        addKVPair(document, contentStream, "Duration",
                                                        safe(String.valueOf(wh.getDateOfJoining())) + " to "
                                                                        + safe(String.valueOf(wh.getDateOfRelieving())),
                                                        margin + 10, yPos);
                                        addKVPair(document, contentStream, "Location", safe(wh.getOfficeLocation()),
                                                        margin + 10, yPos);
                                        yPos[0] -= 5;
                                }
                                yPos[0] -= 10;
                        }

                        // Submitted Documents List
                        addSectionHeader(document, contentStream, "Submitted Documents", margin, yPos);
                        addLine(document, contentStream, "The following documents were uploaded:", margin, yPos);
                        yPos[0] -= 5;

                        // Identity Docs
                        if (isValid(documents.getAadharFileName()))
                                addDocLine(document, contentStream, "Aadhaar Card", documents.getAadharFileName(),
                                                margin, yPos);
                        if (isValid(documents.getPanFileName()))
                                addDocLine(document, contentStream, "PAN Card", documents.getPanFileName(), margin,
                                                yPos);
                        if (isValid(documents.getPassportFileName()))
                                addDocLine(document, contentStream, "Passport", documents.getPassportFileName(), margin,
                                                yPos);
                        if (isValid(documents.getVoterFileName()))
                                addDocLine(document, contentStream, "Voter ID", documents.getVoterFileName(), margin,
                                                yPos);
                        if (isValid(documents.getDrivingFileName()))
                                addDocLine(document, contentStream, "Driving License", documents.getDrivingFileName(),
                                                margin, yPos);

                        // Academic Docs
                        if (isValid(academic.getSchoolMarksheetName()))
                                addDocLine(document, contentStream, "10th Marksheet", academic.getSchoolMarksheetName(),
                                                margin, yPos);
                        if (isValid(academic.getIntermediateMarksheetName()))
                                addDocLine(document, contentStream, "12th/Diploma Marksheet",
                                                academic.getIntermediateMarksheetName(), margin, yPos);
                        if (isValid(academic.getUgMarksheetName()))
                                addDocLine(document, contentStream, "UG Marksheet", academic.getUgMarksheetName(),
                                                margin, yPos);
                        if (isValid(academic.getUgCertificateName()))
                                addDocLine(document, contentStream, "UG Certificate", academic.getUgCertificateName(),
                                                margin, yPos);
                        if (isValid(academic.getPgMarksheetName()))
                                addDocLine(document, contentStream, "PG Marksheet", academic.getPgMarksheetName(),
                                                margin, yPos);
                        if (isValid(academic.getPgCertificateName()))
                                addDocLine(document, contentStream, "PG Certificate", academic.getPgCertificateName(),
                                                margin, yPos);

                        // Other
                        if (isValid(applicant.getResumeName()))
                                addDocLine(document, contentStream, "Resume", applicant.getResumeName(), margin, yPos);
                        if (isValid(personal.getPassportPhotoName()))
                                addDocLine(document, contentStream, "Passport Photo", personal.getPassportPhotoName(),
                                                margin, yPos);

                        contentStream[0].close();

                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        document.save(baos);
                        return baos.toByteArray();
                }
        }

        private void addKVPair(PDDocument doc, PDPageContentStream[] streamRef, String key, String value, float x,
                        float[] yPos) throws IOException {
                checkPageBreak(doc, streamRef, yPos);
                streamRef[0].setFont(PDType1Font.HELVETICA_BOLD, 10);
                streamRef[0].beginText();
                streamRef[0].newLineAtOffset(x, yPos[0]);
                streamRef[0].showText(key + ": ");
                streamRef[0].endText();

                streamRef[0].setFont(PDType1Font.HELVETICA, 10);
                streamRef[0].beginText();
                streamRef[0].newLineAtOffset(x + 100, yPos[0]); // Fixed offset for value
                streamRef[0].showText(value);
                streamRef[0].endText();
                yPos[0] -= 15;
        }

        private void addDocLine(PDDocument doc, PDPageContentStream[] streamRef, String label, String fileName, float x,
                        float[] yPos) throws IOException {
                checkPageBreak(doc, streamRef, yPos);
                streamRef[0].setFont(PDType1Font.HELVETICA, 10);
                streamRef[0].beginText();
                streamRef[0].newLineAtOffset(x, yPos[0]);
                streamRef[0].showText("- " + label + ": " + fileName);
                streamRef[0].endText();
                yPos[0] -= 15;
        }

        private void addSectionHeader(PDDocument doc, PDPageContentStream[] streamRef, String text, float x,
                        float[] yPos) throws IOException {
                yPos[0] -= 10;
                checkPageBreak(doc, streamRef, yPos);

                // Draw background or underline
                streamRef[0].setNonStrokingColor(Color.LIGHT_GRAY);
                streamRef[0].addRect(x, yPos[0] - 2, 500, 18);
                streamRef[0].fill();
                streamRef[0].setNonStrokingColor(Color.BLACK);

                streamRef[0].setFont(PDType1Font.HELVETICA_BOLD, 12);
                streamRef[0].beginText();
                streamRef[0].newLineAtOffset(x + 5, yPos[0] + 3);
                streamRef[0].showText(text);
                streamRef[0].endText();
                yPos[0] -= 25;
        }

        private void addSubHeader(PDDocument doc, PDPageContentStream[] streamRef, String text, float x, float[] yPos)
                        throws IOException {
                checkPageBreak(doc, streamRef, yPos);
                streamRef[0].setFont(PDType1Font.HELVETICA_BOLD, 11);
                streamRef[0].beginText();
                streamRef[0].newLineAtOffset(x, yPos[0]);
                streamRef[0].showText(text);
                streamRef[0].endText();
                yPos[0] -= 15;
        }

        private void addLine(PDDocument doc, PDPageContentStream[] streamRef, String text, float x, float[] yPos)
                        throws IOException {
                checkPageBreak(doc, streamRef, yPos);
                streamRef[0].setFont(PDType1Font.HELVETICA, 10);
                streamRef[0].beginText();
                streamRef[0].newLineAtOffset(x, yPos[0]);
                streamRef[0].showText(text != null ? text : "-");
                streamRef[0].endText();
                yPos[0] -= 15;
        }

        private void wrapText(PDDocument doc, PDPageContentStream[] streamRef, String text, float x, float width,
                        float[] yPos) throws IOException {
                // Very simple wrapper: split by length approx
                // PDFBox doesn't auto wrap. For key-value pairs, we assume values are short
                // header data.
                // For addresses, we can just print it. If extremely long, it clips.
                // Implementing full wrapper is complex, but let's do a basic safety clip.
                if (text.length() > 90) {
                        text = text.substring(0, 90) + "...";
                }
                addLine(doc, streamRef, text, x, yPos);
        }

        private void drawSeparator(PDPageContentStream stream, float x, float y, float width) throws IOException {
                stream.setStrokingColor(Color.BLACK);
                stream.setLineWidth(1);
                stream.moveTo(x, y);
                stream.lineTo(x + width, y);
                stream.stroke();
        }

        private void checkPageBreak(PDDocument doc, PDPageContentStream[] streamRef, float[] yPos) throws IOException {
                if (yPos[0] < 50) {
                        streamRef[0].close();
                        PDPage page = new PDPage();
                        doc.addPage(page);
                        streamRef[0] = new PDPageContentStream(doc, page);
                        yPos[0] = 750;
                }
        }

        private String safe(String s) {
                return s == null || s.trim().isEmpty() ? "-" : s;
        }

        private boolean isValid(String s) {
                return s != null && !s.trim().isEmpty();
        }
}
