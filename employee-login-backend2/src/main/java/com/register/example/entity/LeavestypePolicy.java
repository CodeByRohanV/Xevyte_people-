package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import lombok.*;

@Entity
@Table(name = "policy_leave_types", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "name", "tenant_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class LeavestypePolicy extends BaseEntity {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        /**
         * CASUAL, SICK, LOSS_OF_PAY
         */
        @NotBlank
        @Column(nullable = false, length = 50)
        private String name;

        @Column(name = "tenant_id", length = 100)
        private String tenantId;

        @NotBlank
        @Column(nullable = false, length = 50)
        private String unit;

        @Column(name = "yearly_quota")
        private Integer yearlyQuota;

        @Builder.Default
        private Boolean sandwichRule = false;
        @Builder.Default
        private Boolean documentRequired = false;
        private Integer documentThreshold;
        @Builder.Default
        private Boolean halfDayAllowed = false;

        @Builder.Default
        private Boolean active = true;

        @Builder.Default
@Column(length = 50)
private String status = "DRAFT";

@Column(name = "rounding_rule", length = 50)
private String roundingRule;

        @Transient
        @Builder.Default
        private String optionalHolidays = null;

        // Explicit getters and setters for key fields
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getYearlyQuota() {
            return yearlyQuota;
        }

        public void setYearlyQuota(Integer yearlyQuota) {
            this.yearlyQuota = yearlyQuota;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getOptionalHolidays() {
            return optionalHolidays;
        }

        public void setOptionalHolidays(String optionalHolidays) {
            this.optionalHolidays = optionalHolidays;
        }

        public String getTenantId() {
            return tenantId;
        }

        public void setTenantId(String tenantId) {
            this.tenantId = tenantId;
        }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public Boolean getSandwichRule() { return sandwichRule; }
        public void setSandwichRule(Boolean sandwichRule) { this.sandwichRule = sandwichRule; }

        public Boolean getDocumentRequired() { return documentRequired; }
        public void setDocumentRequired(Boolean documentRequired) { this.documentRequired = documentRequired; }

        public Integer getDocumentThreshold() { return documentThreshold; }
        public void setDocumentThreshold(Integer documentThreshold) { this.documentThreshold = documentThreshold; }

        public Boolean getHalfDayAllowed() { return halfDayAllowed; }
        public void setHalfDayAllowed(Boolean halfDayAllowed) { this.halfDayAllowed = halfDayAllowed; }

        public String getRoundingRule() { return roundingRule; }
        public void setRoundingRule(String roundingRule) { this.roundingRule = roundingRule; }
}
