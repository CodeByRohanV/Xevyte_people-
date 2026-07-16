package com.register.example.service;
 
import com.register.example.entity.KnowledgeHubCategory;
import com.register.example.entity.KnowledgeHub;
import com.register.example.repository.KnowledgeHubCategoryRepository;
import com.register.example.repository.KnowledgeHubRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
 
@Service
public class KnowledgeHubService {
 
    private final KnowledgeHubRepository repository;
    private final KnowledgeHubCategoryRepository categoryRepository;
    private final EmployeeRepository employeeRepository;
 
    public KnowledgeHubService(KnowledgeHubRepository repository,
                               KnowledgeHubCategoryRepository categoryRepository,
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
    public KnowledgeHub uploadHandbook(MultipartFile file, String category) throws Exception {
        String tenantId = getCurrentTenantId();
        KnowledgeHub handbook = new KnowledgeHub();
        handbook.setFileName(UUID.randomUUID() + "_" + file.getOriginalFilename());
        handbook.setOriginalFileName(file.getOriginalFilename());
        handbook.setFileData(file.getBytes());
        handbook.setCategory(category);
        handbook.setUploadedAt(LocalDateTime.now());
        if (tenantId != null && !tenantId.isEmpty()) {
            handbook.setTenantId(tenantId);
        }
        KnowledgeHub saved = repository.save(handbook);
        saved.setFileUrl("/api/knowledge-hub/file/" + saved.getId());
        return saved;
    }
 
    public List<KnowledgeHub> getAllHandbooks() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return repository.findAllByTenantIdOrderByUploadedAtDesc(tenantId);
        }
        return repository.findAllByOrderByUploadedAtDesc();
    }
 
    public KnowledgeHub getLatest() {
        String tenantId = getCurrentTenantId();
        Optional<KnowledgeHub> latest;
        if (tenantId != null && !tenantId.isEmpty()) {
            latest = repository.findTopByTenantIdOrderByUploadedAtDesc(tenantId);
        } else {
            latest = repository.findTopByOrderByUploadedAtDesc();
        }
        return latest.orElse(null);
    }
 
    public KnowledgeHub getFileById(Long id) {
        return repository.findById(id).orElse(null);
    }
 
    @Transactional
    public void deleteHandbook(Long id) {
        repository.deleteById(id);
    }
 
    /** ---- Dynamic Category Management ---- */
    @Transactional
    public List<KnowledgeHubCategory> getHandbookCategories() {
        String tenantId = getCurrentTenantId();
        List<KnowledgeHubCategory> existing;
        if (tenantId != null && !tenantId.isEmpty()) {
            existing = categoryRepository.findByTenantId(tenantId);
        } else {
            existing = categoryRepository.findAll();
        }
        return existing;
    }
 
    @Transactional
    public KnowledgeHubCategory addHandbookCategory(String label) {
        String tenantId = getCurrentTenantId();
        KnowledgeHubCategory cat = new KnowledgeHubCategory();
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
