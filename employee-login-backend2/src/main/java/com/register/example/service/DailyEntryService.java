
package com.register.example.service;

import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;

import com.register.example.entity.Notification;

import com.register.example.payload.DailyEntryDTO;
import com.register.example.payload.SubmittedDateDTO;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.repository.HolidayRepository;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.time.format.DateTimeFormatter;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyEntryService {

    // ✅ NEW: Define the desired date formatter
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PayrollManagementService payrollManagementService;

    @Autowired
    private jakarta.servlet.http.HttpServletRequest request;

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    private final DailyEntryRepository dailyEntryRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayRepository holidayRepository;
    private final com.register.example.repository.LeaveRequestRepository leaveRequestRepository;

    public DailyEntryService(DailyEntryRepository dailyEntryRepository,
            EmployeeRepository employeeRepository,
            HolidayRepository holidayRepository,
            com.register.example.repository.LeaveRequestRepository leaveRequestRepository) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.employeeRepository = employeeRepository;
        this.holidayRepository = holidayRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    private void validateWorkingDay(Employee emp, LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            throw new IllegalStateException("Timesheet submission is not allowed on weekends or company holidays.");
        }

        List<com.register.example.entity.Holiday> holidays;
        if (emp.getTenantId() != null && !emp.getTenantId().trim().isEmpty()) {
            holidays = holidayRepository.findByDateBetweenAndTenantId(date, date, emp.getTenantId());
        } else {
            holidays = holidayRepository.findByDateBetween(date, date);
        }

        for (com.register.example.entity.Holiday h : holidays) {
            boolean locationMatch = false;
            if (h.getLocation() == null) {
                locationMatch = true;
            } else if (emp.getWorkLocation() != null && h.getLocation().equalsIgnoreCase(emp.getWorkLocation())) {
                locationMatch = true;
            }

            if (locationMatch) {
                boolean isOptional = h.getHoliday() != null && h.getHoliday().toLowerCase().contains("(optional)");
                if (!isOptional) {
                    throw new IllegalStateException("Timesheet submission is not allowed on weekends or company holidays.");
                }
            }
        }
    }

    /** Submit a new daily entry */
    public DailyEntryDTO submitDailyEntry(String employeeId, DailyEntryDTO dto) {
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        validateWorkingDay(emp, dto.getDate());

        if (isDateFrozen(employeeId, dto.getDate())) {
            throw new IllegalStateException("Timesheet is frozen for date: " + dto.getDate());
        }

        Optional<DailyEntry> existingOpt = dailyEntryRepository.findByEmployeeIdAndDate(employeeId, dto.getDate());

        if (existingOpt.isPresent()) {
            DailyEntry existing = existingOpt.get();

            // ❌ Block only if it is a REAL submitted entry
            if (existing.getTotalHours() > 0) {

                throw new IllegalStateException("Timesheet already submitted for date: " + dto.getDate());
            }

            boolean wasSubmitted = "SUBMITTED".equalsIgnoreCase(existing.getStatus());

            // ✅ If it is a frozen placeholder → UPDATE it instead
            existing.setClientId(dto.getClientId());
            existing.setClientName(dto.getClientName());
            existing.setProjectId(dto.getProjectId());
            existing.setProjectName(dto.getProjectName());
            existing.setLoginTime(dto.getLoginTime());
            existing.setLogoutTime(dto.getLogoutTime());
            existing.setTotalHours(dto.getTotalHours());
            existing.setRemarks(dto.getRemarks());
            existing.setWorkLocation(dto.getWorkLocation());
            existing.setLoginWorkLocation(dto.getLoginWorkLocation());
            existing.setLogoutWorkLocation(dto.getLogoutWorkLocation());
            existing.setStatus(dto.getStatus());
            existing.setFrozen(false); // ✅ unfreeze on submit

            DailyEntry saved = dailyEntryRepository.save(existing);
            payrollManagementService.calculateAndSavePayroll(employeeId, saved.getDate());

            if ("SUBMITTED".equalsIgnoreCase(saved.getStatus()) && !wasSubmitted) {
                checkAndSendLessThanNineHoursNotification(emp, saved.getDate(), saved.getTotalHours());
            }

            return mapToDTO(saved);
        }

        DailyEntry entry = new DailyEntry();
        entry.setEmployeeId(emp.getEmployeeId());
        entry.setDate(dto.getDate());
        entry.setClientId(dto.getClientId());
        entry.setClientName(dto.getClientName());
        entry.setProjectId(dto.getProjectId());
        entry.setProjectName(dto.getProjectName());
        entry.setLoginTime(dto.getLoginTime());
        entry.setLogoutTime(dto.getLogoutTime());
        entry.setTotalHours(dto.getTotalHours());
        entry.setRemarks(dto.getRemarks());
        entry.setWorkLocation(dto.getWorkLocation());
        entry.setLoginWorkLocation(dto.getLoginWorkLocation());
        entry.setLogoutWorkLocation(dto.getLogoutWorkLocation());
        entry.setStatus(dto.getStatus());
        entry.setFrozen(false);

        DailyEntry saved = dailyEntryRepository.save(entry);
        payrollManagementService.calculateAndSavePayroll(employeeId, saved.getDate());

        if ("SUBMITTED".equalsIgnoreCase(saved.getStatus())) {
            checkAndSendLessThanNineHoursNotification(emp, saved.getDate(), saved.getTotalHours());
        }

        return mapToDTO(saved);
    }

    /** Update an existing daily entry */
    @Transactional
    public DailyEntryDTO updateDailyEntry(Long entryId, DailyEntryDTO dto) {
        DailyEntry existingEntry = dailyEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalStateException("Timesheet entry not found with id: " + entryId));

        Employee emp = employeeRepository.findByEmployeeId(existingEntry.getEmployeeId())
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + existingEntry.getEmployeeId()));

        validateWorkingDay(emp, existingEntry.getDate());

        if (isDateFrozen(existingEntry.getEmployeeId(), existingEntry.getDate())) {
            throw new IllegalStateException("Timesheet is frozen for date: " + existingEntry.getDate());
        }

        boolean wasSubmitted = "SUBMITTED".equalsIgnoreCase(existingEntry.getStatus());

        existingEntry.setClientId(dto.getClientId());
        existingEntry.setClientName(dto.getClientName());
        existingEntry.setProjectId(dto.getProjectId());
        existingEntry.setProjectName(dto.getProjectName());
        existingEntry.setLoginTime(dto.getLoginTime());
        existingEntry.setLogoutTime(dto.getLogoutTime());
        existingEntry.setTotalHours(dto.getTotalHours());
        existingEntry.setRemarks(dto.getRemarks());
        existingEntry.setWorkLocation(dto.getWorkLocation());
        existingEntry.setLoginWorkLocation(dto.getLoginWorkLocation());
        existingEntry.setLogoutWorkLocation(dto.getLogoutWorkLocation());
        existingEntry.setStatus(dto.getStatus());

        DailyEntry updated = dailyEntryRepository.save(existingEntry);
        payrollManagementService.calculateAndSavePayroll(existingEntry.getEmployeeId(), updated.getDate());

        if ("SUBMITTED".equalsIgnoreCase(updated.getStatus()) && !wasSubmitted) {
            checkAndSendLessThanNineHoursNotification(emp, updated.getDate(), updated.getTotalHours());
        }

        return mapToDTO(updated);
    }

    /** Get all entries for an employee */
    public List<DailyEntryDTO> getEntriesByEmployee(String employeeId) {
        return dailyEntryRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Get all entries under a manager */
    public List<DailyEntryDTO> getEntriesByManager(String managerId) {
        List<Employee> employees = employeeRepository.findByAssignedManagerId(managerId);
        if (employees.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> employeeIds = employees.stream()
                .map(Employee::getEmployeeId)
                .collect(Collectors.toList());

        List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdIn(employeeIds);

        return entries.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Get all entries under HR */
    // ✅ This is the correct method, which you should keep
    public List<DailyEntryDTO> getEntriesByHr(String hrId) {
        List<Employee> employees = employeeRepository.findByAssignedHrId(hrId);
        if (employees.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> employeeIds = employees.stream()
                .map(Employee::getEmployeeId)
                .collect(Collectors.toList());

        List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdIn(employeeIds);

        return entries.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Get entries by manager and employee */
    public List<DailyEntryDTO> getEntriesByManagerAndEmployee(String managerId, String employeeId) {
        // Verify employee belongs to manager
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(employeeId);
        if (employeeOpt.isEmpty() || !managerId.equals(employeeOpt.get().getAssignedManagerId())) {
            return Collections.emptyList();
        }

        return dailyEntryRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Get entries by HR and employee */
    public List<DailyEntryDTO> getEntriesByHrAndEmployee(String hrId, String employeeId) {
        // Verify employee belongs to HR
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(employeeId);
        if (employeeOpt.isEmpty() || !hrId.equals(employeeOpt.get().getAssignedHrId())) {
            return Collections.emptyList();
        }

        return dailyEntryRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Get submitted dates */
    public List<SubmittedDateDTO> getSubmittedDatesByEmployee(String employeeId) {
        return dailyEntryRepository.findByEmployeeId(employeeId).stream()
                .map(entry -> new SubmittedDateDTO(entry.getDate(), entry.getTotalHours()))
                .collect(Collectors.toList());
    }

    /** Get total hours */
    public double getTotalHoursByEmployee(String employeeId) {
        Double totalHours = dailyEntryRepository.findTotalHoursByEmployeeId(employeeId);
        return totalHours != null ? totalHours : 0.0;
    }

    /** Get frozen dates */
    public List<LocalDate> getFrozenDates(String employeeId) {
        return dailyEntryRepository.findByEmployeeIdAndFrozenTrue(employeeId).stream()
                .map(DailyEntry::getDate)
                .toList();
    }

    @Transactional
    public void freezeTimesheets(String managerId, String employeeId, LocalDate startDate, LocalDate endDate) {
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        if (!managerId.equals(emp.getAssignedManagerId())) {
            throw new IllegalStateException("Manager not authorized to freeze timesheets for employee: " + employeeId);
        }

        List<DailyEntry> existingEntries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, startDate,
                endDate);

        Map<LocalDate, DailyEntry> existingEntryMap = existingEntries.stream()
                .collect(Collectors.toMap(DailyEntry::getDate, e -> e));

        List<DailyEntry> toSave = new ArrayList<>();
        LocalDate currentDate = startDate;

        // Fetch mandatory holidays for the range to mark them accurately
        List<com.register.example.entity.Holiday> holidays = holidayRepository.findByDateBetween(startDate, endDate);
        Set<LocalDate> mandatoryHolidayDates = holidays.stream()
                .filter(h -> h.getLocation() == null || h.getLocation().equalsIgnoreCase(emp.getWorkLocation()))
                .filter(h -> h.getHoliday() == null || !h.getHoliday().toLowerCase().contains("(optional)"))
                .map(com.register.example.entity.Holiday::getDate)
                .collect(Collectors.toSet());

        // Fetch approved LOP leaves to mark them as LOP in timesheet
        List<com.register.example.entity.LeaveRequest> lopLeaves = leaveRequestRepository
                .findByEmployeeIdAndStatus(employeeId, "Approved")
                .stream()
                .filter(l -> l.getType().equalsIgnoreCase("LOP") || l.getType().equalsIgnoreCase("Loss of Pay"))
                .toList();

        Set<LocalDate> lopDates = lopLeaves.stream()
                .flatMap(l -> l.getStartDate().datesUntil(l.getEndDate().plusDays(1)))
                .filter(d -> !d.isBefore(startDate) && !d.isAfter(endDate))
                .collect(Collectors.toSet());

        while (!currentDate.isAfter(endDate)) {
            if (existingEntryMap.containsKey(currentDate)) {
                DailyEntry entryToFreeze = existingEntryMap.get(currentDate);
                if (entryToFreeze.isFrozen()) {
                    currentDate = currentDate.plusDays(1);
                    continue; // Skip already frozen days
                }

                // If it's an LOP date, override remarks
                if (lopDates.contains(currentDate)) {
                    entryToFreeze.setRemarks("LOP");
                }

                entryToFreeze.setFrozen(true);
                toSave.add(entryToFreeze);
            } else {
                DailyEntry newEntry = new DailyEntry();
                newEntry.setEmployeeId(employeeId);
                newEntry.setDate(currentDate);
                newEntry.setFrozen(true);
                newEntry.setTotalHours(0.0);

                // Identify if it's a weekend, holiday, or LOP
                DayOfWeek dow = currentDate.getDayOfWeek();
                if (lopDates.contains(currentDate)) {
                    newEntry.setRemarks("LOP");
                } else if (dow.equals(DayOfWeek.SATURDAY) || dow.equals(DayOfWeek.SUNDAY)) {
                    newEntry.setRemarks("Weekend");
                } else if (mandatoryHolidayDates.contains(currentDate)) {
                    newEntry.setRemarks("Holiday");
                } else {
                    newEntry.setRemarks("");
                }

                newEntry.setClientId(null);
                newEntry.setClientName(null);
                newEntry.setProjectId(null);
                newEntry.setProjectName(null);
                newEntry.setWorkLocation(emp.getWorkLocation()); // Set default location if available

                toSave.add(newEntry);
            }
            currentDate = currentDate.plusDays(1);
        }

        dailyEntryRepository.saveAll(toSave);

        // ✅ Trigger payroll update for all months in the range
        LocalDate monthIter = startDate.withDayOfMonth(1);
        while (!monthIter.isAfter(endDate)) {
            payrollManagementService.calculateAndSavePayroll(employeeId, monthIter);
            monthIter = monthIter.plusMonths(1);
        }

        // ✅ Add Notification (copied from other method)
        String formattedStartDate = startDate.format(DATE_FORMATTER);
        String formattedEndDate = endDate.format(DATE_FORMATTER);

        String msg = "Your attendance from " + formattedStartDate + " to " + formattedEndDate
                + " have been frozen by your manager.";
        sendNotificationToEmployee(emp, msg); // <-- Reuse the same method
    }

    private void sendNotificationToEmployee(Employee emp, String message) {
        if (emp == null)
            return;

        Notification notification = new Notification();
        notification.setEmployeeId(emp.getEmployeeId());
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));

        notification.setRead(false);
        notificationRepository.save(notification);

        emailService.sendEmail(emp.getEmail(), "Timesheet Frozen Notification", message);
    }

    private void sendNotification(Employee emp, String subject, String message) {
        if (emp == null)
            return;

        Notification notification = new Notification();
        notification.setEmployeeId(emp.getEmployeeId());
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);
        notificationRepository.save(notification);

        if (emp.getEmail() != null && !emp.getEmail().trim().isEmpty()) {
            emailService.sendEmail(emp.getEmail(), subject, message);
        }
    }

    private String getShortEmployeeId(String employeeId) {
        if (employeeId == null) {
            return "";
        }
        int index = employeeId.indexOf('_');
        if (index != -1 && index < employeeId.length() - 1) {
            return employeeId.substring(index + 1);
        }
        return employeeId;
    }

    private void checkAndSendLessThanNineHoursNotification(Employee emp, LocalDate date, double totalHours) {
        if (totalHours < 9.0) {
            String subject = "Timesheet Alert: Working Hours Less Than 9 Hours";
            String msg = "Your timesheet submission for " + date.format(DATE_FORMATTER) + " shows less than 9 hours of work (" + totalHours + " hours).";

            sendNotification(emp, subject, msg);

            if (emp.getAssignedManagerId() != null && !emp.getAssignedManagerId().trim().isEmpty()) {
                Optional<Employee> managerOpt = employeeRepository.findByEmployeeId(emp.getAssignedManagerId());
                if (managerOpt.isPresent()) {
                    String managerMsg = "Employee " + emp.getFirstName() + " " + emp.getLastName() + " (" + getShortEmployeeId(emp.getEmployeeId()) + ") submitted a timesheet for " + date.format(DATE_FORMATTER) + " with less than 9 hours (" + totalHours + " hours).";
                    sendNotification(managerOpt.get(), subject, managerMsg);
                }
            }
        }
    }

    /** Check if date is frozen */
    public boolean isDateFrozen(String employeeId, LocalDate date) {
        return dailyEntryRepository.findByEmployeeIdAndDate(employeeId, date)
                .map(DailyEntry::isFrozen)
                .orElse(false);
    }

    private DailyEntryDTO mapToDTO(DailyEntry entry) {

        DailyEntryDTO dto = new DailyEntryDTO();

        dto.setId(entry.getId());
        dto.setDate(entry.getDate());
        dto.setClientId(entry.getClientId());
        dto.setClientName(entry.getClientName());
        dto.setProjectId(entry.getProjectId());
        dto.setProjectName(entry.getProjectName());
        dto.setLoginTime(entry.getLoginTime());
        dto.setLogoutTime(entry.getLogoutTime());
        dto.setTotalHours(entry.getTotalHours());
        dto.setRemarks(entry.getRemarks());
        dto.setWorkLocation(entry.getWorkLocation());
        dto.setLoginWorkLocation(entry.getLoginWorkLocation());
        dto.setLogoutWorkLocation(entry.getLogoutWorkLocation());
        dto.setStatus(entry.getStatus());
        dto.setFrozen(entry.isFrozen());

        dto.setEmployeeId(entry.getEmployeeId());

        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(entry.getEmployeeId());

        if (employeeOpt.isPresent()) {

            Employee employee = employeeOpt.get();

            // ✅ EMPLOYEE NAME
            dto.setEmployeeFirstName(employee.getFirstName());
            dto.setEmployeeLastName(employee.getLastName());

            // ✅ MANAGER
            dto.setManagerId(employee.getAssignedManagerId());
            if (employee.getAssignedManagerId() != null) {
                employeeRepository.findByEmployeeId(employee.getAssignedManagerId())
                        .ifPresent(manager -> {
                            dto.setManagerFirstName(manager.getFirstName());
                            dto.setManagerLastName(manager.getLastName());
                        });
            }

            // ✅ HR
            dto.setHrId(employee.getAssignedHrId());
            if (employee.getAssignedHrId() != null) {
                employeeRepository.findByEmployeeId(employee.getAssignedHrId())
                        .ifPresent(hr -> {
                            dto.setHrFirstName(hr.getFirstName());
                            dto.setHrLastName(hr.getLastName());
                        });
            }

        } else {
            dto.setEmployeeFirstName(null);
            dto.setEmployeeLastName(null);
            dto.setManagerId(null);
            dto.setManagerFirstName(null);
            dto.setManagerLastName(null);
            dto.setHrId(null);
            dto.setHrFirstName(null);
            dto.setHrLastName(null);
        }

        return dto;
    }

    // ✅ NEW: Fetch notifications for an employee
    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    // ✅ NEW: Mark notification as read
    public String markNotificationAsRead(Long id) {
        Optional<Notification> optional = notificationRepository.findById(id);
        if (optional.isPresent()) {
            Notification notif = optional.get();
            notif.setRead(true);
            notificationRepository.save(notif);
            return "Notification marked as read.";
        } else {
            return "Notification not found.";
        }
    }

    @Transactional
    public void unfreezeTimesheets(String managerId, String employeeId,
            LocalDate startDate, LocalDate endDate) {

        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        // ✅ Manager authorization check
        if (!managerId.equals(emp.getAssignedManagerId())) {
            throw new IllegalStateException(
                    "Manager not authorized to unfreeze timesheets for employee: " + employeeId);
        }

        List<DailyEntry> frozenEntries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, startDate,
                endDate);

        for (DailyEntry entry : frozenEntries) {
            entry.setFrozen(false); // ✅ UNFREEZE
        }

        dailyEntryRepository.saveAll(frozenEntries);

        // ✅ Trigger payroll update for all months in the range
        LocalDate monthIter = startDate.withDayOfMonth(1);
        while (!monthIter.isAfter(endDate)) {
            payrollManagementService.calculateAndSavePayroll(employeeId, monthIter);
            monthIter = monthIter.plusMonths(1);
        }

        // ✅ Send Notification
        String msg = "Your attendance from " + startDate + " to " + endDate + " have been UNFROZEN by your manager.";
        sendNotificationToEmployee(emp, msg);
    }

    public List<DailyEntryDTO> getFilteredEntries(String employeeId, Long clientId, Long projectId, String status,
            LocalDate startDate, LocalDate endDate) {
        List<DailyEntry> entries = dailyEntryRepository
                .findAll((Specification<DailyEntry>) (root, query, criteriaBuilder) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    String tenantId = getCurrentUserTenantId();
                    if (tenantId != null && !tenantId.trim().isEmpty()) {
                        List<String> tenantEmployeeIds = employeeRepository.findByTenantId(tenantId).stream()
                                .map(Employee::getEmployeeId).toList();
                        if (tenantEmployeeIds.isEmpty()) {
                            predicates.add(criteriaBuilder.disjunction());
                        } else {
                            predicates.add(root.get("employeeId").in(tenantEmployeeIds));
                        }
                    }

                    if (employeeId != null && !employeeId.trim().isEmpty()) {
                        String[] ids = employeeId.split(",");
                        if (ids.length > 1) {
                            List<String> idList = Arrays.stream(ids).map(String::trim).filter(s -> !s.isEmpty())
                                    .toList();
                            predicates.add(root.get("employeeId").in(idList));
                        } else {
                            predicates.add(criteriaBuilder.equal(root.get("employeeId"), employeeId.trim()));
                        }
                    }
                    if (clientId != null) {
                        predicates.add(criteriaBuilder.equal(root.get("clientId"), clientId));
                    }
                    if (projectId != null) {
                        predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
                    }
                    if (status != null && !status.trim().isEmpty() && !"All".equalsIgnoreCase(status)) {
                        if ("Frozen".equalsIgnoreCase(status)) {
                            predicates.add(criteriaBuilder.isTrue(root.get("frozen")));
                        } else if ("Active".equalsIgnoreCase(status)) {
                            predicates.add(criteriaBuilder.isFalse(root.get("frozen")));
                        }
                    }
                    if (startDate != null) {
                        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("date"), startDate));
                    }
                    if (endDate != null) {
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("date"), endDate));
                    }

                    return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
                });

        return entries.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
}
