package com.register.example.payload;

import java.util.List;

public class AttributeReviewRequest {
    private List<Long> attributeIds;
    private String status;

    public AttributeReviewRequest() {
    }

    public AttributeReviewRequest(List<Long> attributeIds, String status) {
        this.attributeIds = attributeIds;
        this.status = status;
    }

    public List<Long> getAttributeIds() {
        return attributeIds;
    }

    public void setAttributeIds(List<Long> attributeIds) {
        this.attributeIds = attributeIds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
