package com.register.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "asset_conditions", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "type", "value", "tenant_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssetDropdownOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

  @Column(name = "type", nullable = false, length = 50)
private String type; // e.g., "STATUS", "CONDITION", "TEMPLATE_COLUMN"

@Column(name = "value", nullable = false, length = 50)
private String value;

    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(nullable = false)
    private Boolean mandatory; // Removed inline default to allow partial updates

    @Column(name = "show_in_inventory", nullable = false)
    private Boolean showInInventory; // Removed inline default to allow partial updates

    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    public AssetDropdownOption(String type, String value) {
        this.type = type;
        this.value = value;
        this.mandatory = false;
        this.showInInventory = true;
    }
    
    public AssetDropdownOption(String type, String value, Boolean mandatory) {
        this.type = type;
        this.value = value;
        this.mandatory = mandatory != null ? mandatory : false;
        this.showInInventory = true;
    }
}
