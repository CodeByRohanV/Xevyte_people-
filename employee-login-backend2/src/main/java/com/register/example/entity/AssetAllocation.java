package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "asset_allocations")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class AssetAllocation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "allocation_id", nullable = false, unique = true, length = 50)
private String allocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private AssetMaster asset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Employee employee;

    @Column(nullable = false)
    private LocalDate allocationDate;

    private LocalDate expectedReturnDate;

  @Column(name = "condition_at_issue", nullable = false, length = 50)
private String conditionAtIssue;


   @Column(name = "accessories_issued", length = 50)
private String accessoriesIssued;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private byte[] issuedImage;

    @com.fasterxml.jackson.annotation.JsonProperty("issuedImage")
    public String getIssuedImageForJson() {
        return convertBytesToString(issuedImage);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("issuedImage")
    public void setIssuedImageFromJson(String value) {
        this.issuedImage = convertStringToBytes(value);
    }

   @Column(name = "approved_by", length = 50)
private String approvedBy;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AcknowledgementStatus acknowledgementStatus = AcknowledgementStatus.PENDING;

    private LocalDateTime acknowledgementTimestamp;

    // Return details
    private LocalDate returnDate;
    @Column(name = "condition_at_return", length = 50)
private String conditionAtReturn;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private byte[] returnImage;

    @com.fasterxml.jackson.annotation.JsonProperty("returnImage")
    public String getReturnImageForJson() {
        return convertBytesToString(returnImage);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("returnImage")
    public void setReturnImageFromJson(String value) {
        this.returnImage = convertStringToBytes(value);
    }

    private String convertBytesToString(byte[] data) {
        if (data == null)
            return null;
        if (isBinary(data)) {
            String base64 = java.util.Base64.getEncoder().encodeToString(data);
            String mimeType = getMimeType(data);
            return "data:" + mimeType + ";base64," + base64;
        }
        return new String(data, java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] convertStringToBytes(String value) {
        if (value == null || value.isEmpty())
            return null;
        if (value.startsWith("data:")) {
            try {
                String base64 = value.substring(value.indexOf(",") + 1);
                return java.util.Base64.getDecoder().decode(base64);
            } catch (Exception e) {
                return value.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return value.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private boolean isBinary(byte[] data) {
        if (data.length < 4)
            return false;
        return (data[0] == (byte) 0x89 && data[1] == (byte) 0x50) ||
                (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) ||
                (data[0] == (byte) 0x25 && data[1] == (byte) 0x50 && data[2] == 0x44) ||
                (data[0] == (byte) 0x47 && data[1] == (byte) 0x49) ||
                (data[0] == (byte) 0x42 && data[1] == (byte) 0x4D);
    }

    private String getMimeType(byte[] data) {
        if (data.length < 4)
            return "application/octet-stream";
        if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50)
            return "image/png";
        if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8)
            return "image/jpeg";
        if (data[0] == (byte) 0x25 && data[1] == (byte) 0x50 && data[2] == 0x44)
            return "application/pdf";
        if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49)
            return "image/gif";
        if (data[0] == (byte) 0x42 && data[1] == (byte) 0x4D)
            return "image/bmp";
        return "application/octet-stream";
    }

    private String damageNotes;
    @Column(name = "verified_by", length = 50)
private String verifiedBy;

    @Column(nullable = false)
    private boolean active = true;



    public enum AcknowledgementStatus {
        PENDING, ACKNOWLEDGED, REJECTED
    }
}
