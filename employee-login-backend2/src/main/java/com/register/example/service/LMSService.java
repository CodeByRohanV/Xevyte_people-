package com.register.example.service;

import com.register.example.entity.LMS;
import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.LMSRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;
import com.register.example.dto.LMSTrainingDTO;

@Service
public class LMSService {

    @Autowired
    private LMSRepository lmsRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public LMS saveTraining(LMS lms) {
        if (lms.getProgress() == null)
            lms.setProgress(0);
        if (lms.getStatus() == null)
            lms.setStatus("Pending");
        return lmsRepository.save(lms);
    }

    public List<LMS> saveTrainings(List<LMS> lmsList) {
        for (LMS lms : lmsList) {
            if (lms.getProgress() == null)
                lms.setProgress(0);
            if (lms.getStatus() == null)
                lms.setStatus("Pending");
        }
        return lmsRepository.saveAll(lmsList);
    }

    public List<LMS> assignToAll(LMS trainingTemplate) {
        List<Employee> allEmployees = employeeRepository.findAll();
        List<LMS> assignments = new ArrayList<>();

        for (Employee emp : allEmployees) {
            LMS assignment = new LMS();
            assignment.setTrainingName(trainingTemplate.getTrainingName());
            assignment.setStartDate(trainingTemplate.getStartDate());
            assignment.setEmployeeId(emp.getEmployeeId());
            assignment.setDeadline(trainingTemplate.getDeadline());
            assignment.setDescription(trainingTemplate.getDescription());
            assignment.setCategory(trainingTemplate.getCategory());
            assignment.setAssignedBy(trainingTemplate.getAssignedBy());
            assignment.setStatus("Pending");
            assignment.setProgress(0);
            assignments.add(assignment);
        }

        return lmsRepository.saveAll(assignments);
    }

    public List<LMS> getAllTrainings() {
        return lmsRepository.findAll();
    }

    public List<LMS> getTrainingsByEmployeeId(String employeeId) {
        return lmsRepository.findByEmployeeId(employeeId);
    }

    public List<LMS> getTrainingsByEmployeeAndCategory(String employeeId, String category) {
        return lmsRepository.findByEmployeeIdAndCategory(employeeId, category);
    }

    public Optional<LMS> getTrainingById(Long id) {
        return lmsRepository.findById(id);
    }

    public void deleteTraining(Long id) {
        lmsRepository.deleteById(id);
    }

    public LMS updateProgress(Long id, Integer progress) {
        Optional<LMS> lmsOpt = lmsRepository.findById(id);
        if (lmsOpt.isPresent()) {
            LMS lms = lmsOpt.get();
            lms.setProgress(progress);
            if (progress >= 100) {
                lms.setStatus("Completed");
            } else if (progress > 0) {
                lms.setStatus("In Progress");
            }
            return lmsRepository.save(lms);
        }
        return null;
    }

    public LMS updateStatus(Long id, String status) {
        Optional<LMS> lmsOpt = lmsRepository.findById(id);
        if (lmsOpt.isPresent()) {
            LMS lms = lmsOpt.get();
            lms.setStatus(status);
            if ("Completed".equalsIgnoreCase(status)) {
                lms.setProgress(100);
            } else if ("Pending".equalsIgnoreCase(status)) {
                lms.setProgress(0);
            }
            return lmsRepository.save(lms);
        }
        return null;
    }

    public List<LMSTrainingDTO> getTeamTrainings(String managerId) {
        List<Employee> teamEmployees = employeeRepository.findByAssignedManagerId(managerId);
        List<String> employeeIds = teamEmployees.stream()
                .map(Employee::getEmployeeId)
                .collect(Collectors.toList());

        if (employeeIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<LMS> lmsRecords = lmsRepository.findByEmployeeIdIn(employeeIds);
        
        Map<String, String> employeeNameMap = teamEmployees.stream()
                .collect(Collectors.toMap(Employee::getEmployeeId, 
                        e -> e.getFirstName() + " " + e.getLastName(),
                        (existing, replacement) -> existing));

        return lmsRecords.stream().map(lms -> {
            LMSTrainingDTO dto = new LMSTrainingDTO();
            dto.setId(lms.getId());
            dto.setTrainingName(lms.getTrainingName());
            dto.setEmployeeId(lms.getEmployeeId());
            dto.setEmployeeName(employeeNameMap.getOrDefault(lms.getEmployeeId(), "Unknown"));
            dto.setStartDate(lms.getStartDate());
            dto.setDeadline(lms.getDeadline());
            dto.setStatus(lms.getStatus());
            dto.setCategory(lms.getCategory());
            dto.setDescription(lms.getDescription());
            return dto;
        }).collect(Collectors.toList());
    }
}
