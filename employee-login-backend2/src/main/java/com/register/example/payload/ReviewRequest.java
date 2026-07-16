package com.register.example.payload;

import java.util.List;

public class ReviewRequest {
    private List<Long> goalIds;
    private String status;

    public ReviewRequest() {
    }

    public ReviewRequest(List<Long> goalIds, String status) {
        this.goalIds = goalIds;
        this.status = status;
    }

    public List<Long> getGoalIds() {
        return goalIds;
    }

    public void setGoalIds(List<Long> goalIds) {
        this.goalIds = goalIds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
