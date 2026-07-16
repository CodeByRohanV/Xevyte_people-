package com.register.example.repository;

import java.util.List;

import com.register.example.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByEmployeeId(String employeeId);
    List<Ticket> findByEmployeeIdAndStatus(String employeeId, String status);
    List<Ticket> findByAssignedTo(String assignedTo);
    List<Ticket> findByAssignedApproverIdAndStatus(String assignedApproverId, String status);
}
