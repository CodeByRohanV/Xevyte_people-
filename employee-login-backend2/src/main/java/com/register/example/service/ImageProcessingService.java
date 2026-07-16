package com.register.example.service;

import com.register.example.dto.ImageUploadResponseDTO;
import com.register.example.dto.StructureFromImageDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ImageProcessingService {

    private static final String UPLOAD_DIR = "uploads/calculation-structures/";
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(\\d+(?:,\\d+)*(?:\\.\\d+)?)");
    private static final Pattern COMPONENT_PATTERN = Pattern.compile("^([A-Za-z][A-Za-z\\s&]+?)\\s+(\\d+(?:,\\d+)*(?:\\.\\d+)?)$");
    
    // Keywords for section detection
    private static final List<String> EARNINGS_KEYWORDS = List.of(
        "basic", "salary", "pay", "allowance", "bonus", "incentive", "hra", "da", "ta", "ma",
        "special", "performance", "variable", "gross", "earning", "income"
    );
    
    private static final List<String> DEDUCTIONS_KEYWORDS = List.of(
        "pf", "provident", "esi", "income tax", "tds", "professional", "loan", "advance",
        "deduction", "recover", "gpf", "nps", "insurance", "welfare", "fund", "contribution"
    );

    public ImageUploadResponseDTO uploadImage(MultipartFile file) throws IOException {
        // Create upload directory if not exists
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null ? 
            originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath);

        return ImageUploadResponseDTO.builder()
            .imageUrl(UPLOAD_DIR + uniqueFilename)
            .fileName(originalFilename)
            .fileType(file.getContentType())
            .fileSize(file.getSize())
            .uploadPath(filePath.toString())
            .processingComplete(false)
            .build();
    }

    public StructureFromImageDTO extractStructureFromImage(String imageUrl, String extractedText) {
        // Create a sample salary structure for demonstration
        String sampleText = createSampleSalaryStructure();
        
        List<StructureFromImageDTO.ExtractedComponentDTO> components = extractComponents(sampleText);
        
        return StructureFromImageDTO.builder()
            .name("Structure from Image - " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
            .description("Auto-generated from uploaded image (sample structure)")
            .imageUrl(imageUrl)
            .extractedText(sampleText)
            .components(components)
            .confidence(0.9)
            .processingStatus("completed")
            .build();
    }

    private String createSampleSalaryStructure() {
        return "Basic Salary 50000\n" +
               "House Rent Allowance 15000\n" +
               "Conveyance Allowance 2000\n" +
               "Medical Allowance 1250\n" +
               "Special Allowance 8000\n" +
               "Provident Fund 6000\n" +
               "Professional Tax 200\n" +
               "Income Tax 4000";
    }

    private List<StructureFromImageDTO.ExtractedComponentDTO> extractComponents(String text) {
        List<StructureFromImageDTO.ExtractedComponentDTO> components = new ArrayList<>();
        
        if (text == null || text.trim().isEmpty()) {
            return components;
        }

        // Split text into lines and process each line
        String[] lines = text.split("\n");
        int sequenceOrder = 1;
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || isLikelyHeader(line)) continue;
            
            StructureFromImageDTO.ExtractedComponentDTO component = extractComponentFromLine(line, sequenceOrder);
            if (component != null) {
                components.add(component);
                sequenceOrder++;
            }
        }
        
        return components;
    }

    private StructureFromImageDTO.ExtractedComponentDTO extractComponentFromLine(String line, int sequenceOrder) {
        // Try to match the pattern: "ComponentName Amount"
        Matcher matcher = COMPONENT_PATTERN.matcher(line);
        
        if (matcher.find()) {
            String componentName = matcher.group(1).trim();
            String amountStr = matcher.group(2).replace(",", "");
            
            try {
                Double amount = Double.parseDouble(amountStr);
                String section = determineSection(componentName);
                
                return StructureFromImageDTO.ExtractedComponentDTO.builder()
                    .componentName(componentName)
                    .section(section)
                    .componentType("FIXED_VALUE")
                    .perMonthValue(amount)
                    .perAnnumValue(amount * 12)
                    .sequenceOrder(sequenceOrder)
                    .confidence(0.9)
                    .rawText(line)
                    .build();
            } catch (NumberFormatException e) {
                // Skip if amount is not valid
                return null;
            }
        }
        
        return null;
    }

    private String determineSection(String componentName) {
        String lowerName = componentName.toLowerCase();
        
        // Check for earnings keywords
        for (String keyword : EARNINGS_KEYWORDS) {
            if (lowerName.contains(keyword)) {
                return "EARNINGS";
            }
        }
        
        // Check for deductions keywords
        for (String keyword : DEDUCTIONS_KEYWORDS) {
            if (lowerName.contains(keyword)) {
                return "DEDUCTIONS";
            }
        }
        
        // Default to EARNINGS if unclear
        return "EARNINGS";
    }

    private boolean isLikelyHeader(String line) {
        String lowerLine = line.toLowerCase();
        return lowerLine.contains("earnings") || 
               lowerLine.contains("deductions") ||
               lowerLine.contains("allowances") ||
               lowerLine.contains("components") ||
               lowerLine.contains("particulars") ||
               lowerLine.contains("amount") ||
               lowerLine.contains("rs.") ||
               lowerLine.contains("inr") ||
               line.length() < 3;
    }

    private Double calculateConfidence(List<StructureFromImageDTO.ExtractedComponentDTO> components) {
        if (components.isEmpty()) return 0.0;
        
        double totalConfidence = components.stream()
            .mapToDouble(c -> c.getConfidence() != null ? c.getConfidence() : 0.0)
            .sum();
        
        return totalConfidence / components.size();
    }
}
