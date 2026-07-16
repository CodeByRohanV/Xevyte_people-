package com.register.example.payload;
 
public class TravelDocumentDTO {
    private Long id;
    private String fileName;
    private String contentType;
 
    // Constructor
    public TravelDocumentDTO(Long id, String fileName, String contentType) {
        this.id = id;
        this.fileName = fileName;
        this.contentType = contentType;
    }
 
    // Default constructor (required for serialization/deserialization)
    public TravelDocumentDTO() {
    }
 
    // Getters
    public Long getId() {
        return id;
    }
 
    public String getFileName() {
        return fileName;
    }
 
    public String getContentType() {
        return contentType;
    }
 
    // Setters
    public void setId(Long id) {
        this.id = id;
    }
 
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
 
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
 
    // Optional: toString() method for debugging/logging
    @Override
    public String toString() {
        return "TravelDocumentDTO{" +
                "id=" + id +
                ", fileName='" + fileName + '\'' +
                ", contentType='" + contentType + '\'' +
                '}';
    }
}
 
 