package com.register.example.controller;
 
import com.register.example.entity.DocumentCategory;
import com.register.example.entity.EmployeeHandbook;
import com.register.example.service.EmployeeHandbookService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
@RestController
@RequestMapping("/api/handbook")
public class EmployeeHandbookController {
 
    private final EmployeeHandbookService service;
    private final com.register.example.repository.PolicyAcknowledgmentRepository acknowledgmentRepository;
 
    public EmployeeHandbookController(EmployeeHandbookService service,
                                     com.register.example.repository.PolicyAcknowledgmentRepository acknowledgmentRepository) {
        this.service = service;
        this.acknowledgmentRepository = acknowledgmentRepository;
    }
 
    /** ---------------- UPLOAD ---------------- */
    @PostMapping("/upload")
    public ResponseEntity<Object> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String category) {
        try {
            service.uploadHandbook(file, category);
            return ResponseEntity.ok("Handbook uploaded successfully");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload handbook: " + ex.getMessage());
        }
    }
 
    /** ---------------- SAFE METADATA ---------------- */
    @GetMapping("/latest")
    public ResponseEntity<Object> getLatest() {
        EmployeeHandbook handbook = service.getLatest();
        if (handbook == null) {
            return ResponseEntity.noContent().build();
        }
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", handbook.getId());
        map.put("downloadUrl", "/api/handbook/file/" + handbook.getId());
        map.put("originalFileName", handbook.getOriginalFileName());
        map.put("category", handbook.getCategory() != null ? handbook.getCategory() : "");
        map.put("uploadedAt", handbook.getUploadedAt());
        return ResponseEntity.ok(map);
    }
 
    @GetMapping("/all")
    public ResponseEntity<Object> getAll() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String employeeId = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;

        java.util.List<com.register.example.entity.PolicyAcknowledgment> acknowledgments = new java.util.ArrayList<>();
        if (employeeId != null) {
            acknowledgments = acknowledgmentRepository.findByEmployeeId(employeeId);
        }
        java.util.Set<Long> acknowledgedIds = new java.util.HashSet<>();
        for (com.register.example.entity.PolicyAcknowledgment ack : acknowledgments) {
            if (ack.getAcknowledged()) {
                acknowledgedIds.add(ack.getPolicyId());
            }
        }

        java.util.List<EmployeeHandbook> handbooks = service.getAllHandbooks();
        java.util.List<java.util.Map<String, Object>> metadataList = new java.util.ArrayList<>();
        for (EmployeeHandbook hb : handbooks) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", hb.getId());
            map.put("downloadUrl", "/api/handbook/file/" + hb.getId());
            map.put("originalFileName", hb.getOriginalFileName());
            map.put("category", hb.getCategory() != null ? hb.getCategory() : "");
            map.put("uploadedAt", hb.getUploadedAt());
            map.put("acknowledged", acknowledgedIds.contains(hb.getId()));
            metadataList.add(map);
        }
        return ResponseEntity.ok(metadataList);
    }
 
    /** ---------------- STREAM PDF BINARY ---------------- */
    @GetMapping("/file/{id}")
    public ResponseEntity<byte[]> serveFile(@PathVariable Long id) {
        EmployeeHandbook hb = service.getFileById(id);
        if (hb == null) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + hb.getOriginalFileName() + "\"");
        return new ResponseEntity<>(hb.getFileData(), headers, HttpStatus.OK);
    }
 
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Object> deleteHandbook(@PathVariable Long id) {
        try {
            service.deleteHandbook(id);
            return ResponseEntity.ok("Handbook deleted successfully");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete handbook: " + ex.getMessage());
        }
    }
 
    /** ---------------- DYNAMIC CATEGORIES ---------------- */
    @GetMapping("/categories")
    public ResponseEntity<Object> getCategories() {
        java.util.List<DocumentCategory> cats = service.getHandbookCategories();
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (DocumentCategory c : cats) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", c.getId());
            m.put("categoryKey", c.getCategoryKey() != null ? c.getCategoryKey() : "");
            m.put("categoryLabel", c.getCategoryLabel() != null ? c.getCategoryLabel() : "");
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }
 
    @PostMapping("/categories")
    public ResponseEntity<Object> addCategory(@RequestParam("label") String label) {
        try {
            DocumentCategory saved = service.addHandbookCategory(label);
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", saved.getId());
            m.put("categoryKey", saved.getCategoryKey());
            m.put("categoryLabel", saved.getCategoryLabel());
            return ResponseEntity.ok(m);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to add category: " + ex.getMessage());
        }
    }
 
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Object> deleteCategory(@PathVariable Long id) {
        try {
            service.deleteHandbookCategory(id);
            return ResponseEntity.ok("Category deleted");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete category: " + ex.getMessage());
        }
    }
 
    @GetMapping("/pages/{id}")
    public ResponseEntity<Object> getHandbookPages(@PathVariable Long id) {
        try {
            EmployeeHandbook hb = service.getFileById(id);
            if (hb == null || hb.getFileData() == null) {
                return ResponseEntity.notFound().build();
            }
            
            try (org.apache.pdfbox.pdmodel.PDDocument document = 
                    org.apache.pdfbox.pdmodel.PDDocument.load(hb.getFileData())) {
                org.apache.pdfbox.rendering.PDFRenderer pdfRenderer = 
                    new org.apache.pdfbox.rendering.PDFRenderer(document);
                java.util.List<String> base64Pages = new java.util.ArrayList<>();
                for (int page = 0; page < document.getNumberOfPages(); ++page) {
                    java.awt.image.BufferedImage bim = pdfRenderer.renderImageWithDPI(page, 130);
                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    javax.imageio.ImageIO.write(bim, "png", baos);
                    byte[] bytes = baos.toByteArray();
                    String base64 = java.util.Base64.getEncoder().encodeToString(bytes);
                    base64Pages.add("data:image/png;base64," + base64);
                }
                return ResponseEntity.ok(base64Pages);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to convert PDF pages: " + ex.getMessage());
        }
    }
}
 