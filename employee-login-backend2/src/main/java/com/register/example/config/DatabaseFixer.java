package com.register.example.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DatabaseFixer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseFixer.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        tryExecuteSql("Attempting to remove unique constraint from global_settings...", 
                      "ALTER TABLE global_settings DROP INDEX UKdwhdppkpwfs2m7id2b8it40o0");
        tryExecuteSql("Attempting to drop subcategory column from employee_handbook...", 
                      "ALTER TABLE employee_handbook DROP COLUMN subcategory");
        tryExecuteSql("Attempting to drop sub_category column from employee_handbook...", 
                      "ALTER TABLE employee_handbook DROP COLUMN sub_category");
        tryExecuteSql("Attempting to drop uploaded_by column from employee_handbook...", 
                      "ALTER TABLE employee_handbook DROP COLUMN uploaded_by");
        tryExecuteSql("Attempting to drop active column from employee_handbook...", 
                      "ALTER TABLE employee_handbook DROP COLUMN active");

        dropAssetCategoriesConstraints();
        dropAssetConditionsConstraints();
        dropAssetMasterConstraints();
    }

    private void tryExecuteSql(String message, String sql) {
        try {
            logger.info(message);
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            logger.info("Note: Failed operation: {} - Error: {}", message, e.getMessage());
        }
    }

    private void dropAssetCategoriesConstraints() {
        try {
            logger.info("Attempting to dynamically drop the global unique constraint on asset_categories.name...");
            String findConstraintSql = "SELECT CONSTRAINT_NAME " +
                    "FROM information_schema.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_SCHEMA = DATABASE() " +
                    "AND TABLE_NAME = 'asset_categories' " +
                    "AND COLUMN_NAME = 'name' " +
                    "AND CONSTRAINT_NAME != 'PRIMARY'";
            
            java.util.List<String> constraintNames = jdbcTemplate.queryForList(findConstraintSql, String.class);
            for (String constraintName : constraintNames) {
                logger.info("Found constraint on asset_categories.name: {}. Attempting to drop...", constraintName);
                dropConstraintOrIndex("asset_categories", constraintName);
            }
        } catch (Exception e) {
            logger.error("Failed while trying to clean up asset_categories constraints: {}", e.getMessage());
        }
    }

    private void dropAssetConditionsConstraints() {
        try {
            logger.info("Attempting to dynamically drop the global unique constraint on asset_conditions...");
            String findConstraintSql = "SELECT DISTINCT CONSTRAINT_NAME " +
                    "FROM information_schema.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_SCHEMA = DATABASE() " +
                    "AND TABLE_NAME = 'asset_conditions' " +
                    "AND COLUMN_NAME IN ('type', 'value') " +
                    "AND CONSTRAINT_NAME != 'PRIMARY'";
            
            java.util.List<String> constraintNames = jdbcTemplate.queryForList(findConstraintSql, String.class);
            for (String constraintName : constraintNames) {
                logger.info("Found constraint on asset_conditions: {}. Attempting to drop...", constraintName);
                dropConstraintOrIndex("asset_conditions", constraintName);
            }
        } catch (Exception e) {
            logger.error("Failed while trying to clean up asset_conditions constraints: {}", e.getMessage());
        }
    }

    private void dropAssetMasterConstraints() {
        try {
            logger.info("Attempting to dynamically drop the global unique constraint on asset_master.asset_tag and asset_master.serial_number...");
            String findConstraintSql = "SELECT DISTINCT CONSTRAINT_NAME " +
                    "FROM information_schema.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_SCHEMA = DATABASE() " +
                    "AND TABLE_NAME = 'asset_master' " +
                    "AND COLUMN_NAME IN ('asset_tag', 'serial_number') " +
                    "AND CONSTRAINT_NAME != 'PRIMARY'";
            
            java.util.List<String> constraintNames = jdbcTemplate.queryForList(findConstraintSql, String.class);
            for (String constraintName : constraintNames) {
                logger.info("Found constraint on asset_master: {}. Attempting to drop...", constraintName);
                dropConstraintOrIndex("asset_master", constraintName);
            }
        } catch (Exception e) {
            logger.error("Failed while trying to clean up asset_master constraints: {}", e.getMessage());
        }
    }

    private void dropConstraintOrIndex(String tableName, String constraintName) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP INDEX " + constraintName);
            logger.info("Successfully dropped constraint {}", constraintName);
        } catch (Exception e) {
            logger.info("Failed to drop constraint {} as index, trying as constraint: {}", constraintName, e.getMessage());
            try {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP CONSTRAINT " + constraintName);
                logger.info("Successfully dropped constraint {}", constraintName);
            } catch (Exception ex) {
                 logger.info("Failed to drop constraint {} as constraint: {}", constraintName, ex.getMessage());
            }
        }
    }
}
