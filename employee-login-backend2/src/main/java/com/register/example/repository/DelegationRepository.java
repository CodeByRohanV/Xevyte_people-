package com.register.example.repository;

import com.register.example.entity.Delegation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DelegationRepository extends JpaRepository<Delegation, Long> {
    List<Delegation> findByDelegatorId(String delegatorId);
    List<Delegation> findByDelegateId(String delegateId);
    @org.springframework.data.jpa.repository.Query("SELECT d FROM Delegation d WHERE d.delegatorId = ?1 AND (d.requestType = ?2 OR d.requestType = 'All') AND d.status = 'Active' AND d.beginDate <= ?3 AND d.endDate >= ?3")
    List<Delegation> findActiveDelegationsByDelegator(String delegatorId, String requestType, java.util.Date now);

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Delegation d WHERE d.delegateId = ?1 AND (d.requestType = ?2 OR d.requestType = 'All') AND d.status = 'Active' AND d.beginDate <= ?3 AND d.endDate >= ?3")
    List<Delegation> findActiveDelegations(String delegateId, String requestType, java.util.Date now);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(d) > 0 FROM Delegation d WHERE d.delegateId = ?1 AND (d.requestType = ?2 OR d.requestType = 'All') AND d.status = 'Active' AND d.beginDate <= ?3 AND d.endDate >= ?3")
    boolean existsActiveDelegation(String delegateId, String requestType, java.util.Date now);
}
