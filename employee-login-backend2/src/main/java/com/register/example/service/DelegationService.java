package com.register.example.service;

import com.register.example.entity.Delegation;
import com.register.example.repository.DelegationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DelegationService {

    @Autowired
    private DelegationRepository delegationRepository;

    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;

    @Autowired
    private com.register.example.repository.ClaimRepository claimRepository;

    @Autowired
    private com.register.example.repository.LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private com.register.example.repository.TravelRequestRepository travelRequestRepository;

    @Autowired
    private com.register.example.repository.TicketRepository ticketRepository;

    @Autowired
    private com.register.example.repository.ResignationRepository resignationRepository;

    @org.springframework.transaction.annotation.Transactional
    public Delegation saveDelegation(Delegation delegation) {
        if (delegation.getBeginDate() != null) {
            delegation.setBeginDate(normalizeDateToUTC(delegation.getBeginDate()));
        }
        if (delegation.getEndDate() != null) {
            delegation.setEndDate(normalizeDateToUTC(delegation.getEndDate()));
        }
        Delegation saved = delegationRepository.save(delegation);
        
        if (Boolean.TRUE.equals(saved.getReassignExisting())) {
            reassignExistingTasks(saved);
        }
        
        return saved;
    }

    private void reassignExistingTasks(Delegation d) {
        String delegatorId = d.getDelegatorId();
        String delegateId = d.getDelegateId();
        String type = d.getRequestType();

        // Reassign Claims
        if ("Claims".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // As Manager
            List<com.register.example.entity.Claim> claimsM = claimRepository.findByAssignedManagerId(delegatorId);
            for (com.register.example.entity.Claim c : claimsM) {
                c.setAssignedManagerId(delegateId);
                claimRepository.save(c);
            }
            // As Finance
            List<com.register.example.entity.Claim> claimsF = claimRepository.findByAssignedFinanceId(delegatorId);
            for (com.register.example.entity.Claim c : claimsF) {
                c.setAssignedFinanceId(delegateId);
                claimRepository.save(c);
            }
            // As HR
            List<com.register.example.entity.Claim> claimsH = claimRepository.findByAssignedHrId(delegatorId);
            for (com.register.example.entity.Claim c : claimsH) {
                c.setAssignedHrId(delegateId);
                claimRepository.save(c);
            }
        }

        // Reassign Travel Requests
        if ("Travel".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // Only reassign manager approvals - admin approvals are not affected by delegation
            List<com.register.example.entity.TravelRequest> travel = travelRequestRepository.findByAssignedManagerIdAndStatus(delegatorId, "Pending For Approval");
            for (com.register.example.entity.TravelRequest tr : travel) {
                tr.setAssignedManagerId(delegateId);
                travelRequestRepository.save(tr);
            }
        }

        // Reassign Leaves
        if ("Leaves".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            List<com.register.example.entity.LeaveRequest> leaves = leaveRequestRepository.findByPendingApproversContaining(delegatorId);
            for (com.register.example.entity.LeaveRequest lr : leaves) {
                String pending = lr.getPendingApprovers();
                if (pending != null) {
                    lr.setPendingApprovers(pending.replace(delegatorId, delegateId));
                    leaveRequestRepository.save(lr);
                }
            }
        }
        
        // Reassign Help Desk
        if ("Helpdesk".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // Reassign tickets where delegator is the assignedTo
            List<com.register.example.entity.Ticket> tickets = ticketRepository.findByAssignedTo(delegatorId);
            for (com.register.example.entity.Ticket t : tickets) {
                if ("Pending".equalsIgnoreCase(t.getStatus()) || "Open".equalsIgnoreCase(t.getStatus())) {
                    t.setAssignedTo(delegateId);
                    ticketRepository.save(t);
                }
            }
            // Reassign tickets where delegator is the assignedApproverId (for manager approvals)
            List<com.register.example.entity.Ticket> approverTickets = ticketRepository.findByAssignedApproverIdAndStatus(delegatorId, "PENDING_MANAGER");
            for (com.register.example.entity.Ticket t : approverTickets) {
                t.setAssignedApproverId(delegateId);
                ticketRepository.save(t);
            }
        }

        // Reassign Exit Management
        if ("Exit Management".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // Manager
            List<com.register.example.entity.Resignation> resignationsM = resignationRepository.findPendingResignationsForManager(delegatorId);
            for (com.register.example.entity.Resignation r : resignationsM) {
                r.setAssignedManagerId(delegateId);
                resignationRepository.save(r);
            }
            // Reviewer
            List<com.register.example.entity.Resignation> resignationsR = resignationRepository.findPendingResignationsForReviewer(delegatorId);
            for (com.register.example.entity.Resignation r : resignationsR) {
                r.setAssignedReviewerId(delegateId);
                resignationRepository.save(r);
            }
            // HR
            List<com.register.example.entity.Resignation> resignationsH = resignationRepository.findApprovedResignationsForHR(delegatorId);
            for (com.register.example.entity.Resignation r : resignationsH) {
                r.setAssignedHrId(delegateId);
                resignationRepository.save(r);
            }
            // Admin
            List<com.register.example.entity.Resignation> resignationsA = resignationRepository.findPendingResignationsForAdmin(delegatorId);
            for (com.register.example.entity.Resignation r : resignationsA) {
                r.setAssignedAdminId(delegateId);
                resignationRepository.save(r);
            }
            // Finance
            List<com.register.example.entity.Resignation> resignationsF = resignationRepository.findPendingResignationsForFinance(delegatorId);
            for (com.register.example.entity.Resignation r : resignationsF) {
                r.setAssignedFinanceId(delegateId);
                resignationRepository.save(r);
            }
        }
    }

    public String getEffectiveApprover(String originalApproverId, String requestType) {
        String delegateId = getActiveDelegateId(originalApproverId, requestType);
        return (delegateId != null) ? delegateId : originalApproverId;
    }

    public List<Delegation> getDelegationsByDelegator(String delegatorId) {
        return delegationRepository.findByDelegatorId(delegatorId);
    }

    public List<Delegation> getDelegationsByDelegate(String delegateId) {
        return delegationRepository.findByDelegateId(delegateId);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteDelegation(Long id) {
        delegationRepository.findById(id).ifPresent(delegation -> {
            revertTasks(delegation);
            delegationRepository.delete(delegation);
        });
    }

    private void revertTasks(Delegation delegation) {
        String delegatorId = delegation.getDelegatorId();
        String delegateId = delegation.getDelegateId();
        String type = delegation.getRequestType();

        // Revert Claims
        if ("Claims".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // Manager Level
            List<com.register.example.entity.Claim> claimsM = claimRepository.findByAssignedManagerId(delegateId);
            for (com.register.example.entity.Claim c : claimsM) {
                employeeRepository.findByEmployeeId(c.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedManagerId())) {
                        c.setAssignedManagerId(delegatorId);
                        claimRepository.save(c);
                    }
                });
            }
            // Finance Level
            List<com.register.example.entity.Claim> claimsF = claimRepository.findByAssignedFinanceId(delegateId);
            for (com.register.example.entity.Claim c : claimsF) {
                employeeRepository.findByEmployeeId(c.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedFinanceId())) {
                        c.setAssignedFinanceId(delegatorId);
                        claimRepository.save(c);
                    }
                });
            }
            // HR Level
            List<com.register.example.entity.Claim> claimsH = claimRepository.findByAssignedHrId(delegateId);
            for (com.register.example.entity.Claim c : claimsH) {
                employeeRepository.findByEmployeeId(c.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedHrId())) {
                        c.setAssignedHrId(delegatorId);
                        claimRepository.save(c);
                    }
                });
            }
        }

        // Revert Travel Requests
        if ("Travel".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            List<com.register.example.entity.TravelRequest> requests = travelRequestRepository.findByAssignedManagerId(delegateId);
            for (com.register.example.entity.TravelRequest tr : requests) {
                employeeRepository.findByEmployeeId(tr.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedManagerId())) {
                        tr.setAssignedManagerId(delegatorId);
                        travelRequestRepository.save(tr);
                    }
                });
            }
        }

        // Revert Leaves
        if ("Leaves".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            List<com.register.example.entity.LeaveRequest> leaves = leaveRequestRepository.findByPendingApproversContaining(delegateId);
            for (com.register.example.entity.LeaveRequest l : leaves) {
                employeeRepository.findByEmployeeId(l.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedManagerId())) {
                        l.setPendingApprovers(delegatorId);
                        leaveRequestRepository.save(l);
                    }
                });
            }
            // HR level
            List<com.register.example.entity.LeaveRequest> leavesHr = leaveRequestRepository.findByAssignedHrIdAndStatus(delegateId, "Approved");
            for (com.register.example.entity.LeaveRequest l : leavesHr) {
                employeeRepository.findByEmployeeId(l.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedHrId())) {
                        l.setAssignedHrId(delegatorId);
                        leaveRequestRepository.save(l);
                    }
                });
            }
        }

        // Revert Help Desk (Tickets)
        if ("Helpdesk".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // Revert assignedTo
            List<com.register.example.entity.Ticket> tickets = ticketRepository.findByAssignedTo(delegateId);
            for (com.register.example.entity.Ticket t : tickets) {
                if ("Pending".equalsIgnoreCase(t.getStatus()) || "Open".equalsIgnoreCase(t.getStatus())) {
                    t.setAssignedTo(delegatorId);
                    ticketRepository.save(t);
                }
            }
            // Revert assignedApproverId (for manager approvals)
            List<com.register.example.entity.Ticket> approverTickets = ticketRepository.findByAssignedApproverIdAndStatus(delegateId, "PENDING_MANAGER");
            for (com.register.example.entity.Ticket t : approverTickets) {
                employeeRepository.findByEmployeeId(t.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedManagerId())) {
                        t.setAssignedApproverId(delegatorId);
                        ticketRepository.save(t);
                    }
                });
            }
        }

        // Revert Exit Management (Resignations)
        if ("Exit Management".equalsIgnoreCase(type) || "All".equalsIgnoreCase(type)) {
            // Manager
            List<com.register.example.entity.Resignation> resignationsM = resignationRepository.findPendingResignationsForManager(delegateId);
            for (com.register.example.entity.Resignation r : resignationsM) {
                employeeRepository.findByEmployeeId(r.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedManagerId())) {
                        r.setAssignedManagerId(delegatorId);
                        resignationRepository.save(r);
                    }
                });
            }
            // Reviewer
            List<com.register.example.entity.Resignation> resignationsR = resignationRepository.findPendingResignationsForReviewer(delegateId);
            for (com.register.example.entity.Resignation r : resignationsR) {
                employeeRepository.findByEmployeeId(r.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getReviewerId())) {
                        r.setAssignedReviewerId(delegatorId);
                        resignationRepository.save(r);
                    }
                });
            }
            // HR
            List<com.register.example.entity.Resignation> resignationsH = resignationRepository.findApprovedResignationsForHR(delegateId);
            for (com.register.example.entity.Resignation r : resignationsH) {
                employeeRepository.findByEmployeeId(r.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedHrId())) {
                        r.setAssignedHrId(delegatorId);
                        resignationRepository.save(r);
                    }
                });
            }
            // Admin
            List<com.register.example.entity.Resignation> resignationsA = resignationRepository.findPendingResignationsForAdmin(delegateId);
            for (com.register.example.entity.Resignation r : resignationsA) {
                employeeRepository.findByEmployeeId(r.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedAdminId())) {
                        r.setAssignedAdminId(delegatorId);
                        resignationRepository.save(r);
                    }
                });
            }
            // Finance
            List<com.register.example.entity.Resignation> resignationsF = resignationRepository.findPendingResignationsForFinance(delegateId);
            for (com.register.example.entity.Resignation r : resignationsF) {
                employeeRepository.findByEmployeeId(r.getEmployeeId()).ifPresent(emp -> {
                    if (delegatorId.equals(emp.getAssignedFinanceId())) {
                        r.setAssignedFinanceId(delegatorId);
                        resignationRepository.save(r);
                    }
                });
            }
        }
    }

    public Optional<Delegation> getDelegationById(Long id) {
        return delegationRepository.findById(id);
    }

    public String getActiveDelegateId(String delegatorId, String requestType) {
        // Normalize now to start of day to ensure inclusive date comparison
        java.util.Date normalizedNow = getNormalizedNow();

        List<Delegation> active = delegationRepository.findActiveDelegationsByDelegator(delegatorId, requestType, normalizedNow);
        if (!active.isEmpty()) {
            return active.get(0).getDelegateId();
        }
        return null;
    }

    public List<Delegation> getActiveDelegationsForDelegate(String delegateId, String requestType) {
        return delegationRepository.findActiveDelegations(delegateId, requestType, getNormalizedNow());
    }

    private java.util.Date normalizeDateToUTC(java.util.Date date) {
        if (date == null) return null;
        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(date);
        
        java.util.Calendar utcCal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"));
        utcCal.set(java.util.Calendar.YEAR, cal.get(java.util.Calendar.YEAR));
        utcCal.set(java.util.Calendar.MONTH, cal.get(java.util.Calendar.MONTH));
        utcCal.set(java.util.Calendar.DAY_OF_MONTH, cal.get(java.util.Calendar.DAY_OF_MONTH));
        utcCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        utcCal.set(java.util.Calendar.MINUTE, 0);
        utcCal.set(java.util.Calendar.SECOND, 0);
        utcCal.set(java.util.Calendar.MILLISECOND, 0);
        return utcCal.getTime();
    }

    private java.util.Date getNormalizedNow() {
        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        
        java.util.Calendar utcCal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"));
        utcCal.set(java.util.Calendar.YEAR, cal.get(java.util.Calendar.YEAR));
        utcCal.set(java.util.Calendar.MONTH, cal.get(java.util.Calendar.MONTH));
        utcCal.set(java.util.Calendar.DAY_OF_MONTH, cal.get(java.util.Calendar.DAY_OF_MONTH));
        utcCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        utcCal.set(java.util.Calendar.MINUTE, 0);
        utcCal.set(java.util.Calendar.SECOND, 0);
        utcCal.set(java.util.Calendar.MILLISECOND, 0);
        return utcCal.getTime();
    }
}
