package com.register.example.service;

import com.register.example.entity.LeaveDraft;
import com.register.example.repository.LeaveDraftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import the annotation

import java.util.List;
import java.util.Optional;

@Service
public class LeaveDraftService {

    private final LeaveDraftRepository repo;

    public LeaveDraftService(LeaveDraftRepository repo) {
        this.repo = repo;
    }

    // ✅ Method to save a new or updated draft
    @Transactional
    public LeaveDraft saveDraft(LeaveDraft draft) {
        return repo.save(draft);
    }

    // ✅ Method to retrieve all drafts for a specific employee
    public List<LeaveDraft> getDraftsByEmployee(String employeeId) {
        return repo.findByEmployeeId(employeeId);
    }

    // ✅ Method to retrieve a single draft by its ID
    public Optional<LeaveDraft> getDraftById(Long id) {
        return repo.findById(id);
    }

    // ✅ Method to delete a draft by its ID
    @Transactional
    public void deleteDraft(Long id) {
        repo.deleteById(id);
    }
}
