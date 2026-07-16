package com.register.example.service;
 
import com.register.example.entity.TravelRequestDraft;
import com.register.example.exception.ResourceNotFoundException;
import com.register.example.repository.TravelRequestDraftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.util.List;
 
@Service
public class TravelRequestDraftService {
 
    private final TravelRequestDraftRepository draftRepository;
 
    public TravelRequestDraftService(TravelRequestDraftRepository draftRepository) {
        this.draftRepository = draftRepository;
    }
 
    public List<TravelRequestDraft> getDraftsByEmployee(String employeeId) {
        return draftRepository.findByEmployeeIdOrderByUpdatedAtDesc(employeeId);
    }
 
    public TravelRequestDraft getDraftByIdAndEmployee(Long draftId, String employeeId) {
        TravelRequestDraft draft = draftRepository.findByIdAndEmployeeId(draftId, employeeId);
        if (draft == null) {
            throw new ResourceNotFoundException("Draft not found with id: " + draftId + " for employee: " + employeeId);
        }
        return draft;
    }
 
    @Transactional
    public TravelRequestDraft saveDraft(TravelRequestDraft draft) {
        if (draft.getId() != null) {
            // Update existing draft - validate ownership
            TravelRequestDraft existing = getDraftByIdAndEmployee(draft.getId(), draft.getEmployeeId());
            // Update fields from input draft
            existing.setName(draft.getName());
            existing.setFromLocation(draft.getFromLocation());
            existing.setToLocation(draft.getToLocation());
            existing.setModeOfTravel(draft.getModeOfTravel());
            existing.setCategory(draft.getCategory());
            existing.setDepartureDate(draft.getDepartureDate());
            existing.setReturnDate(draft.getReturnDate());
            existing.setAccommodationRequired(draft.getAccommodationRequired());
            existing.setAdvanceRequired(draft.getAdvanceRequired());
            existing.setRemarks(draft.getRemarks());
            return draftRepository.save(existing);
        } else {
            // New draft
            return draftRepository.save(draft);
        }
    }
 
    @Transactional
    public void deleteDraft(Long draftId, String employeeId) {
        boolean exists = draftRepository.existsByIdAndEmployeeId(draftId, employeeId);
        if (!exists) {
            throw new ResourceNotFoundException("Draft not found with id: " + draftId + " for employee: " + employeeId);
        }
        draftRepository.deleteByIdAndEmployeeId(draftId, employeeId);
    }
}