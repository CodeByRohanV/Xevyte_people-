package com.register.example.service;

import com.register.example.dto.RowError;
import com.register.example.entity.AssetCategory;
import com.register.example.entity.AssetFieldConfig;
import com.register.example.entity.AssetMaster;
import com.register.example.entity.AssetDropdownOption;
import com.register.example.repository.AssetCategoryRepository;
import com.register.example.repository.AssetDropdownOptionRepository;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class AssetBulkService {

    private static final String TEMPLATE_COLUMN = "TEMPLATE_COLUMN";
    private static final String NON_ALPHANUMERIC_REGEX = "[^a-zA-Z0-9]";
    private static final String PRICE = "price";
    private static final String VALUE = "value";
    private static final String PURCHASEPRICE = "purchaseprice";
    private static final String ASSETPRICE = "assetprice";
    private static final String PURCHASECOST = "purchasecost";
    private static final String INVALID_FILE_FORMAT = "Invalid file format. Please upload only .xlsx, .xls, or .csv files.";
    private static final String DEBUG_ROW = "DEBUG: Row ";
    private static final String UNCATEGORIZED = "Uncategorized";
    private static final String DATE_FORMAT_TEMPLATE = "%04d-%02d-%02d";

    @Autowired
    private AssetCategoryRepository categoryRepository;

    @Autowired
    private AssetMasterService assetMasterService;

    @Autowired
    private AssetDropdownOptionRepository dropdownOptionRepository;

    private List<AssetDropdownOption> getTemplateColumns(String tenantId) {
        List<AssetDropdownOption> cols = new ArrayList<>();
        if (tenantId != null && !tenantId.isEmpty()) {
            cols.addAll(dropdownOptionRepository.findByTypeAndTenantIdOrderBySortOrderAsc(TEMPLATE_COLUMN, tenantId));
        }
        // Also add global ones (tenantId is null)
        List<AssetDropdownOption> globalCols = dropdownOptionRepository.findByTypeOrderBySortOrderAsc(TEMPLATE_COLUMN)
                .stream()
                .filter(opt -> opt.getTenantId() == null)
                .toList();
        cols.addAll(globalCols);

        // Remove duplicates by value (case-insensitive) just in case
        Map<String, AssetDropdownOption> uniqueMap = new LinkedHashMap<>();
        for (AssetDropdownOption opt : cols) {
            if (opt.getValue() != null) {
                uniqueMap.putIfAbsent(opt.getValue().toLowerCase().trim(), opt);
            }
        }
        return new ArrayList<>(uniqueMap.values());
    }

    public byte[] generateTemplate(List<String> specificFields, String tenantId) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Assets");

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Set<String> fieldsToInclude = resolveFieldsToInclude(specificFields, tenantId);

            int currentColumn = 0;
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            for (String fieldName : fieldsToInclude) {
                Cell cell = headerRow.createCell(currentColumn);
                cell.setCellValue(fieldName);
                cell.setCellStyle(headerStyle);

                applyFieldValidation(sheet, validationHelper, fieldName, currentColumn);

                currentColumn++;
            }

            for (int i = 0; i < currentColumn; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private Set<String> resolveFieldsToInclude(List<String> specificFields, String tenantId) {
        Set<String> fieldsToInclude = new LinkedHashSet<>();

        if (specificFields != null && !specificFields.isEmpty()) {
            // Load template columns to identify mandatory status
            List<AssetDropdownOption> templateColumnsForSpecific = getTemplateColumns(tenantId);
            Map<String, Boolean> mandatoryMap = new HashMap<>();
            for (AssetDropdownOption opt : templateColumnsForSpecific) {
                mandatoryMap.put(opt.getValue().toLowerCase().trim(), opt.getMandatory());
            }

            for (String field : specificFields) {
                if (!"Actions".equals(field)) {
                    String val = field;
                    // Check if this specific field is mandatory in our config
                    if (Boolean.TRUE.equals(mandatoryMap.get(field.toLowerCase().trim()))) {
                        val += " *";
                    }
                    fieldsToInclude.add(val);
                }
            }
        } else {
            // First, load template columns from Admin settings to understand the user's desired order
            List<AssetDropdownOption> templateColumns = getTemplateColumns(tenantId);

            // Strictly include ONLY template columns from Admin settings
            for (AssetDropdownOption option : templateColumns) {
                String val = option.getValue();
                // Add asterisk if mandatory to visually indicate to user
                if (Boolean.TRUE.equals(option.getMandatory())) {
                    val += " *";
                }
                fieldsToInclude.add(val);
            }
        }
        return fieldsToInclude;
    }

    private void applyFieldValidation(Sheet sheet, DataValidationHelper validationHelper, String fieldName, int currentColumn) {
        String cleanName = fieldName.replace("*", "").trim();
        String normName = cleanName.replaceAll(NON_ALPHANUMERIC_REGEX, "").toLowerCase();

        boolean isPrice = normName.contains(PRICE) || normName.equals("cost") || normName.equals(VALUE)
                || normName.equals(PURCHASEPRICE) || normName.equals(ASSETPRICE)
                || normName.equals(PURCHASECOST);
        boolean isWarrantyDate = (normName.contains("warranty") && (normName.contains("end")
                || normName.contains("expiry") || normName.contains("date") || normName.contains("until")))
                || normName.equals("warrantyenddate") || normName.equals("warrantyexpirydate");

        if (isPrice) {
            // Price validation: Decimal >= 0
            DataValidationConstraint constraint = validationHelper.createDecimalConstraint(
                    DataValidationConstraint.OperatorType.GREATER_OR_EQUAL, "0", null);
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, currentColumn, currentColumn);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            validation.setErrorStyle(DataValidation.ErrorStyle.STOP);
            validation.createErrorBox("Invalid Price", "Price must be a positive numeric value.");
            validation.setShowErrorBox(true);
            sheet.addValidationData(validation);
        } else if (isWarrantyDate) {
            // Allow any input (no strict Excel validation)
            DataValidationConstraint constraint = validationHelper.createCustomConstraint("TRUE");
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, currentColumn, currentColumn);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);

            // Optional: show helpful message instead of blocking
            validation.createPromptBox("Date Format",
                    "Enter date in DD-MM-YYYY (e.g., 15-04-2026)");
            validation.setShowPromptBox(true);

            sheet.addValidationData(validation);
        }
    }

    public ResponseEntity<Object> importAssets(MultipartFile file, String userId, String tenantId) throws Exception {
        List<String> results = new ArrayList<>();
        List<RowError> rowErrors = new ArrayList<>();
        try (InputStream is = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getLastRowNum() < 0) {
                return ResponseEntity.badRequest().body(INVALID_FILE_FORMAT);
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return ResponseEntity.badRequest().body(INVALID_FILE_FORMAT);
            }

            Map<Integer, String> headerMap = new HashMap<>();
            for (Cell cell : headerRow) {
                headerMap.put(cell.getColumnIndex(), getCellValueAsString(cell));
            }

            // Check if any mandatory columns are missing from the headers
            List<AssetDropdownOption> mandatoryColumns = getTemplateColumns(tenantId).stream()
                    .filter(col -> col.getMandatory() != null && col.getMandatory())
                    .toList();

            List<String> missingFields = new ArrayList<>();
            for (AssetDropdownOption col : mandatoryColumns) {
                boolean found = false;
                for (Map.Entry<Integer, String> headerEntry : headerMap.entrySet()) {
                    String cleanHeader = headerEntry.getValue() != null
                            ? headerEntry.getValue().replace("*", "").trim()
                            : "";
                    if (cleanHeader.equalsIgnoreCase(col.getValue().trim())) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    missingFields.add(col.getValue());
                }
            }

            if (!missingFields.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("missingFields", missingFields);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Count valid data rows first to prevent empty imports
            int validDataRowsCount = countValidDataRows(sheet);
            if (validDataRowsCount == 0) {
                return ResponseEntity.badRequest()
                        .body("The uploaded file does not contain any data rows. Please fill the template before uploading.");
            }

            // Validate all rows for mandatory/format errors
            validateRows(sheet, headerMap, rowErrors, tenantId);

            System.out.println("DEBUG: Final rowErrors count: " + rowErrors.size());

            // If there are validation errors, return them
            if (!rowErrors.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("rowErrors", rowErrors);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Import actual rows
            importValidRows(sheet, headerMap, results, userId, tenantId);

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.err.println("Import technical error: " + e.getMessage());
            e.printStackTrace();
            String errMsg = e.getMessage();
            if (errMsg != null && (errMsg.contains("POI") || errMsg.contains("Workbook") || errMsg.contains("headerRow")
                    || errMsg.contains("org.apache.poi") || errMsg.contains("iterator") || errMsg.contains("null"))) {
                return ResponseEntity.badRequest().body(INVALID_FILE_FORMAT);
            }
            return ResponseEntity.badRequest().body("Import failed: " + e.getMessage());
        }
    }

    private int countValidDataRows(Sheet sheet) {
        int count = 0;
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row r = sheet.getRow(i);
            if (r != null && !isRowEmpty(r)) {
                count++;
            }
        }
        return count;
    }

    private void validateRows(Sheet sheet, Map<Integer, String> headerMap, List<RowError> rowErrors, String tenantId) {
        List<AssetDropdownOption> allTemplateColumns = getTemplateColumns(tenantId);
        List<AssetDropdownOption> mandatoryTemplateColumns = allTemplateColumns.stream()
                .filter(col -> col.getMandatory() != null && col.getMandatory())
                .toList();

        System.out.println("DEBUG: Mandatory template columns found:");
        mandatoryTemplateColumns.forEach(col -> {
            System.out.println("  - " + col.getValue() + " (mandatory: " + col.getMandatory() + ")");
        });

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) {
                continue;
            }

            int rowNum = i + 1; // Excel row numbers start at 2 (header is row 1)

            // Validate mandatory fields
            validateMandatoryFieldsForRow(row, rowNum, headerMap, mandatoryTemplateColumns, rowErrors);

            // Validate price specific formats
            validatePriceFieldsForRow(row, rowNum, headerMap, rowErrors);
        }
    }

    private void validateMandatoryFieldsForRow(Row row, int rowNum, Map<Integer, String> headerMap,
                                               List<AssetDropdownOption> mandatoryTemplateColumns, List<RowError> rowErrors) {
        for (AssetDropdownOption col : mandatoryTemplateColumns) {
            int colIndex = -1;
            for (Map.Entry<Integer, String> headerEntry : headerMap.entrySet()) {
                String cleanHeader = headerEntry.getValue() != null
                        ? headerEntry.getValue().replace("*", "").trim()
                        : "";
                if (cleanHeader.equalsIgnoreCase(col.getValue())) {
                    colIndex = headerEntry.getKey();
                    break;
                }
            }

            String colValue = colIndex >= 0 ? getCellValueAsString(row.getCell(colIndex)) : "";

            if (isEmpty(colValue)) {
                rowErrors.add(new RowError(rowNum, col.getValue(), "Cannot be empty"));
            }
        }
    }

    private void validatePriceFieldsForRow(Row row, int rowNum, Map<Integer, String> headerMap, List<RowError> rowErrors) {
        for (Map.Entry<Integer, String> headerEntry : headerMap.entrySet()) {
            String header = headerEntry.getValue();
            if (header == null)
                continue;

            String normHeader = header.replaceAll(NON_ALPHANUMERIC_REGEX, "").toLowerCase();
            String val = getCellValueAsString(row.getCell(headerEntry.getKey())).trim();

            if (isEmpty(val))
                continue;

            boolean isPriceField = normHeader.contains(PRICE) || normHeader.equals("cost")
                    || normHeader.equals(VALUE)
                    || normHeader.equals(PURCHASEPRICE) || normHeader.equals(ASSETPRICE)
                    || normHeader.equals(PURCHASECOST);

            if (isPriceField) {
                System.out.println(DEBUG_ROW + rowNum + " - Validating Price field '" + header
                        + "' with value '" + val + "'");
                if (!val.matches("^[0-9]+(\\.[0-9]+)?$")) {
                    System.out.println(DEBUG_ROW + rowNum + " - Price validation FAILED for '" + val + "'");
                    rowErrors.add(new RowError(rowNum, header,
                            "Must be a numeric value (only numbers and optional decimal point)"));
                }
            }
        }
    }

    private void importValidRows(Sheet sheet, Map<Integer, String> headerMap, List<String> results, String userId, String tenantId) {
        List<AssetCategory> allCategories = (tenantId != null && !tenantId.isEmpty())
                ? categoryRepository.findByTenantId(tenantId)
                : categoryRepository.findAll();
        List<AssetDropdownOption> allTemplateColumns = getTemplateColumns(tenantId);

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row))
                continue;

            try {
                AssetMaster asset = new AssetMaster();
                Map<String, String> dynamicValues = new HashMap<>();

                // Identify sub-category columns
                TreeMap<Integer, String> subCategoryHeaders = identifySubCategoryHeaders(headerMap, allTemplateColumns);

                // Process standard & dynamic fields
                processFieldsForRow(row, i, headerMap, asset, dynamicValues, allTemplateColumns, allCategories, tenantId);

                // Process sub-categories
                processSubCategoriesForRow(row, headerMap, asset, dynamicValues, subCategoryHeaders, allCategories, tenantId);

                // Generate default values if missing
                ensureDefaultValues(asset, i, allCategories, tenantId);

                asset.setDynamicValues(dynamicValues);

                assetMasterService.createAsset(asset, userId, tenantId);
                String resultMsg = "Row " + (i + 1) + ": Success - " + asset.getAssetTag();
                if (dynamicValues.containsKey("_IMPORT_WARNING_ASSIGNMENT")) {
                    resultMsg += " (Warning: " + dynamicValues.get("_IMPORT_WARNING_ASSIGNMENT") + ")";
                }
                results.add(resultMsg);

            } catch (Exception e) {
                String errMsg = e.getMessage();
                if (errMsg != null && errMsg.contains("Duplicate entry")) {
                    if (errMsg.contains("serial_number")) {
                        errMsg = "Duplicate Serial Number found in another asset.";
                    } else if (errMsg.contains("asset_tag")) {
                        errMsg = "Duplicate Asset Tag found in another asset.";
                    } else {
                        errMsg = "This asset already exists in the system (Duplicate Entry).";
                    }
                }
                results.add("Row " + (i + 1) + ": Error - " + errMsg);
                System.out.println("DEBUG: Error processing row " + (i + 1) + ": " + e.getMessage());
            }
        }
    }

    private TreeMap<Integer, String> identifySubCategoryHeaders(Map<Integer, String> headerMap, List<AssetDropdownOption> allTemplateColumns) {
        TreeMap<Integer, String> subCategoryHeaders = new TreeMap<>();
        for (Map.Entry<Integer, String> entry : headerMap.entrySet()) {
            if (entry.getValue() == null)
                continue;

            String header = entry.getValue();
            String resolved = resolveFieldName(header, null, allTemplateColumns);
            String normalized = header.replaceAll(NON_ALPHANUMERIC_REGEX, "").toLowerCase();
            if ((resolved != null && (resolved.equalsIgnoreCase("Sub-category")
                    || resolved.equalsIgnoreCase("Subcategory"))) ||
                    normalized.contains("subcategory") || normalized.equals("sub")
                    || normalized.equals("subcat")) {
                subCategoryHeaders.put(entry.getKey(), resolved != null ? resolved : "Sub-category");
            }
        }
        return subCategoryHeaders;
    }

    private void processFieldsForRow(Row row, int i, Map<Integer, String> headerMap, AssetMaster asset,
                                     Map<String, String> dynamicValues, List<AssetDropdownOption> allTemplateColumns,
                                     List<AssetCategory> allCategories, String tenantId) {
        for (Map.Entry<Integer, String> entry : headerMap.entrySet()) {
            int colIdx = entry.getKey();
            String header = entry.getValue();
            if (header == null)
                continue;

            Cell cell = row.getCell(colIdx);
            String val = getCellValueAsString(cell);

            String normHeader = header.replaceAll(NON_ALPHANUMERIC_REGEX, "").toLowerCase();

            System.out.println("DEBUG: Row " + (i + 1) + ", Original Header: '" + header + "', Normalized: '"
                     + normHeader + "', Value: '" + val + "'");

            if (val == null || val.trim().isEmpty()) {
                continue;
            }

            // Skip identified sub-categories in this pass
            String resolvedForSubCheck = resolveFieldName(header, null, allTemplateColumns);
            if ((resolvedForSubCheck != null && (resolvedForSubCheck.equalsIgnoreCase("Sub-category")
                    || resolvedForSubCheck.equalsIgnoreCase("Subcategory"))) ||
                    normHeader.contains("subcategory") || normHeader.equals("sub")
                    || normHeader.equals("subcat")) {
                continue;
            }

            // Handle price specially
            if (normHeader.equals(PRICE) || normHeader.equals(PURCHASEPRICE)
                    || normHeader.equals("cost")
                    || normHeader.equals(VALUE) || normHeader.equals(ASSETPRICE)
                    || normHeader.equals(PURCHASECOST)) {
                parsePriceField(cell, val, asset);
                continue;
            }

            processSingleField(normHeader, header, val, asset, dynamicValues, allTemplateColumns, allCategories, tenantId);
        }
    }

    private void processSingleField(String normHeader, String header, String val, AssetMaster asset,
                                    Map<String, String> dynamicValues, List<AssetDropdownOption> allTemplateColumns,
                                    List<AssetCategory> allCategories, String tenantId) {
        switch (normHeader) {
            case "assettag":
            case "tag":
            case "assetid":
                asset.setAssetTag(val);
                dynamicValues.put("Asset Tag", val);
                break;
            case "serialnumber":
            case "serial":
            case "sn":
            case "slno":
            case "sln":
                asset.setSerialNumber(val);
                dynamicValues.put("Serial Number", val);
                break;
            case "category":
            case "assetcategory":
                AssetCategory cat = resolveCategory(val.trim(), allCategories, tenantId);
                asset.setCategory(cat);
                dynamicValues.put("Category", cat.getName());
                break;
            case "status":
            case "assetstatus":
                String rawStatus = val.toUpperCase().trim().replace(" ", "_");
                if (rawStatus.equals("INSTOCK"))
                    rawStatus = "IN_STOCK";
                asset.setStatus(rawStatus);
                dynamicValues.put("Status", rawStatus);
                break;
            case "condition":
            case "conditionatstock":
            case "assetcondition":
                asset.setConditionAtStock(val);
                dynamicValues.put("Condition", val);
                break;
            case "location":
            case "assetlocation":
                asset.setLocation(val);
                dynamicValues.put("Location", val);
                break;
            case "notes":
            case "note":
                asset.setNotes(val);
                dynamicValues.put("Notes", val);
                break;
            case "warrantystartdate":
            case "warrantyexpirydate":
            case "warrantyenddate":
            case "warrantydate":
                String normalizedDate = normalizeDateValue(val);
                String dateKey = normHeader.contains("end") || normHeader.contains("expiry")
                        ? "Warranty End Date"
                        : "Warranty Start Date";
                dynamicValues.put(dateKey, normalizedDate);
                break;

            default:
                String resolvedName = resolveFieldName(header, asset.getCategory(), allTemplateColumns);
                dynamicValues.put(resolvedName != null ? resolvedName : header, val);
                break;
        }
    }

    private AssetCategory resolveCategory(String catName, List<AssetCategory> allCategories, String tenantId) {
        System.out.println("DEBUG: Looking for category: '" + catName + "'");
        AssetCategory cat = null;
        try {
            cat = allCategories.stream()
                    .filter(c -> c.getName() != null
                            && c.getName().trim().equalsIgnoreCase(catName)
                            && c.getParentCategory() == null)
                    .findFirst()
                    .orElse(null);

            if (cat != null) {
                System.out.println("DEBUG: Found existing category: '" + cat.getName()
                        + "' (ID: " + cat.getId() + ")");
            } else {
                System.out.println("DEBUG: Creating new category: '" + catName + "'");
                AssetCategory newCat = new AssetCategory();
                newCat.setName(catName);
                newCat.setActive(true);
                newCat.setTenantId(tenantId);
                cat = categoryRepository.save(newCat);
                allCategories.add(cat);
                System.out.println("DEBUG: Created category with ID: " + cat.getId());
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Error in category processing: " + e.getMessage());
            List<AssetCategory> freshCategories = (tenantId != null && !tenantId.isEmpty())
                    ? categoryRepository.findByTenantId(tenantId)
                    : categoryRepository.findAll();
            cat = freshCategories.stream()
                    .filter(c -> c.getName() != null
                            && c.getName().trim().equalsIgnoreCase(catName)
                            && c.getParentCategory() == null)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "Category '" + catName + "' could not be processed"));
        }
        return cat;
    }

    private void parsePriceField(Cell cell, String val, AssetMaster asset) {
        try {
            if (cell != null && cell.getCellType() == CellType.NUMERIC) {
                asset.setPrice(cell.getNumericCellValue());
                appendLog("Set price to numeric: " + cell.getNumericCellValue());
            } else {
                String cleanPrice = val.replaceAll("[^\\d.]", "");
                if (!cleanPrice.isEmpty()) {
                    if (cleanPrice.indexOf('.') != cleanPrice.lastIndexOf('.')) {
                        int firstDot = cleanPrice.indexOf('.');
                        cleanPrice = cleanPrice.substring(0, firstDot + 1) +
                                cleanPrice.substring(firstDot + 1).replace(".", "");
                    }
                    asset.setPrice(Double.parseDouble(cleanPrice));
                    appendLog("Set price to string-derived: " + Double.parseDouble(cleanPrice));
                } else {
                    appendLog("Price string empty after clean: '" + val + "'");
                }
            }
        } catch (Exception e) {
            appendLog("Price parse error: " + e.getMessage());
            asset.setPrice(null);
        }
    }

    private void processSubCategoriesForRow(Row row, Map<Integer, String> headerMap, AssetMaster asset,
                                            Map<String, String> dynamicValues, TreeMap<Integer, String> subCategoryHeaders,
                                            List<AssetCategory> allCategories, String tenantId) {
        AssetCategory parent = asset.getCategory();

        // Fallback: If no category was provided or found, we use 'Uncategorized' to allow sub-category linking
        if (parent == null) {
            parent = allCategories.stream()
                    .filter(c -> UNCATEGORIZED.equalsIgnoreCase(c.getName())
                            && c.getParentCategory() == null)
                    .findFirst()
                    .orElse(null);

            if (parent == null) {
                AssetCategory uncategorized = new AssetCategory();
                uncategorized.setName(UNCATEGORIZED);
                uncategorized.setActive(true);
                uncategorized.setTenantId(tenantId);
                parent = categoryRepository.save(uncategorized);
                allCategories.add(parent);
            }
            asset.setCategory(parent);
        }

        for (Map.Entry<Integer, String> entry : subCategoryHeaders.entrySet()) {
            String subVal = getCellValueAsString(row.getCell(entry.getKey()));
            if (subVal == null || subVal.trim().isEmpty())
                continue;

            final String targetName = subVal.trim();
            final AssetCategory currentParent = parent;
            final String resolvedKey = entry.getValue();

            // Search for existing sub-category under current parent
            AssetCategory sub = allCategories.stream()
                    .filter(c -> c.getName() != null && c.getName().trim().equalsIgnoreCase(targetName)
                            && c.getParentCategory() != null
                            && c.getParentCategory().getId().equals(currentParent.getId()))
                    .findFirst()
                    .orElse(null);

            if (sub == null) {
                try {
                    AssetCategory newSub = new AssetCategory();
                    newSub.setName(targetName);
                    newSub.setParentCategory(currentParent);
                    newSub.setActive(true);
                    newSub.setTenantId(tenantId);
                    sub = categoryRepository.save(newSub);
                    allCategories.add(sub);
                } catch (Exception e) {
                    sub = allCategories.stream()
                            .filter(c -> c.getName() != null
                                    && c.getName().trim().equalsIgnoreCase(targetName))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException(
                                    "Sub-category '" + targetName + "' could not be created/linked"));
                }
            }

            asset.setSubCategory(sub);
            dynamicValues.put(resolvedKey, sub.getName());
            parent = sub; // Move down the chain for nested subcategories
        }
    }

    private void ensureDefaultValues(AssetMaster asset, int i, List<AssetCategory> allCategories, String tenantId) {
        if (asset.getAssetTag() == null || asset.getAssetTag().trim().isEmpty()) {
            asset.setAssetTag("AST-" + System.currentTimeMillis() + "-" + (i + 1));
        }

        if (asset.getCategory() == null) {
            AssetCategory defaultCategory = allCategories.stream()
                    .filter(c -> UNCATEGORIZED.equalsIgnoreCase(c.getName())
                            && c.getParentCategory() == null)
                    .findFirst()
                    .orElseGet(() -> {
                        AssetCategory newCat = new AssetCategory();
                        newCat.setName(UNCATEGORIZED);
                        newCat.setActive(true);
                        newCat.setTenantId(tenantId);
                        return categoryRepository.save(newCat);
                    });
            asset.setCategory(defaultCategory);
        }

        if (asset.getConditionAtStock() == null || asset.getConditionAtStock().trim().isEmpty()) {
            asset.setConditionAtStock("New");
        }
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void appendLog(String message) {
        try (java.io.FileWriter fw = new java.io.FileWriter("/tmp/asset_import_debug.log", true)) {
            fw.write(new java.util.Date() + " - " + message + "\n");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null || row.getFirstCellNum() < 0) {
            return true;
        }
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK)
                return false;
        }
        return true;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                String sVal = cell.getStringCellValue();
                // Check if it's a date string that needs normalization
                if (sVal != null
                        && (sVal.matches("\\d{1,2}-\\d{1,2}-\\d{4}") || sVal.matches("\\d{4}-\\d{1,2}-\\d{1,2}"))) {
                    return normalizeDateValue(sVal);
                }
                return sVal;
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd-MM-yyyy");
                    return sdf.format(cell.getDateCellValue());
                }
                // For numeric values, preserve decimal places for price parsing
                double numericValue = cell.getNumericCellValue();
                // Check if it's a whole number
                if (numericValue == (long) numericValue) {
                    return String.valueOf((long) numericValue);
                } else {
                    return String.valueOf(numericValue);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private String normalizeDateValue(String val) {
        if (val == null || val.trim().isEmpty())
            return "";
        val = val.trim();
        try {
            // DD-MM-YYYY
            if (val.matches("\\d{1,2}-\\d{1,2}-\\d{4}")) {
                String[] parts = val.split("-");
                return String.format("%04d-%02d-%02d",
                        Integer.parseInt(parts[2]),
                        Integer.parseInt(parts[1]),
                        Integer.parseInt(parts[0]));
            }
            // YYYY-MM-DD
            if (val.matches("\\d{4}-\\d{1,2}-\\d{1,2}")) {
                String[] parts = val.split("-");
                return String.format("%04d-%02d-%02d",
                        Integer.parseInt(parts[0]),
                        Integer.parseInt(parts[1]),
                        Integer.parseInt(parts[2]));
            }
            // DD/MM/YYYY
            if (val.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
                String[] parts = val.split("/");
                return String.format("%04d-%02d-%02d",
                        Integer.parseInt(parts[2]),
                        Integer.parseInt(parts[1]),
                        Integer.parseInt(parts[0]));
            }
        } catch (Exception e) {
            // Fallthrough to original
        }
        return val;
    }

    private String resolveFieldName(String header, AssetCategory category,
            List<AssetDropdownOption> allTemplateColumns) {
        String cleanHeader = header.trim().replace("*", "").trim();
        String simplifiedHeader = cleanHeader.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();

        // Match 1: Global Template Columns (Admin configured)
        if (allTemplateColumns != null) {
            for (AssetDropdownOption option : allTemplateColumns) {
                String optValue = option.getValue();
                String simplifiedOpt = optValue.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                if (simplifiedOpt.equals(simplifiedHeader) || optValue.equalsIgnoreCase(cleanHeader)) {
                    return optValue;
                }
            }
        }

        if (category == null || category.getFieldConfigs() == null)
            return null;

        // Match 2: Category Field Configs
        String lookupHeader = simplifiedHeader;
        if (simplifiedHeader.startsWith("asset")) {
            lookupHeader = simplifiedHeader.substring(5).trim();
        }

        for (AssetFieldConfig config : category.getFieldConfigs()) {
            String configName = config.getFieldName();
            String simplifiedConfig = configName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            if (simplifiedConfig.equals(simplifiedHeader) || configName.equalsIgnoreCase(cleanHeader)
                    || simplifiedConfig.contains(lookupHeader)) {
                return configName;
            }
        }

        return null;
    }
}
