package com.register.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponseDTO {
    private String imageUrl;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String uploadPath;
    private String extractedText;
    private Boolean processingComplete;
}
