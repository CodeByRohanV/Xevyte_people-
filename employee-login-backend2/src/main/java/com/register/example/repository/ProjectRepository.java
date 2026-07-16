package com.register.example.repository;

import com.register.example.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {

	// Find projects by a single SOW ID
	List<Project> findBySowSowId(Long sowId);

	// Find projects by multiple SOW IDs
	List<Project> findBySowSowIdIn(List<Long> sowIds);

	@Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Project p WHERE p.projectName = :projectName AND p.sow.sowId = :sowId")
	boolean existsByProjectNameAndSowSowId(@Param("projectName") String projectName, @Param("sowId") Long sowId);

	@Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Project p WHERE p.projectName = :projectName AND p.sow.sowId = :sowId AND p.tenantId = :tenantId")
	boolean existsByProjectNameAndSowSowIdAndTenantId(@Param("projectName") String projectName, @Param("sowId") Long sowId, @Param("tenantId") String tenantId);

	@Query("""
			SELECT DISTINCT p FROM Project p
			JOIN Allocation a ON a.project = p
			WHERE p.sow.customer.customerId = :customerId
			AND a.employeeId = :employeeId
			""")
	List<Project> findProjectsByCustomerAndEmployee(
			Long customerId,
			String employeeId);

	List<Project> findByTenantId(String tenantId);

	List<Project> findBySowSowIdAndTenantId(Long sowId, String tenantId);

	List<Project> findBySowSowIdInAndTenantId(List<Long> sowIds, String tenantId);

	@Query("SELECT MAX(p.tenantProjectId) FROM Project p WHERE p.tenantId = :tenantId")
	Long findMaxTenantProjectIdByTenantId(@Param("tenantId") String tenantId);

	@Query("SELECT MAX(p.tenantProjectId) FROM Project p WHERE p.tenantId IS NULL OR p.tenantId = ''")
	Long findMaxTenantProjectIdWithoutTenant();
}
