package com.register.example.repository;

import com.register.example.entity.ClaimApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimApprovalHistoryRepository extends JpaRepository<ClaimApprovalHistory, Long> {
    List<ClaimApprovalHistory> findByClaimIdOrderByActionTimestampAsc(Long claimId);
}
