package com.register.example.payload;

public class GrievanceCreateResponse {

    private String grievanceId;
    private String message;

    public GrievanceCreateResponse() {
    }

    public GrievanceCreateResponse(String grievanceId, String message) {
        this.grievanceId = grievanceId;
        this.message = message;
    }

    public String getGrievanceId() {
        return grievanceId;
    }

    public void setGrievanceId(String grievanceId) {
        this.grievanceId = grievanceId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
