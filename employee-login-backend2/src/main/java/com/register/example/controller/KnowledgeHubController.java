package com.register.example.controller;
 
import com.register.example.entity.KnowledgeHubCategory;
import com.register.example.entity.KnowledgeHub;
import com.register.example.service.KnowledgeHubService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
@RestController
@RequestMapping("/api/knowledge-hub")
public class KnowledgeHubController {
 
    private final KnowledgeHubService service;
 
    public KnowledgeHubController(KnowledgeHubService service) {
        this.service = service;
    }
 
    /** ---------------- UPLOAD ---------------- */
    @PostMapping("/upload")
    public ResponseEntity<Object> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String category) {
        try {
            service.uploadHandbook(file, category);
            return ResponseEntity.ok("Document uploaded successfully");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload document: " + ex.getMessage());
        }
    }
 
    /** ---------------- SAFE METADATA ---------------- */
    @GetMapping("/latest")
    public ResponseEntity<Object> getLatest() {
        KnowledgeHub handbook = service.getLatest();
        if (handbook == null) {
            return ResponseEntity.noContent().build();
        }
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", handbook.getId());
        map.put("downloadUrl", "/api/knowledge-hub/file/" + handbook.getId());
        map.put("originalFileName", handbook.getOriginalFileName());
        map.put("category", handbook.getCategory() != null ? handbook.getCategory() : "");
        map.put("uploadedAt", handbook.getUploadedAt());
        return ResponseEntity.ok(map);
    }
 
    @GetMapping("/all")
    public ResponseEntity<Object> getAll() {
        java.util.List<KnowledgeHub> handbooks = service.getAllHandbooks();
        java.util.List<java.util.Map<String, Object>> metadataList = new java.util.ArrayList<>();
        for (KnowledgeHub hb : handbooks) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", hb.getId());
            map.put("downloadUrl", "/api/knowledge-hub/file/" + hb.getId());
            map.put("originalFileName", hb.getOriginalFileName());
            map.put("category", hb.getCategory() != null ? hb.getCategory() : "");
            map.put("uploadedAt", hb.getUploadedAt());
            metadataList.add(map);
        }
        return ResponseEntity.ok(metadataList);
    }
 
    /** ---------------- STREAM PDF BINARY ---------------- */
    @GetMapping("/file/{id}")
    public ResponseEntity<byte[]> serveFile(@PathVariable Long id) {
        KnowledgeHub hb = service.getFileById(id);
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
            return ResponseEntity.ok("Document deleted successfully");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete document: " + ex.getMessage());
        }
    }
 
    /** ---------------- DYNAMIC CATEGORIES ---------------- */
    @GetMapping("/categories")
    public ResponseEntity<Object> getCategories() {
        java.util.List<KnowledgeHubCategory> cats = service.getHandbookCategories();
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (KnowledgeHubCategory c : cats) {
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
            KnowledgeHubCategory saved = service.addHandbookCategory(label);
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
}
