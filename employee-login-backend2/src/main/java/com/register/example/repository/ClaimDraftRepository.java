package com.register.example.repository;

import com.register.example.entity.ClaimDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimDraftRepository extends JpaRepository<ClaimDraft, Long> {

    /**
     * Finds all claim drafts for a specific employee.
     *
     * @param employeeId The ID of the employee.
     * @return A list of claim drafts.
     */
    List<ClaimDraft> findByEmployeeId(String employeeId);

    List<ClaimDraft> findByClaimGroupId(String claimGroupId);

}
