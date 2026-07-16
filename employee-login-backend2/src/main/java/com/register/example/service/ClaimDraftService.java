package com.register.example.service;

import com.register.example.entity.ClaimDraft;
import com.register.example.repository.ClaimDraftRepository;
import com.register.example.annotation.AuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Optional;

//In your ClaimDraftService.java
//...
@Service
public class ClaimDraftService {

    @Autowired
    private ClaimDraftRepository claimDraftRepository;

    @AuditLog(action = "SAVE_CLAIM_DRAFT", module = "CLAIM", entityName = "ClaimDraft", 
              description = "Saved claim draft", logParameters = true, logResult = true)
    public ClaimDraft saveClaimDraft(ClaimDraft draftDto, MultipartFile receipt) throws IOException {
        ClaimDraft draft = new ClaimDraft();

        // Check if it's an update to an existing draft using expenseId
        if (draftDto.getExpenseId() != null) {
            Optional<ClaimDraft> existingDraft = claimDraftRepository.findById(draftDto.getExpenseId());
            if (existingDraft.isPresent()) {
                draft = existingDraft.get();
            }
        }

        // Map data from DTO to entity
        draft.setEmployeeId(draftDto.getEmployeeId());
        draft.setName(draftDto.getName());
        draft.setExpenseDescription(draftDto.getExpenseDescription());
        draft.setCategory(draftDto.getCategory());
        draft.setAmount(draftDto.getAmount());
        draft.setExpenseDate(draftDto.getExpenseDate());
        draft.setBusinessPurpose(draftDto.getBusinessPurpose());
        draft.setAdditionalNotes(draftDto.getAdditionalNotes());
        draft.setClaimGroupId(draftDto.getClaimGroupId()); // Set Group ID

        // Handle the receipt file
        if (receipt != null && !receipt.isEmpty()) {
            draft.setReceipt(receipt.getBytes());
            draft.setReceiptName(receipt.getOriginalFilename());
        }

        draft.setLastSavedDate(new Date());

        return claimDraftRepository.save(draft);
    }

    // THIS IS THE NEW METHOD THAT WAS MISSING
    @AuditLog(action = "UPDATE_CLAIM_DRAFT", module = "CLAIM", entityName = "ClaimDraft", 
              description = "Updated claim draft", logParameters = true, logResult = true)
    public ClaimDraft updateClaimDraft(ClaimDraft draftDto, MultipartFile receiptFile) throws IOException {
        Optional<ClaimDraft> existingDraftOptional = claimDraftRepository.findById(draftDto.getExpenseId());

        if (existingDraftOptional.isPresent()) {
            ClaimDraft existingDraft = existingDraftOptional.get();

            existingDraft.setExpenseDescription(draftDto.getExpenseDescription());
            existingDraft.setCategory(draftDto.getCategory());
            existingDraft.setAmount(draftDto.getAmount());
            existingDraft.setExpenseDate(draftDto.getExpenseDate());
            existingDraft.setBusinessPurpose(draftDto.getBusinessPurpose());
            existingDraft.setAdditionalNotes(draftDto.getAdditionalNotes());
            existingDraft.setClaimGroupId(draftDto.getClaimGroupId());

            if (receiptFile != null && !receiptFile.isEmpty()) {
                existingDraft.setReceipt(receiptFile.getBytes());
                existingDraft.setReceiptName(receiptFile.getOriginalFilename());
            }

            return claimDraftRepository.save(existingDraft);
        } else {
            throw new RuntimeException("Draft not found with ID: " + draftDto.getExpenseId());
        }
    }

    public List<ClaimDraft> getDrafts(String employeeId) {
        return claimDraftRepository.findByEmployeeId(employeeId);
    }

    public List<ClaimDraft> getDraftsByGroupId(String groupId) {
        return claimDraftRepository.findByClaimGroupId(groupId);
    }

    public Optional<ClaimDraft> getDraftById(Long draftId) {
        return claimDraftRepository.findById(draftId);
    }

    @AuditLog(action = "DELETE_CLAIM_DRAFT", module = "CLAIM", entityName = "ClaimDraft", 
              description = "Deleted claim draft", logParameters = true)
    public void deleteDraft(Long draftId) {
        claimDraftRepository.deleteById(draftId);
    }
}
