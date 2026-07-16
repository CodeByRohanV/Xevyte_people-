package com.register.example.controller;

import com.register.example.entity.Customer;
import com.register.example.entity.Sow;
import com.register.example.repository.CustomerRepository;
import com.register.example.repository.SowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sows")
public class SowController {

    @Autowired
    private SowRepository sowRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;

    private String getCurrentUserTenantId() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    // ✅ Get all SOWs
    @GetMapping
    public List<Sow> getAllSows() {
        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return sowRepository.findByTenantId(tenantId);
        }
        return sowRepository.findAll();
    }

    // ✅ Get all SOWs by Customer ID
    @GetMapping("/customer/{customerId}")
    public List<Sow> getSowsByCustomer(@PathVariable Long customerId) {
        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return sowRepository.findByCustomerCustomerIdAndTenantId(customerId, tenantId);
        }
        return sowRepository.findByCustomerCustomerId(customerId);
    }

    // ✅ Add new SOW with file upload
    // ✅ Add new SOW with file upload
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> createSowWithDocument(
            @RequestParam("sowName") String sowName,
            @RequestParam("sowStartDate") String sowStartDate,
            @RequestParam("sowEndDate") String sowEndDate,
            @RequestParam("totalEffort") int totalEffort,
            @RequestParam("totalCost") double totalCost,
            @RequestParam("customerId") Long customerId,
            @RequestParam("sowDoc") MultipartFile sowDoc) {
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(customer.getTenantId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied to this customer");
            }

            if (doesSowExist(sowName, customerId, tenantId)) {
                return ResponseEntity.badRequest()
                        .body("SOW with name '" + sowName + "' already exists for this customer.");
            }


            Sow sow = new Sow();
            sow.setSowName(sowName);
            sow.setSowStartDate(LocalDate.parse(sowStartDate));
            sow.setSowEndDate(LocalDate.parse(sowEndDate));
            sow.setTotalEffort(totalEffort);
            sow.setTotalCost(totalCost);
            sow.setCustomer(customer);
            sow.setTenantId(tenantId);
            sow.setTenantSowId(getNextTenantSowId(tenantId));

            try {
                handleSowDocument(sow, sowDoc);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }

            Sow savedSow = sowRepository.save(sow);
            return ResponseEntity.ok(savedSow);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating SOW: " + e.getMessage());
        }
    }

    private boolean doesSowExist(String sowName, Long customerId, String tenantId) {
        if (tenantId != null && !tenantId.isEmpty()) {
            return sowRepository.existsBySowNameAndCustomerCustomerIdAndTenantId(sowName, customerId, tenantId);
        }
        return sowRepository.existsBySowNameAndCustomerCustomerId(sowName, customerId);
    }

    private Long getNextTenantSowId(String tenantId) {
        Long nextSeq = 1L;
        if (tenantId != null && !tenantId.isEmpty()) {
            Long maxVal = sowRepository.findMaxTenantSowIdByTenantId(tenantId);
            if (maxVal != null) {
                nextSeq = maxVal + 1;
            }
        } else {
            Long maxVal = sowRepository.findMaxTenantSowIdWithoutTenant();
            if (maxVal != null) {
                nextSeq = maxVal + 1;
            }
        }
        return nextSeq;
    }

    private void handleSowDocument(Sow sow, MultipartFile sowDoc) throws java.io.IOException {
        if (sowDoc != null && !sowDoc.isEmpty()) {
            String contentType = sowDoc.getContentType();
            if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                throw new IllegalArgumentException("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
            }
            sow.setSowDocName(sowDoc.getOriginalFilename());
            sow.setSowDocBlob(sowDoc.getBytes());
        }
    }

    // ✅ Download SOW Document
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadSowDocument(@PathVariable Long id) {
        Sow sow = sowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SOW not found with id: " + id));

        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(sow.getTenantId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        if (sow.getSowDocBlob() == null || sow.getSowDocBlob().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Resource resource = new ByteArrayResource(sow.getSowDocBlob());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + sow.getSowDocName() + "\"")
                .body(resource);
    }

    @PutMapping(value = "/{sowId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> updateSow(
            @PathVariable Long sowId,
            @RequestParam("sowName") String sowName,
            @RequestParam("sowStartDate") String sowStartDate,
            @RequestParam("sowEndDate") String sowEndDate,
            @RequestParam("totalEffort") int totalEffort,
            @RequestParam("totalCost") double totalCost,
            @RequestParam(value = "sowDoc", required = false) MultipartFile sowDoc) {
        try {
            Sow sow = sowRepository.findById(sowId)
                    .orElseThrow(() -> new RuntimeException("SOW not found with id: " + sowId));

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(sow.getTenantId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            // ✅ Update fields
            sow.setSowName(sowName);
            sow.setSowStartDate(LocalDate.parse(sowStartDate));
            sow.setSowEndDate(LocalDate.parse(sowEndDate));
            sow.setTotalEffort(totalEffort);
            sow.setTotalCost(totalCost);

            // ✅ Replace file ONLY if new file uploaded
            if (sowDoc != null && !sowDoc.isEmpty()) {
                String contentType = sowDoc.getContentType();
                if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                    return ResponseEntity.badRequest()
                            .body("Invalid file type. Only PDF, JPEG, PNG allowed.");
                }
                sow.setSowDocName(sowDoc.getOriginalFilename());
                sow.setSowDocBlob(sowDoc.getBytes());
            }
            // else → keep existing file

            Sow updatedSow = sowRepository.save(sow);
            return ResponseEntity.ok(updatedSow);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating SOW");
        }
    }

}