package com.register.example.service;

import com.register.example.entity.Holiday;
import com.register.example.repository.HolidayRepository;
import com.register.example.repository.EmployeeRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.DateUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;


import java.io.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.List;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final EmployeeRepository employeeRepository;

    public HolidayService(HolidayRepository holidayRepository, EmployeeRepository employeeRepository) {
        this.holidayRepository = holidayRepository;
        this.employeeRepository = employeeRepository;
    }

    /*=====================================================================
                           FETCH ALL HOLIDAYS
    =====================================================================*/
    public List<Holiday> getAllHolidays() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return holidayRepository.findByTenantId(tenantId);
        }
        return holidayRepository.findAll();
    }

    /*=====================================================================
                            UPLOAD FILE HANDLER
    =====================================================================*/
    @Transactional
    public String uploadHolidayFile(MultipartFile file, String location) {
        try {
            if (file == null || file.isEmpty()) {
                return "Please upload a file.";
            }

            String filename = file.getOriginalFilename();
            if (filename == null) return "Invalid file.";

            filename = filename.toLowerCase();

            String tenantId = getCurrentTenantId();
            List<Holiday> holidayList;

            if (filename.endsWith(".csv")) {
                holidayList = parseCsv(file.getInputStream(), location, tenantId);
            } else {
                holidayList = parseExcel(file.getInputStream(), location, tenantId);
            }

            if (holidayList.isEmpty()) {
                return "Sheet processed but contains no valid data.";
            }

            // ✅ DELETE *ALL OLD HOLIDAYS* FOR THIS LOCATION & TENANT (ALL YEARS)
            if (tenantId != null && !tenantId.isEmpty()) {
                holidayRepository.deleteByLocationAndTenantId(location, tenantId);
            } else {
                holidayRepository.deleteByLocation(location);
            }

            // ✅ INSERT NEW HOLIDAYS
            holidayRepository.saveAll(holidayList);

            return "✅ Holidays replaced successfully for location: "
                    + location + ". Total records: " + holidayList.size();

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }



    /*=====================================================================
                       STRICT DATE VALIDATION (dd-MM-yyyy)
    =====================================================================*/
    private LocalDate strictDate(String dateStr, int rowNum) throws Exception {
        if (dateStr == null) {
            throw new Exception("Date value is null at row " + rowNum);
        }
        String cleanDate = dateStr.trim().replace("/", "-");
        try {
            DateTimeFormatter fmt4 = DateTimeFormatter.ofPattern("dd-MM-uuuu")
                    .withResolverStyle(ResolverStyle.STRICT);
            return LocalDate.parse(cleanDate, fmt4);
        } catch (Exception ex1) {
            try {
                DateTimeFormatter fmt2 = DateTimeFormatter.ofPattern("dd-MM-yy")
                        .withResolverStyle(ResolverStyle.STRICT);
                return LocalDate.parse(cleanDate, fmt2);
            } catch (Exception ex2) {
                throw new Exception("Invalid date at row " + rowNum + ": " + dateStr +
                        ". Required format: dd-MM-yyyy and must be a valid calendar date.");
            }
        }
    }

    /*=====================================================================
                       VALIDATE DAY OF WEEK (MON/TUE/WED...)
    =====================================================================*/
    private void validateDay(LocalDate date, String givenDay, int rowNum) throws Exception {

        if (givenDay == null || givenDay.trim().isEmpty()) {
            throw new Exception("Day value is empty at row " + rowNum);
        }

        String expectedFull = date.getDayOfWeek().name();  // MONDAY
        String given = givenDay.trim().toUpperCase();

        // Allow only FULL day names (Monday, Tuesday, etc.)
        if (!given.equals(expectedFull)) {
            throw new Exception(
                    "Invalid day at row " + rowNum +
                    " for date " + date +
                    ". Expected full day name: " + expectedFull +
                    ", Found: " + givenDay
            );
        }
    }



    /*=====================================================================
                         PARSE CSV FILE
    =====================================================================*/
    private List<Holiday> parseCsv(InputStream is, String location, String tenantId)
    throws Exception {

        List<Holiday> list = new ArrayList<>();
        BufferedReader br = new BufferedReader(new InputStreamReader(is));

        String line;
        boolean header = true;
        int row = 1;

        while ((line = br.readLine()) != null) {

            if (header) { header = false; continue; }
            row++;

            String[] cols = line.split(",");

            if (cols.length < 3) {
                throw new Exception("Row " + row + " is incomplete.");
            }

            String dateStr = cols[0].trim().replace("\"", "");
            String day = cols[1].trim().replace("\"", "");
            String name = cols[2].trim().replace("\"", "");

            if (dateStr.isEmpty() || day.isEmpty() || name.isEmpty()) {
                throw new Exception("Row " + row + " has empty values. All 3 columns must be filled.");
            }

            LocalDate date = strictDate(dateStr, row);
            validateDay(date, day, row);

            list.add(new Holiday(date, day, name, location, tenantId));

        }

        return list;
    }


    /*=====================================================================
                         PARSE EXCEL FILE
    =====================================================================*/
    private List<Holiday> parseExcel(InputStream is, String location, String tenantId)
    throws Exception {

        List<Holiday> list = new ArrayList<>();

        try (Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);

            if (sheet.getLastRowNum() < 1) {
                throw new Exception("Sheet is empty. Please fill data before uploading.");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {

                Row row = sheet.getRow(i);
                if (row == null) continue;

                int rowNum = i + 1;

                /*-------------------- FETCH DATE --------------------*/
                Cell dateCell = row.getCell(0);
                if (dateCell == null) {
                    throw new Exception("Row " + rowNum + " date is empty.");
                }

                LocalDate date;
                String dateStr;

                if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {

                    date = dateCell.getLocalDateTimeCellValue().toLocalDate();
                    dateStr = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

                } else {
                    dateStr = dateCell.toString().trim();
                    date = strictDate(dateStr, rowNum);
                }

                /*-------------------- FETCH DAY --------------------*/
                Cell dayCell = row.getCell(1);
                if (dayCell == null) {
                    throw new Exception("Row " + rowNum + " day is empty.");
                }

                String day = dayCell.toString().trim();
                validateDay(date, day, rowNum);

                /*-------------------- FETCH HOLIDAY NAME --------------------*/
                Cell nameCell = row.getCell(2);
                if (nameCell == null) {
                    throw new Exception("Row " + rowNum + " holiday name is empty.");
                }

                String name = nameCell.toString().trim();
                if (name.isEmpty()) {
                    throw new Exception("Row " + rowNum + " holiday name cannot be empty.");
                }

                list.add(new Holiday(date, day, name, location, tenantId));

            }
        }
        return list;
    }
    
    public List<Holiday> getHolidaysInDateRange(LocalDate start, LocalDate end) {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return holidayRepository.findByDateBetweenAndTenantId(start, end, tenantId);
        }
        return holidayRepository.findByDateBetween(start, end);
    }

    
    /*=====================================================================
    BASIC CRUD METHODS FOR HOLIDAYS
    =====================================================================*/

    public List<Holiday> getAll() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return holidayRepository.findByTenantId(tenantId);
        }
        return holidayRepository.findAll();
    }

    public Holiday create(Holiday holiday) {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            holiday.setTenantId(tenantId);
        }
        return holidayRepository.save(holiday);
    }

    public Holiday update(Long id, Holiday updated) {
        return holidayRepository.findById(id)
        .map(h -> {
            h.setDate(updated.getDate());
            h.setDay(updated.getDay());
            h.setHoliday(updated.getHoliday());
            return holidayRepository.save(h);
        })
        .orElseThrow(() -> new RuntimeException("Holiday not found with ID " + id));
    }

    public void delete(Long id) {
        holidayRepository.deleteById(id);
    }

    public java.util.Optional<Holiday> getById(Long id) {
        return holidayRepository.findById(id);
    }

    public java.util.Optional<Holiday> getByDate(LocalDate date) {
        List<Holiday> holidays = getAll();
        return holidays.stream()
        .filter(h -> h.getDate().equals(date))
        .findFirst();
    }

    public List<Holiday> getByMonth(int year, int month) {
        List<Holiday> holidays = getAll();
        return holidays.stream()
        .filter(h -> h.getDate().getYear() == year && h.getDate().getMonthValue() == month)
        .toList();
    }

    public List<Holiday> getByYear(int year) {
        List<Holiday> holidays = getAll();
        return holidays.stream()
        .filter(h -> h.getDate().getYear() == year)
        .toList();
    }

    public List<Holiday> getHolidaysByLocation(String location) {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return holidayRepository.findByLocationIgnoreCaseAndTenantId(location, tenantId);
        }
        return holidayRepository.findByLocationIgnoreCase(location);
    }

    public List<Holiday> getHolidaysByLocationAndTenant(String location, String tenantId) {
        if (tenantId != null && !tenantId.isEmpty()) {
            return holidayRepository.findByLocationIgnoreCaseAndTenantId(location, tenantId);
        }
        return holidayRepository.findByLocationIgnoreCase(location);
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }
}
