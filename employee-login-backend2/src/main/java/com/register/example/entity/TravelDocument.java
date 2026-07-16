package com.register.example.entity;
 
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import com.register.example.entity.BaseEntity;
 
@Entity
public class TravelDocument extends BaseEntity {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    private String fileName;
 
    private String contentType;
 
    @Lob
    @Column(length = 10485760) // Optional: limit size (10 MB here)
    @JsonIgnore // Prevents this field from being serialized to JSON
    private byte[] data;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_request_id", nullable = false)
    @JsonIgnore // Prevents the circular reference to TravelRequest
    private TravelRequest travelRequest;
 
    // Constructors
    public TravelDocument() {
    }
 
    public TravelDocument(String fileName, String contentType, byte[] data, TravelRequest travelRequest) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.data = data;
        this.travelRequest = travelRequest;
    }
 
    // Getters and Setters
    public Long getId() {
        return id;
    }
 
    public void setId(Long id) {
        this.id = id;
    }
 
    public String getFileName() {
        return fileName;
    }
 
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
 
    public String getContentType() {
        return contentType;
    }
 
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
 
    public byte[] getData() {
        return data;
    }
 
    public void setData(byte[] data) {
        this.data = data;
    }
 
    public TravelRequest getTravelRequest() {
        return travelRequest;
    }
 
    public void setTravelRequest(TravelRequest travelRequest) {
        this.travelRequest = travelRequest;
    }
}