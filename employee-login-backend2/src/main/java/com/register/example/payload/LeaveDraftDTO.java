package com.register.example.payload;

import com.register.example.entity.LeaveDraft;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data

@NoArgsConstructor
public class LeaveDraftDTO {
    private Long id;
    private String employeeId;
    private String reason;
    private String fileName;
    private boolean hasFile;
    private String type;

    private String startDate;
    private String endDate;

    private Double totalDays; // Correctly Double

    public LeaveDraftDTO(LeaveDraft draft) {
        this.id = draft.getId();
        this.employeeId = draft.getEmployeeId();
        this.reason = draft.getReason();
        this.fileName = draft.getFileName();
        this.hasFile = draft.getDocument() != null;
        this.type = draft.getType();

        // Mapped to the Double totalDays in the entity
        this.totalDays = draft.getTotalDays();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        if (draft.getStartDate() != null) {
            this.startDate = draft.getStartDate().format(formatter);
        } else {
            this.startDate = null;
        }
        if (draft.getEndDate() != null) {
            this.endDate = draft.getEndDate().format(formatter);
        } else {
            this.endDate = null;
        }
    }

    public LeaveDraft toEntity() {
        LeaveDraft draft = new LeaveDraft();
        draft.setId(this.id);
        draft.setEmployeeId(this.employeeId);
        draft.setReason(this.reason);
        draft.setFileName(this.fileName);
        draft.setType(this.type);

        // Mapped from the Double totalDays in the DTO
        draft.setTotalDays(this.totalDays);

        if (this.startDate != null) {
            draft.setStartDate(LocalDate.parse(this.startDate));
        }
        if (this.endDate != null) {
            draft.setEndDate(LocalDate.parse(this.endDate));
        }
        return draft;
    }

}
