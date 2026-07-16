package com.register.example.service;
 
import com.register.example.entity.DocumentCategory;
import com.register.example.entity.EmployeeHandbook;
import com.register.example.repository.DocumentCategoryRepository;
import com.register.example.repository.EmployeeHandbookRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
 
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
 
@Service
public class EmployeeHandbookService {
 
    private final EmployeeHandbookRepository repository;
    private final DocumentCategoryRepository categoryRepository;
    private final EmployeeRepository employeeRepository;
 
    public EmployeeHandbookService(EmployeeHandbookRepository repository,
                                   DocumentCategoryRepository categoryRepository,
                                   EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.employeeRepository = employeeRepository;
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }
 
    @Transactional
    public EmployeeHandbook uploadHandbook(MultipartFile file, String category) throws Exception {
        String tenantId = getCurrentTenantId();
        EmployeeHandbook handbook = new EmployeeHandbook();
        handbook.setFileName(UUID.randomUUID() + "_" + file.getOriginalFilename());
        handbook.setOriginalFileName(file.getOriginalFilename());
        handbook.setFileData(file.getBytes());
        handbook.setCategory(category);
        handbook.setUploadedAt(LocalDateTime.now());
        if (tenantId != null && !tenantId.isEmpty()) {
            handbook.setTenantId(tenantId);
        }
        EmployeeHandbook saved = repository.save(handbook);
        saved.setFileUrl("/api/handbook/file/" + saved.getId());
        return saved;
    }
 
    public List<EmployeeHandbook> getAllHandbooks() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return repository.findAllByTenantIdOrderByUploadedAtDesc(tenantId);
        }
        return repository.findAllByOrderByUploadedAtDesc();
    }
 
    public EmployeeHandbook getLatest() {
        String tenantId = getCurrentTenantId();
        Optional<EmployeeHandbook> latest;
        if (tenantId != null && !tenantId.isEmpty()) {
            latest = repository.findTopByTenantIdOrderByUploadedAtDesc(tenantId);
        } else {
            latest = repository.findTopByOrderByUploadedAtDesc();
        }
        return latest.orElse(null);
    }
 
    public EmployeeHandbook getFileById(Long id) {
        return repository.findById(id).orElse(null);
    }
 
    @Transactional
    public void deleteHandbook(Long id) {
        repository.deleteById(id);
    }
 
    /** ---- Dynamic Category Management ---- */
    @Transactional
    public List<DocumentCategory> getHandbookCategories() {
        String tenantId = getCurrentTenantId();
        List<DocumentCategory> existing;
        if (tenantId != null && !tenantId.isEmpty()) {
            existing = categoryRepository.findByTenantId(tenantId);
        } else {
            existing = categoryRepository.findAll();
        }
        return existing;
    }
 
    @Transactional
    public DocumentCategory addHandbookCategory(String label) {
        String tenantId = getCurrentTenantId();
        DocumentCategory cat = new DocumentCategory();
        cat.setCategoryKey(label.trim().toUpperCase().replace(" ", "_"));
        cat.setCategoryLabel(label.trim());
        if (tenantId != null && !tenantId.isEmpty()) {
            cat.setTenantId(tenantId);
        }
        return categoryRepository.save(cat);
    }
 
    @Transactional
    public void deleteHandbookCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
 