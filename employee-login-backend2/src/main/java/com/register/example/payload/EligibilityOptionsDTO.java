package com.register.example.payload;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class EligibilityOptionsDTO {
    private List<String> locations;
    private List<String> genders;

    // Explicit constructor to ensure compatibility
    public EligibilityOptionsDTO(List<String> locations, List<String> genders) {
        this.locations = locations;
        this.genders = genders;
    }
}
