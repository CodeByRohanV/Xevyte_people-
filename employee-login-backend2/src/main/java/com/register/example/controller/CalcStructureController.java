package com.register.example.controller;

import com.register.example.dto.CalcComponentDTO;
import com.register.example.dto.CalcStructureDTO;
import com.register.example.dto.ImageUploadResponseDTO;
import com.register.example.dto.StructureFromImageDTO;
import com.register.example.service.CalcStructureService;
import com.register.example.service.ImageProcessingService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/calculations")
@CrossOrigin(origins = "*")
public class CalcStructureController {

    private static final String CONST_ERROR = "error";
    private static final String CONST_MESSAGE = "message";

    private final CalcStructureService service;
    private final ImageProcessingService imageProcessingService;

    public CalcStructureController(CalcStructureService service, ImageProcessingService imageProcessingService) {
        this.service = service;
        this.imageProcessingService = imageProcessingService;
    }

    // ─── STRUCTURE ───────────────────────────────────────────────

    /** POST /api/v1/calculations/structures – Create a new structure */
    @PostMapping("/structures")
    public ResponseEntity<Object> createStructure(@RequestBody CalcStructureDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.createStructure(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /** PUT /api/v1/calculations/structures/{id} – Update a structure */
    @PutMapping("/structures/{id}")
    public ResponseEntity<Object> updateStructure(@PathVariable Long id,
                                             @RequestBody CalcStructureDTO dto) {
        try {
            return ResponseEntity.ok(service.updateStructure(id, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /** PUT /api/v1/calculations/structures/{id}/status – Update structure status */
    @PutMapping("/structures/{id}/status")
    public ResponseEntity<Object> updateStructureStatus(@PathVariable Long id,
                                                   @RequestParam String status) {
        try {
            return ResponseEntity.ok(service.updateStructureStatus(id, status));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /** DELETE /api/v1/calculations/structures/{id} – Delete a structure */
    @DeleteMapping("/structures/{id}")
    public ResponseEntity<Object> deleteStructure(@PathVariable Long id) {
        try {
            service.deleteStructure(id);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Structure deleted successfully"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /**
     * GET /api/v1/calculations/structures – List structures
     * Query params: search, status, page, size, sortBy, sortDir
     */
    @GetMapping("/structures")
    public ResponseEntity<Page<CalcStructureDTO>> listStructures(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(service.listStructures(search, status, page, size, sortBy, sortDir));
    }

    /** GET /api/v1/calculations/structures/{id} – Get structure with components */
    @GetMapping("/structures/{id}")
    public ResponseEntity<Object> getStructure(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getStructureDetails(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    // ─── COMPONENTS ───────────────────────────────────────────────

    /** POST /api/v1/calculations/structures/{structureId}/components – Add component */
    @PostMapping("/structures/{structureId}/components")
    public ResponseEntity<Object> addComponent(@PathVariable Long structureId,
                                          @RequestBody CalcComponentDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.addComponent(structureId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /** PUT /api/v1/calculations/components/{componentId} – Update component */
    @PutMapping("/components/{componentId}")
    public ResponseEntity<Object> updateComponent(@PathVariable Long componentId,
                                             @RequestBody CalcComponentDTO dto) {
        try {
            return ResponseEntity.ok(service.updateComponent(componentId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /** DELETE /api/v1/calculations/components/{componentId} – Delete component */
    @DeleteMapping("/components/{componentId}")
    public ResponseEntity<Object> deleteComponent(@PathVariable Long componentId) {
        try {
            service.deleteComponent(componentId);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Component deleted successfully"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    // ─── CALCULATION ENGINE ───────────────────────────────────────

    /** POST /api/v1/calculations/structures/{id}/execute – Execute calculation */
    @PostMapping("/structures/{id}/execute")
    public ResponseEntity<Object> executeCalculation(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.executeCalculation(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    // ─── TEMPLATES ──────────────────────────────────────────────

    /** GET /api/v1/calculations/templates – List all saved templates */
    @GetMapping("/templates")
    public ResponseEntity<List<CalcStructureDTO>> listTemplates() {
        return ResponseEntity.ok(service.listTemplates());
    }

    /** POST /api/v1/calculations/structures/{id}/save-as-template – Mark/unmark as template */
    @PostMapping("/structures/{id}/save-as-template")
    public ResponseEntity<Object> saveAsTemplate(@PathVariable Long id,
                                             @RequestBody Map<String, Boolean> body) {
        try {
            boolean mark = Boolean.TRUE.equals(body.get("isTemplate"));
            return ResponseEntity.ok(service.saveAsTemplate(id, mark));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        }
    }

    /** POST /api/v1/calculations/structures/{structureId}/validate-formula – Validate formula */
    @PostMapping("/structures/{structureId}/validate-formula")
    public ResponseEntity<Object> validateFormula(@PathVariable Long structureId,
                                              @RequestBody Map<String, String> body) {
        try {
            service.validateFormulaExpression(structureId, body.get("formula"), body.get("section"));
            return ResponseEntity.ok(Map.of("valid", true, CONST_MESSAGE, "Formula is valid"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, CONST_ERROR, e.getMessage()));
        }
    }

    // ─── IMAGE PROCESSING ────────────────────────────────────────

    /** POST /api/v1/calculations/upload-image – Upload structure image */
    @PostMapping("/upload-image")
    public ResponseEntity<Object> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, "Please select a file to upload"));
            }
            
            if (!isValidImageFile(file)) {
                return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, "Only image files (JPG, PNG, GIF, WebP) are allowed"));
            }
            
            ImageUploadResponseDTO response = imageProcessingService.uploadImage(file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(CONST_ERROR, "Failed to upload image: " + e.getMessage()));
        }
    }

    /** POST /api/v1/calculations/process-image – Extract structure from image */
    @PostMapping("/process-image")
    public ResponseEntity<Object> processImage(@RequestBody Map<String, String> request) {
        try {
            String imageUrl = request.get("imageUrl");
            String extractedText = request.get("extractedText");
            
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, "Image URL is required"));
            }
            
            StructureFromImageDTO structure = imageProcessingService.extractStructureFromImage(imageUrl, extractedText);
            return ResponseEntity.ok(structure);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(CONST_ERROR, "Failed to process image: " + e.getMessage()));
        }
    }

    /** POST /api/v1/calculations/structures/from-image – Create structure from processed image */
    @PostMapping("/structures/from-image")
    public ResponseEntity<Object> createStructureFromImage(@RequestBody StructureFromImageDTO imageStructure) {
        try {
            CalcStructureDTO structureDTO = convertImageStructureToDTO(imageStructure);
            CalcStructureDTO created = service.createStructure(structureDTO);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "structure", created,
                CONST_MESSAGE, "Structure created successfully from image",
                "confidence", imageStructure.getConfidence()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(CONST_ERROR, "Failed to create structure from image: " + e.getMessage()));
        }
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────

    private boolean isValidImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        
        if (contentType == null && originalFilename == null) return false;
        
        // Check content type
        if (contentType != null) {
            return contentType.startsWith("image/");
        }
        
        // Fallback to file extension
        if (originalFilename != null) {
            String extension = originalFilename.toLowerCase().substring(originalFilename.lastIndexOf('.') + 1);
            return List.of("jpg", "jpeg", "png", "gif", "webp").contains(extension);
        }
        
        return false;
    }

    private CalcStructureDTO convertImageStructureToDTO(StructureFromImageDTO imageStructure) {
        CalcStructureDTO dto = new CalcStructureDTO();
        dto.setName(imageStructure.getName());
        dto.setDescription(imageStructure.getDescription());
        dto.setStatus("ACTIVE");
        dto.setCreatedBy("admin");
        
        // Convert extracted components to CalcComponentDTO
        List<CalcComponentDTO> components = new ArrayList<>();
        if (imageStructure.getComponents() != null) {
            for (StructureFromImageDTO.ExtractedComponentDTO extracted : imageStructure.getComponents()) {
                CalcComponentDTO comp = new CalcComponentDTO();
                comp.setComponentName(extracted.getComponentName());
                comp.setSection(extracted.getSection());
                comp.setComponentType(extracted.getComponentType());
                comp.setPerMonthValue(extracted.getPerMonthValue());
                comp.setPerAnnumValue(extracted.getPerAnnumValue());
                comp.setFormula(extracted.getFormula());
                comp.setSequenceOrder(extracted.getSequenceOrder());
                comp.setHighlighted(false);
                components.add(comp);
            }
        }
        
        dto.setComponents(components);
        return dto;
    }
}
