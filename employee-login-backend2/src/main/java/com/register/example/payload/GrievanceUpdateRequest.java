package com.register.example.payload;

import jakarta.validation.constraints.NotBlank;

public class GrievanceUpdateRequest {

    @NotBlank
    private String status;

    private String investigationNotes;

    private String adminResponse;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getInvestigationNotes() {
        return investigationNotes;
    }

    public void setInvestigationNotes(String investigationNotes) {
        this.investigationNotes = investigationNotes;
    }

    public String getAdminResponse() {
        return adminResponse;
    }

    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }
}
