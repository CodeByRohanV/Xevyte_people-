package com.register.example.controller;
 
import com.register.example.entity.LeaveDraft;
import com.register.example.payload.LeaveDraftDTO;
import com.register.example.service.LeaveDraftService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType; // ✅ Correct Import
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
 
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
 
@RestController
@RequestMapping("/api/leaves/drafts")
 
public class LeaveDraftController {
 
    private final LeaveDraftService service;
 
    public LeaveDraftController(LeaveDraftService service) {
        this.service = service;
    }
 
    // ✅ Create new draft - now uses DTO
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LeaveDraftDTO> createDraft(
            @RequestPart("dto") LeaveDraftDTO draftDto,
            @RequestPart(value = "document", required = false) MultipartFile file
    ) throws IOException {
 
        LeaveDraft draft = draftDto.toEntity();
 
        if (file != null && !file.isEmpty()) {
            draft.setFileName(file.getOriginalFilename());
            draft.setDocument(file.getBytes());
        }
 
        LeaveDraft saved = service.saveDraft(draft);
        return new ResponseEntity<>(new LeaveDraftDTO(saved), HttpStatus.CREATED);
    }
 
    // ✅ Update existing draft - now uses DTO
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LeaveDraftDTO> updateDraft(
            @PathVariable Long id,
            @RequestPart("dto") LeaveDraftDTO draftDto,
            @RequestPart(value = "document", required = false) MultipartFile file
    ) throws IOException {
        
        LeaveDraft draft = draftDto.toEntity();
        draft.setId(id);
 
        if (file != null && !file.isEmpty()) {
            draft.setFileName(file.getOriginalFilename());
            draft.setDocument(file.getBytes());
        }
 
        LeaveDraft updated = service.saveDraft(draft);
        return ResponseEntity.ok(new LeaveDraftDTO(updated));
    }
 
    // ✅ Get all drafts for an employee (metadata only)
    @GetMapping("/{employeeId}")
    public ResponseEntity<List<LeaveDraftDTO>> getDrafts(@PathVariable String employeeId) {
        List<LeaveDraft> drafts = service.getDraftsByEmployee(employeeId);
        List<LeaveDraftDTO> dtos = drafts.stream()
                .map(LeaveDraftDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
 
    // ✅ Get a single draft by id (metadata only)
    @GetMapping("/single/{id}")
    public ResponseEntity<LeaveDraftDTO> getDraftById(@PathVariable Long id) {
        return service.getDraftById(id)
                .map(draft -> ResponseEntity.ok(new LeaveDraftDTO(draft)))
                .orElse(ResponseEntity.notFound().build());
    }
 
    // ✅ Download draft file (actual file content)
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadDraftFile(@PathVariable Long id) {
        return service.getDraftById(id)
                .filter(draft -> draft.getDocument() != null)
                .map(draft -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentDispositionFormData("attachment", draft.getFileName());
                    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                    return new ResponseEntity<>(draft.getDocument(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }
 
    // ✅ Delete draft
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        service.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }
}
 