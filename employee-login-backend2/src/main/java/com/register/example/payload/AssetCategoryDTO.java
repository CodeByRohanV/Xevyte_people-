package com.register.example.payload;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AssetCategoryDTO {

    private Long id;
    private String name;
    private AssetCategoryDTO parentCategory;
    private Boolean active;
    private List<AssetFieldConfigDTO> fieldConfigs;
    private String tenantId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @ToString
    public static class AssetFieldConfigDTO {
        private Long id;
        private String fieldName;
        private String fieldType;
        private Boolean mandatory;
        private Boolean uniqueField;
        private Integer displayOrder;
        private Boolean active;
        private String tenantId;
    }
}
