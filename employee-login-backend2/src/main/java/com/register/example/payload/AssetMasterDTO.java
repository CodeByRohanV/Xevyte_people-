package com.register.example.payload;

import lombok.*;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AssetMasterDTO {

    private Long id;
    private String assetId;
    private String assetTag;
    private String serialNumber;
    private Long categoryId;
    private Long subCategoryId;
    private String status;
    private String conditionAtStock;
    private Double price;
    private String location;
    private String assignedToEmployeeId;
    private String notes;
    private Boolean active;
    private String createdBy;
    private String creationMode;
    private String sourceSystem;
    private String externalAssetId;
    private Map<String, String> dynamicValues;

    public void setCategory(Map<String, Object> category) {
        if (category != null && category.containsKey("id")) {
            Object idVal = category.get("id");
            if (idVal instanceof Number) {
                this.categoryId = ((Number) idVal).longValue();
            } else if (idVal instanceof String) {
                try {
                    this.categoryId = Long.parseLong((String) idVal);
                } catch (Exception ignored) {}
            }
        }
    }

    public void setSubCategory(Map<String, Object> subCategory) {
        if (subCategory != null && subCategory.containsKey("id")) {
            Object idVal = subCategory.get("id");
            if (idVal instanceof Number) {
                this.subCategoryId = ((Number) idVal).longValue();
            } else if (idVal instanceof String) {
                try {
                    this.subCategoryId = Long.parseLong((String) idVal);
                } catch (Exception ignored) {}
            }
        }
    }
}
