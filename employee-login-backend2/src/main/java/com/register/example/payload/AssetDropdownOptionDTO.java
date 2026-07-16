package com.register.example.payload;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AssetDropdownOptionDTO {

    private Long id;
    private String type;
    private String value;
    private Integer sortOrder;
    private Boolean mandatory;
    private Boolean showInInventory;
    private String tenantId;
}
