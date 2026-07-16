package com.register.example.repository;

import com.register.example.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, String> {

        boolean existsByEmail(String email);

        boolean existsByContactNo(String contactNo);

        boolean existsByPersonalMail(String personalMail);

        // ⭐ NEW: Exists methods to safely check duplicates without
        // NonUniqueResultException
        boolean existsByAadharNo(String aadharNo);

        boolean existsByPanNo(String panNo);

        // --- Methods for Unique Field Lookups (Validation) ---

        // Find employee by email (usually for login/unique identifier)
        Optional<Employee> findByEmail(String email);

        // Find employee by employee ID (primary unique business key)
        Optional<Employee> findByEmployeeId(String employeeId);

        // Find employee by Aadhaar number (required for unique validation from
        // frontend)
        Optional<Employee> findByAadharNo(String aadharNo);

        // Find employee by PAN number (required for unique validation from frontend)
        Optional<Employee> findByPanNo(String panNo);

        @Query(value = "SELECT * FROM employee_portal " +
                        "WHERE employee_id LIKE 'X%'" + // Only consider IDs starting with 'X'
                        "ORDER BY CAST(SUBSTRING(employee_id, 2) AS SIGNED) DESC LIMIT 1", // MySQL/H2 Syntax
                        nativeQuery = true)
        Optional<Employee> findLastEmployeeByNumericId();

        // --- Methods for Role-Based Employee Retrieval (Reporting/Hierarchy) ---

        // Find all employees managed by a specific Manager ID
        List<Employee> findByAssignedManagerId(String managerId);

        // Find all employees reviewed by a specific Reviewer ID
        List<Employee> findByReviewerId(String reviewerId);

        // Find all employees assigned to a specific Finance ID
        List<Employee> findByAssignedFinanceId(String financeId);

        // Find all employees assigned to a specific HR ID
        List<Employee> findByAssignedHrId(String hrId);

        // Additional helpful method for Admin/All roles
        List<Employee> findByAssignedAdminId(String adminId);

        List<Employee> findByTravelAdmin(String travelAdmin);

        @Query("SELECT e FROM Employee e WHERE LOWER(e.active) = LOWER(:active)")
        List<Employee> findByActive(@Param("active") String active);

        @Query("SELECT LOWER(e.employeeId) FROM Employee e WHERE LOWER(e.employeeId) IN :ids")
        List<String> findExistingEmployeeIds(@Param("ids") List<String> ids);

        // --- Methods for Eligibility Rules ---

        @Query("SELECT DISTINCT e.workLocation FROM Employee e WHERE e.workLocation IS NOT NULL AND e.workLocation != '' ORDER BY e.workLocation")
        List<String> findDistinctWorkLocations();

        @Query("SELECT DISTINCT e.workLocation FROM Employee e WHERE e.workLocation IS NOT NULL AND e.workLocation != '' AND (:tenantId IS NULL OR e.tenantId = :tenantId) ORDER BY e.workLocation")
        List<String> findDistinctWorkLocationsByTenantId(@Param("tenantId") String tenantId);

        @Query("SELECT DISTINCT e.role FROM Employee e WHERE e.role IS NOT NULL AND e.role != '' ORDER BY e.role")
        List<String> findDistinctRoles();

        @Query("SELECT DISTINCT e.role FROM Employee e WHERE e.role IS NOT NULL AND e.role != '' AND (:tenantId IS NULL OR e.tenantId = :tenantId) ORDER BY e.role")
        List<String> findDistinctRolesByTenantId(@Param("tenantId") String tenantId);

        @Query("SELECT DISTINCT e.gender FROM Employee e WHERE e.gender IS NOT NULL AND e.gender != '' ORDER BY e.gender")
        List<String> findDistinctGenders();

        @Query("SELECT DISTINCT e.gender FROM Employee e WHERE e.gender IS NOT NULL AND e.gender != '' AND (:tenantId IS NULL OR e.tenantId = :tenantId) ORDER BY e.gender")
        List<String> findDistinctGendersByTenantId(@Param("tenantId") String tenantId);

        @Query("""
                        SELECT e FROM Employee e
                        WHERE (:employeeIds IS NULL OR e.employeeId IN :employeeIds)
                        AND (:role IS NULL OR LOWER(e.role) LIKE LOWER(CONCAT('%', :role, '%')))
                        AND (:workLocation IS NULL OR LOWER(e.workLocation) LIKE LOWER(CONCAT('%', :workLocation, '%')))
                        AND (:gender IS NULL OR :gender = '' OR LOWER(e.gender) = LOWER(:gender))
                        AND (:contactNo IS NULL OR :contactNo = '' OR e.contactNo LIKE CONCAT('%', :contactNo, '%'))
                        AND (:startDate IS NULL OR e.joiningDate >= :startDate)
                        AND (:endDate IS NULL OR e.joiningDate <= :endDate)
                        AND (:tenantId IS NULL OR e.tenantId = :tenantId)
                        ORDER BY e.joiningDate DESC
                        """)
        List<Employee> getMasterDataReport(
                        @Param("employeeIds") List<String> employeeIds,
                        @Param("role") String role,
                        @Param("workLocation") String workLocation,
                        @Param("gender") String gender,
                        @Param("contactNo") String contactNo,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDate") java.time.LocalDate endDate,
                        @Param("tenantId") String tenantId);

        @Query("SELECT DISTINCT e.gender FROM Employee e WHERE e.gender IS NOT NULL AND e.gender != ''")
        List<String> findDistinctGendersOnly();

        @Query("SELECT DISTINCT e.gender FROM Employee e WHERE e.gender IS NOT NULL AND e.gender != '' AND (:tenantId IS NULL OR e.tenantId = :tenantId)")
        List<String> findDistinctGendersOnlyByTenantId(@Param("tenantId") String tenantId);

        List<Employee> findByEmployeeIdIn(List<String> employeeIds);

        // Find employees by department (for external API)
        List<Employee> findByDepartment(String department);

        // Find employees by tenant ID
        List<Employee> findByTenantId(String tenantId);

        @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL AND e.department != '' ORDER BY e.department")
        List<String> findDistinctDepartments();

        @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL AND e.department != '' AND (:tenantId IS NULL OR e.tenantId = :tenantId) ORDER BY e.department")
        List<String> findDistinctDepartmentsByTenantId(@Param("tenantId") String tenantId);

        // --- Methods for Analytics ---
        long countByDepartmentAndActive(String department, String active);
}
