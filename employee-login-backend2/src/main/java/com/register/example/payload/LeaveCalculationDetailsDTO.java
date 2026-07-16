package com.register.example.payload;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDate;

/**
 * DTO for providing transparent leave calculation details
 */
@Data
@Builder
@Jacksonized
@NoArgsConstructor
@AllArgsConstructor
public class LeaveCalculationDetailsDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    private Integer calendarDays;
    private Integer weekendDays;
    private Integer holidayDays;
    private Integer workingDays;
    private Double totalDays;

    private Boolean sandwichRuleApplied;
    private Boolean halfDayApplied;
    private String leaveUnit;

    private String calculationMethod;
    private String explanation;

    /**
     * Generate human-readable explanation of the calculation
     */
    public String generateExplanation() {
        StringBuilder sb = new StringBuilder();

        sb.append("Calculation: ");
        sb.append(calendarDays).append(" calendar days");

        if (sandwichRuleApplied != null && sandwichRuleApplied) {
            sb.append(" (Sandwich Rule: All days counted including weekends/holidays)");
        } else {
            sb.append(" - ").append(weekendDays).append(" weekend days");
            sb.append(" - ").append(holidayDays).append(" holidays");
            sb.append(" = ").append(workingDays).append(" working days");
        }

        if (halfDayApplied != null && halfDayApplied) {
            sb.append(". Half-day applied: ").append(totalDays).append(" days");
        }

        return sb.toString();
    }
}
