package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "applicant_documents")
public class ApplicantDocuments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long applicantId; // ✅ New field linking to Applicant

    @Lob
    private byte[] offerLetter;
    private String offerLetterFileName;
    private String offerLetterContentType;

    @Lob
    private byte[] appointmentLetter;
    private String appointmentLetterFileName;
    private String appointmentLetterContentType;
    
    @Column(name = "finance_id", length = 50)
    private String financeId;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;


    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getApplicantId() { return applicantId; }
    public void setApplicantId(Long applicantId) { this.applicantId = applicantId; }

    public byte[] getOfferLetter() { return offerLetter; }
    public void setOfferLetter(byte[] offerLetter) { this.offerLetter = offerLetter; }

    public String getOfferLetterFileName() { return offerLetterFileName; }
    public void setOfferLetterFileName(String offerLetterFileName) { this.offerLetterFileName = offerLetterFileName; }

    public String getOfferLetterContentType() { return offerLetterContentType; }
    public void setOfferLetterContentType(String offerLetterContentType) { this.offerLetterContentType = offerLetterContentType; }

    public byte[] getAppointmentLetter() { return appointmentLetter; }
    public void setAppointmentLetter(byte[] appointmentLetter) { this.appointmentLetter = appointmentLetter; }

    public String getAppointmentLetterFileName() { return appointmentLetterFileName; }
    public void setAppointmentLetterFileName(String appointmentLetterFileName) { this.appointmentLetterFileName = appointmentLetterFileName; }

    public String getAppointmentLetterContentType() { return appointmentLetterContentType; }
    public void setAppointmentLetterContentType(String appointmentLetterContentType) { this.appointmentLetterContentType = appointmentLetterContentType; }

    public String getFinanceId() { return financeId; }
    public void setFinanceId(String financeId) { this.financeId = financeId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    
}
