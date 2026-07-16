package com.register.example.service;

import com.register.example.dto.CalcComponentDTO;
import com.register.example.dto.CalcStructureDTO;
import com.register.example.entity.CalcComponent;
import com.register.example.entity.CalcStructure;
import com.register.example.repository.CalcComponentRepository;
import com.register.example.repository.CalcStructureRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class CalcStructureService {

    private static final Logger logger = LoggerFactory.getLogger(CalcStructureService.class);
    private static final String AS_APPLICABLE = "As applicable";

    private final CalcStructureRepository structureRepo;
    private final CalcComponentRepository componentRepo;
    private final EmployeeRepository employeeRepository;

    public CalcStructureService(CalcStructureRepository structureRepo,
                                CalcComponentRepository componentRepo,
                                EmployeeRepository employeeRepository) {
        this.structureRepo = structureRepo;
        this.componentRepo = componentRepo;
        this.employeeRepository = employeeRepository;
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

    // ─────────────────────────────────────────────────────────────
    // STRUCTURE CRUD
    // ─────────────────────────────────────────────────────────────

    public CalcStructureDTO createStructure(CalcStructureDTO dto) {
        String tenantId = getCurrentTenantId();
        if (structureRepo.existsByNameIgnoreCaseAndTenantId(dto.getName(), tenantId)) {
            throw new IllegalArgumentException("A structure with this name already exists.");
        }
        CalcStructure entity = new CalcStructure();
        mapDtoToEntity(dto, entity);
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        entity.setTenantId(tenantId);
        CalcStructure saved = structureRepo.save(entity);

        // If templateId provided, clone its components into the new structure
        if (dto.getTemplateId() != null) {
            cloneComponentsFrom(dto.getTemplateId(), saved);
        }
        
        // If components are provided in the DTO, create them
        if (dto.getComponents() != null && !dto.getComponents().isEmpty()) {
            for (CalcComponentDTO compDTO : dto.getComponents()) {
                CalcComponent comp = new CalcComponent();
                comp.setStructure(saved);
                mapDtoToComponent(compDTO, comp, saved);
                componentRepo.save(comp);
            }
        }

        return toDTO(structureRepo.findById(saved.getId()).orElse(saved), false);
    }

    public CalcStructureDTO updateStructure(Long id, CalcStructureDTO dto) {
        CalcStructure entity = structureRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + id));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(entity.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + id);
        }
        if (!entity.getName().equalsIgnoreCase(dto.getName())
                && structureRepo.existsByNameIgnoreCaseAndTenantId(dto.getName(), tenantId)) {
            throw new IllegalArgumentException("A structure with this name already exists.");
        }
        mapDtoToEntity(dto, entity);
        entity.setTenantId(tenantId);

        // Delete existing components
        List<CalcComponent> existingComponents = componentRepo.findByStructure_IdOrderBySequenceOrderAsc(id);
        componentRepo.deleteAll(existingComponents);
        componentRepo.flush();

        // Create new components from DTO
        if (dto.getComponents() != null && !dto.getComponents().isEmpty()) {
            for (CalcComponentDTO compDTO : dto.getComponents()) {
                CalcComponent comp = new CalcComponent();
                comp.setStructure(entity);
                mapDtoToComponent(compDTO, comp, entity);
                componentRepo.save(comp);
            }
        }

        return toDTO(structureRepo.save(entity), true);
    }

    public CalcStructureDTO updateStructureStatus(Long id, String status) {
        CalcStructure entity = structureRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + id));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(entity.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + id);
        }
        if (!"ACTIVE".equalsIgnoreCase(status) && !"INACTIVE".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Invalid status. Status must be ACTIVE or INACTIVE.");
        }
        entity.setStatus(status.toUpperCase());
        return toDTO(structureRepo.save(entity), false);
    }

    public void deleteStructure(Long id) {
        CalcStructure entity = structureRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + id));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(entity.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + id);
        }
        structureRepo.delete(entity);
    }

    @Transactional(readOnly = true)
    public Page<CalcStructureDTO> listStructures(String search, String status,
                                                  int page, int size,
                                                  String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        String searchParam = (search == null || search.isBlank()) ? null : search.trim();
        String statusParam = (status == null || status.isBlank()) ? null : status.trim();
        String tenantId = getCurrentTenantId();
        return structureRepo.findBySearchAndStatusAndTenantId(searchParam, statusParam, tenantId, pageable)
                .map(s -> toDTO(s, false));
    }

    @Transactional(readOnly = true)
    public CalcStructureDTO getStructureDetails(Long id) {
        CalcStructure entity = structureRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + id));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(entity.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + id);
        }
        return toDTO(entity, true);
    }

    // ─────────────────────────────────────────────────────────────
    // TEMPLATE OPERATIONS
    // ─────────────────────────────────────────────────────────────

    /** List all structures flagged as templates */
    @Transactional(readOnly = true)
    public List<CalcStructureDTO> listTemplates() {
        String tenantId = getCurrentTenantId();
        return structureRepo.findByIsTemplateTrueAndTenantIdOrderByNameAsc(tenantId)
                .stream().map(s -> toDTO(s, true)).toList();
    }

    /** Toggle a structure as a reusable template */
    public CalcStructureDTO saveAsTemplate(Long id, boolean markAsTemplate) {
        CalcStructure entity = structureRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + id));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(entity.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + id);
        }
        entity.setIsTemplate(markAsTemplate);
        return toDTO(structureRepo.save(entity), false);
    }

    /** Copy all components from sourceId into targetStructure */
    private void cloneComponentsFrom(Long sourceId, CalcStructure target) {
        CalcStructure sourceStruct = structureRepo.findById(sourceId)
                .orElseThrow(() -> new NoSuchElementException("Template not found: " + sourceId));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && sourceStruct.getTenantId() != null && !tenantId.equals(sourceStruct.getTenantId())) {
            throw new IllegalArgumentException("Unauthorized template access");
        }
        List<CalcComponent> source = componentRepo.findByStructure_IdOrderBySequenceOrderAsc(sourceId);
        for (CalcComponent src : source) {
            CalcComponent copy = new CalcComponent();
            copy.setStructure(target);
            copy.setComponentName(src.getComponentName());
            copy.setSection(src.getSection());
            copy.setComponentType(src.getComponentType());
            copy.setPerMonthValue(src.getPerMonthValue());
            copy.setPerAnnumValue(src.getPerAnnumValue());
            copy.setFormula(src.getFormula());
            copy.setSequenceOrder(src.getSequenceOrder());
            copy.setHighlighted(src.getHighlighted());
            componentRepo.save(copy);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // COMPONENT CRUD
    // ─────────────────────────────────────────────────────────────

    public CalcComponentDTO addComponent(Long structureId, CalcComponentDTO dto) {
        CalcStructure structure = structureRepo.findById(structureId)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + structureId));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(structure.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + structureId);
        }
        if ("FORMULA".equals(dto.getComponentType())) {
            validateFormula(dto.getFormula(), structure, dto.getSection(), null);
        }
        CalcComponent comp = new CalcComponent();
        mapDtoToComponent(dto, comp, structure);
        return toComponentDTO(componentRepo.save(comp));
    }

    public CalcComponentDTO updateComponent(Long componentId, CalcComponentDTO dto) {
        CalcComponent comp = componentRepo.findById(componentId)
                .orElseThrow(() -> new NoSuchElementException("Component not found: " + componentId));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && comp.getStructure() != null && !tenantId.equals(comp.getStructure().getTenantId())) {
            throw new NoSuchElementException("Component not found: " + componentId);
        }
        if ("FORMULA".equals(dto.getComponentType())) {
            validateFormula(dto.getFormula(), comp.getStructure(), dto.getSection(), componentId);
        }
        mapDtoToComponent(dto, comp, comp.getStructure());
        return toComponentDTO(componentRepo.save(comp));
    }

    public void deleteComponent(Long componentId) {
        CalcComponent comp = componentRepo.findById(componentId)
                .orElseThrow(() -> new NoSuchElementException("Component not found: " + componentId));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && comp.getStructure() != null && !tenantId.equals(comp.getStructure().getTenantId())) {
            throw new NoSuchElementException("Component not found: " + componentId);
        }
        componentRepo.delete(comp);
    }

    // ─────────────────────────────────────────────────────────────
    // CALCULATION ENGINE
    // ─────────────────────────────────────────────────────────────

    /**
     * Execute calculation for an entire structure.
     * Processes EARNINGS and DEDUCTIONS separately so formulas only
     * reference components within the same section.
     */
    public CalcStructureDTO executeCalculation(Long structureId) {
        return executeCalculation(structureId, 0.0); // Default to 0 for preview
    }

    public CalcStructureDTO executeCalculation(Long structureId, Double baseValue) {
        CalcStructure structure = structureRepo.findById(structureId)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + structureId));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(structure.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + structureId);
        }

        List<CalcComponent> all = componentRepo
                .findByStructure_IdOrderBySequenceOrderAsc(structureId);

        // Create dependency graph and calculate in dependency order
        List<CalcComponent> sortedByDependencies = topologicalSort(all);
        
        // Resolve components in dependency order, allowing cross-section references
        Map<String, Double> allResolved = new LinkedHashMap<>();

        // Inject system variables (Annual and Monthly)
        double annualBase = (baseValue != null) ? baseValue : 0.0;
        double monthlyBase = annualBase / 12.0;

        allResolved.put("current_fixed_ctc", annualBase);
        allResolved.put("monthly_fixed_ctc", monthlyBase);
        allResolved.put("fixed_ctc", annualBase);
        allResolved.put("ctc", annualBase);
        allResolved.put("CTC", annualBase);
        allResolved.put("annual_ctc", annualBase);
        allResolved.put("ANNUAL_CTC", annualBase);
        allResolved.put("monthly_ctc", monthlyBase);
        allResolved.put("MONTHLY_CTC", monthlyBase);
        allResolved.put("monthlyctc", monthlyBase);
        allResolved.put("MONTHLYCTC", monthlyBase);

        // Initialize system variable names set to avoid circular reference errors
        Set<String> systemVariables = new HashSet<>();
        systemVariables.add("Monthly_Total");
        systemVariables.add("MONTHLY_TOTAL");
        systemVariables.add("Total_Earnings");
        systemVariables.add("TOTAL_EARNINGS");
        systemVariables.add("Total_Deductions");
        systemVariables.add("TOTAL_DEDUCTIONS");
        systemVariables.add("SubTotal");
        systemVariables.add("SUBTOTAL");
        systemVariables.add("Sub_Total");
        systemVariables.add("SUB_TOTAL");
        systemVariables.add("current_fixed_ctc");
        systemVariables.add("monthly_fixed_ctc");
        systemVariables.add("fixed_ctc");
        systemVariables.add("ctc");
        systemVariables.add("CTC");
        systemVariables.add("annual_ctc");
        systemVariables.add("ANNUAL_CTC");
        systemVariables.add("monthly_ctc");
        systemVariables.add("MONTHLY_CTC");
        systemVariables.add("monthlyctc");
        systemVariables.add("MONTHLYCTC");

        // First pass: Resolve components that don't reference totals
        List<CalcComponent> componentsReferencingTotals = new ArrayList<>();
        for (CalcComponent comp : sortedByDependencies) {
            if ("FORMULA".equals(comp.getComponentType()) && comp.getFormula() != null) {
                String formula = comp.getFormula().toUpperCase();
                if (formula.contains("MONTHLY_TOTAL") || formula.contains("MONTHLYTOTAL") ||
                    formula.contains("TOTAL_EARNINGS") || formula.contains("TOTALEARNINGS") ||
                    formula.contains("TOTAL_DEDUCTIONS") || formula.contains("TOTALDEDUCTIONS") ||
                    formula.contains("TOTAL_DEDUCTION") || formula.contains("SUBTOTAL") ||
                    formula.contains("SUB_TOTAL")) {
                    componentsReferencingTotals.add(comp);
                    continue;
                }
            }
            double monthly = resolve(comp, allResolved, systemVariables);
            double annual  = resolveAnnum(comp, monthly, allResolved);
            comp.setComputedPerMonth(monthly);
            comp.setComputedPerAnnum(annual);
            for (String alias : getComponentAliases(comp.getComponentName())) {
                allResolved.put(alias, monthly);
                systemVariables.add(alias);
            }
        }

        // Calculate totals after first pass
        double totalEarnings = 0.0;
        double totalDeductions = 0.0;
        double employerPF = 0.0;
        for (CalcComponent comp : all) {
            if ("EARNINGS".equals(comp.getSection()) && comp.getComputedPerMonth() != null) {
                totalEarnings += comp.getComputedPerMonth();
            } else if ("DEDUCTIONS".equals(comp.getSection()) && comp.getComputedPerMonth() != null) {
                totalDeductions += comp.getComputedPerMonth();
                // Check if this is Employer PF
                if ("Employer_PF".equalsIgnoreCase(comp.getComponentName()) ||
                    "EMPLOYER_PF".equalsIgnoreCase(comp.getComponentName()) ||
                    "Employer PF".equalsIgnoreCase(comp.getComponentName())) {
                    employerPF = comp.getComputedPerMonth();
                }
            }
        }

        // SubTotal is Monthly_Total - Employer_PF
        double subTotal = totalEarnings - employerPF;

        // Add computed totals as system variables for formula evaluation
        allResolved.put("Monthly_Total", totalEarnings);
        allResolved.put("MONTHLY_TOTAL", totalEarnings);
        allResolved.put("Total_Earnings", totalEarnings);
        allResolved.put("TOTAL_EARNINGS", totalEarnings);
        allResolved.put("Total_Deductions", totalDeductions);
        allResolved.put("TOTAL_DEDUCTIONS", totalDeductions);
        allResolved.put("SubTotal", subTotal);
        allResolved.put("SUBTOTAL", subTotal);
        allResolved.put("Sub_Total", subTotal);
        allResolved.put("SUB_TOTAL", subTotal);

        // Second pass: Resolve components that reference totals
        for (CalcComponent comp : componentsReferencingTotals) {
            double monthly = resolve(comp, allResolved, systemVariables);
            double annual = resolveAnnum(comp, monthly, allResolved);
            comp.setComputedPerMonth(monthly);
            comp.setComputedPerAnnum(annual);
            for (String alias : getComponentAliases(comp.getComponentName())) {
                allResolved.put(alias, monthly);
                systemVariables.add(alias);
            }
        }

        CalcStructureDTO dto = toDTO(structure, false);
        List<CalcComponentDTO> compDTOs = all.stream()
                .map(c -> {
                    CalcComponentDTO cd = toComponentDTO(c);
                    cd.setComputedPerMonth(c.getComputedPerMonth());
                    cd.setComputedPerAnnum(c.getComputedPerAnnum());
                    cd.setDisplayPerMonth(formatDisplay(c, c.getComputedPerMonth()));
                    cd.setDisplayPerAnnum(formatDisplay(c, c.getComputedPerAnnum()));
                    return cd;
                }).toList();
        dto.setComponents(compDTOs);
        dto.setComponentCount(compDTOs.size());
        return dto;
    }

    public void validateFormulaExpression(Long structureId, String formula, String section) {
        CalcStructure structure = structureRepo.findById(structureId)
                .orElseThrow(() -> new NoSuchElementException("Structure not found: " + structureId));
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.equals(structure.getTenantId())) {
            throw new NoSuchElementException("Structure not found: " + structureId);
        }
        validateFormula(formula, structure, section, null);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private double resolve(CalcComponent comp, Map<String, Double> resolved, Set<String> systemVariables) {
        if ("AS_APPLICABLE".equals(comp.getComponentType())) return 0.0;
        if ("FIXED_VALUE".equals(comp.getComponentType())) {
            return comp.getPerMonthValue() != null ? comp.getPerMonthValue() : 0.0;
        }
        // FORMULA - use the single formula field
        return evaluateFormula(comp.getFormula(), resolved, comp.getComponentName(), systemVariables);
    }

    private double resolveAnnum(CalcComponent comp, double monthly, Map<String, Double> resolved) {
        if ("AS_APPLICABLE".equals(comp.getComponentType())) return 0.0;
        if (comp.getPerAnnumValue() != null) return comp.getPerAnnumValue();
        // FORMULA - auto-calculate as monthly × 12
        return monthly * 12;
    }

    private String formatDisplay(CalcComponent comp, Double value) {
        if ("AS_APPLICABLE".equals(comp.getComponentType())) return AS_APPLICABLE;
        if (value == null) return "";
        return String.format("%.0f", value);
    }

    private void mapDtoToEntity(CalcStructureDTO dto, CalcStructure entity) {
        entity.setName(dto.getName().trim());
        entity.setDescription(dto.getDescription());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        entity.setIsTemplate(Boolean.TRUE.equals(dto.getIsTemplate()));
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getTenantId() != null) entity.setTenantId(dto.getTenantId());
    }

    private void mapDtoToComponent(CalcComponentDTO dto, CalcComponent comp, CalcStructure structure) {
        comp.setStructure(structure);
        comp.setComponentName(dto.getComponentName().trim());
        comp.setSection(dto.getSection() != null ? dto.getSection() : "EARNINGS");
        comp.setComponentType(dto.getComponentType());
        comp.setSequenceOrder(dto.getSequenceOrder() != null ? dto.getSequenceOrder() : 1);
        comp.setHighlighted(Boolean.TRUE.equals(dto.getHighlighted()));

        if ("FIXED_VALUE".equals(dto.getComponentType())) {
            comp.setPerMonthValue(dto.getPerMonthValue());
            comp.setPerAnnumValue(dto.getPerAnnumValue()); // may be null (auto-computed)
            comp.setFormula(null);
            comp.setPerMonthFormula(null);
            comp.setPerAnnumFormula(null);
        } else if ("FORMULA".equals(dto.getComponentType())) {
            comp.setFormula(dto.getFormula());
            comp.setPerMonthValue(null);
            comp.setPerAnnumValue(null); // auto-calculated as monthly × 12
            comp.setPerMonthFormula(null);
            comp.setPerAnnumFormula(null);
        } else { // AS_APPLICABLE
            comp.setPerMonthValue(null);
            comp.setPerAnnumValue(null);
            comp.setFormula(null);
            comp.setPerMonthFormula(null);
            comp.setPerAnnumFormula(null);
        }
    }

    private CalcStructureDTO toDTO(CalcStructure entity, boolean includeComponents) {
        CalcStructureDTO dto = new CalcStructureDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setIsTemplate(entity.getIsTemplate());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setTenantId(entity.getTenantId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        if (includeComponents) {
            List<CalcComponentDTO> compDTOs = entity.getComponents()
                    .stream().map(this::toComponentDTO).toList();
            dto.setComponents(compDTOs);
            dto.setComponentCount(compDTOs.size());
        } else {
            dto.setComponentCount(entity.getComponents().size());
        }
        return dto;
    }

    private CalcComponentDTO toComponentDTO(CalcComponent comp) {
        CalcComponentDTO dto = new CalcComponentDTO();
        dto.setId(comp.getId());
        dto.setStructureId(comp.getStructureId());
        dto.setComponentName(comp.getComponentName());
        dto.setSection(comp.getSection());
        dto.setComponentType(comp.getComponentType());
        dto.setPerMonthValue(comp.getPerMonthValue());
        dto.setPerAnnumValue(comp.getPerAnnumValue());
        dto.setFormula(comp.getFormula());
        dto.setSequenceOrder(comp.getSequenceOrder());
        dto.setHighlighted(comp.getHighlighted());
        dto.setCreatedAt(comp.getCreatedAt());
        dto.setUpdatedAt(comp.getUpdatedAt());

        // Set display strings for static load (before execution)
        if ("AS_APPLICABLE".equals(comp.getComponentType())) {
            dto.setDisplayPerMonth(AS_APPLICABLE);
            dto.setDisplayPerAnnum(AS_APPLICABLE);
        } else if ("FIXED_VALUE".equals(comp.getComponentType()) && comp.getPerMonthValue() != null) {
            dto.setDisplayPerMonth(String.format("%.0f", comp.getPerMonthValue()));
            double annum = comp.getPerAnnumValue() != null ? comp.getPerAnnumValue() : comp.getPerMonthValue() * 12;
            dto.setDisplayPerAnnum(String.format("%.0f", annum));
        }
        return dto;
    }

    private void validateFormula(String formula, CalcStructure structure,
                                  String section, Long excludeComponentId) {
        if (formula == null || formula.isBlank()) {
            throw new IllegalArgumentException("Formula cannot be empty.");
        }
        List<CalcComponent> existing = componentRepo
                .findByStructure_IdOrderBySequenceOrderAsc(structure.getId());

        Set<String> knownNames = new HashSet<>();
        // Add built-in system variables
        knownNames.add("current_fixed_ctc");
        knownNames.add("monthly_fixed_ctc");
        knownNames.add("fixed_ctc");
        knownNames.add("ctc");
        knownNames.add("CTC");
        knownNames.add("annual_ctc");
        knownNames.add("ANNUAL_CTC");
        knownNames.add("monthly_ctc");
        knownNames.add("MONTHLY_CTC");
        knownNames.add("monthlyctc");
        knownNames.add("MONTHLYCTC");

        for (CalcComponent c : existing) {
            // Allow components from any section to be referenced
            if (excludeComponentId != null && c.getId().equals(excludeComponentId)) continue;
            knownNames.addAll(getComponentAliases(c.getComponentName()));
        }

        logger.info("Validating formula: {} for section: {}", formula, section);
        logger.info("Known components: {}", knownNames);

        // Support multi-word component names (with spaces) - Case Insensitive
        String testFormula = formula;
        List<String> sortedNames = new ArrayList<>(knownNames);
        // Sort by length descending so "Total Earnings" is matched before "Earnings"
        sortedNames.sort((a, b) -> b.length() - a.length());

        for (String name : sortedNames) {
            // Case-insensitive regex replacement with word boundaries that handle spaces
            String pattern = "(?i)\\b" + Pattern.quote(name) + "\\b";
            testFormula = testFormula.replaceAll(pattern, " 0 ");
        }
        
        logger.info("Formula after replacement: {}", testFormula);

        // Extract tokens but filter out single letters that are likely part of replaced component names
        Set<String> tokens = extractTokens(testFormula);
        for (String token : tokens) {
            // Skip single-character tokens as they're likely remnants of multi-word replacements
            if (token.length() == 1) continue;
            
            // If the token is not a number and not a known name (after replacement), it's invalid
            if (!token.matches("\\d+(\\.\\d+)?")) {
                throw new IllegalArgumentException("Unknown component or invalid token: '" + token + "'. " +
                        "Note: Components can reference any other component in the template.");
            }
        }
    }

    private Set<String> extractTokens(String formula) {
        Set<String> tokens = new HashSet<>();
        Matcher m = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*").matcher(formula);
        while (m.find()) tokens.add(m.group());
        return tokens;
    }

    /**
     * Perform topological sort on components based on formula dependencies
     */
    private List<CalcComponent> topologicalSort(List<CalcComponent> components) {
        Map<String, CalcComponent> componentMap = new HashMap<>();
        Map<String, Set<String>> dependencies = new HashMap<>();
        
        // Build component map and dependency graph
        for (CalcComponent comp : components) {
            componentMap.put(comp.getComponentName(), comp);
            dependencies.put(comp.getComponentName(), new HashSet<>());
        }
        
        // Extract dependencies for formula components
        for (CalcComponent comp : components) {
            if ("FORMULA".equals(comp.getComponentType()) && comp.getFormula() != null) {
                Set<String> deps = extractComponentDependencies(comp.getFormula(), componentMap.keySet());
                dependencies.get(comp.getComponentName()).addAll(deps);
            }
        }
        
        // Topological sort using Kahn's algorithm
        List<CalcComponent> result = new ArrayList<>();
        Map<String, Integer> inDegree = new HashMap<>();
        
        // Calculate in-degrees
        for (String compName : dependencies.keySet()) {
            inDegree.put(compName, 0);
        }
        
        for (String compName : dependencies.keySet()) {
            for (String dep : dependencies.get(compName)) {
                inDegree.put(compName, inDegree.getOrDefault(compName, 0) + 1);
            }
        }
        
        // Queue of components with no dependencies
        Queue<String> queue = new LinkedList<>();
        for (String compName : inDegree.keySet()) {
            if (inDegree.get(compName) == 0) {
                queue.offer(compName);
            }
        }
        
        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(componentMap.get(current));
            
            // Remove current from dependency graph
            for (String neighbor : dependencies.keySet()) {
                if (dependencies.get(neighbor).contains(current)) {
                    inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                    if (inDegree.get(neighbor) == 0) {
                        queue.offer(neighbor);
                    }
                }
            }
        }
        
        // Add remaining components (in case of circular dependencies or no dependencies)
        for (CalcComponent comp : components) {
            if (!result.contains(comp)) {
                result.add(comp);
            }
        }
        
        return result;
    }
    
    /**
     * Extract component names from formula
     */
    private Set<String> extractComponentDependencies(String formula, Set<String> availableComponents) {
        Set<String> dependencies = new HashSet<>();
        
        // Add built-in system variables
        Set<String> systemVars = Set.of(
            "current_fixed_ctc", "monthly_fixed_ctc", "fixed_ctc",
            "ctc", "CTC", "annual_ctc", "ANNUAL_CTC",
            "monthly_ctc", "MONTHLY_CTC", "monthlyctc", "MONTHLYCTC"
        );
        
        // Find all potential component names in the formula
        String testFormula = formula;
        
        // Resolve aliases for available components to build a full list of names to check
        Set<String> allAvailableNames = new HashSet<>();
        for (String compName : availableComponents) {
            allAvailableNames.addAll(getComponentAliases(compName));
        }
        
        List<String> sortedNames = new ArrayList<>(allAvailableNames);
        sortedNames.sort((a, b) -> b.length() - a.length()); // Sort by length descending
        
        for (String name : sortedNames) {
            // Skip system variables
            if (systemVars.contains(name)) continue;
            
            String pattern = "(?i)\\b" + Pattern.quote(name) + "\\b";
            Pattern p = Pattern.compile(pattern);
            if (p.matcher(testFormula).find()) {
                // Find the original component name that matches this alias
                for (String compName : availableComponents) {
                    if (getComponentAliases(compName).contains(name)) {
                        dependencies.add(compName);
                    }
                }
                testFormula = testFormula.replaceAll(pattern, "X");
            }
        }
        
        return dependencies;
    }

    private double evaluateFormula(String formula, Map<String, Double> resolved, String currentName, Set<String> systemVariables) {
        if (formula == null || formula.isBlank()) return 0.0;
        String expr = formula;
        List<String> sortedKeys = new ArrayList<>(resolved.keySet());
        sortedKeys.sort((a, b) -> b.length() - a.length());
        logger.info("Evaluating formula for '{}': original = '{}', resolved keys = {}, resolved values = {}", currentName, formula, resolved.keySet(), resolved);
        for (String key : sortedKeys) {
            // Skip circular reference check for system variables
            boolean isSystemVariable = systemVariables != null && systemVariables.contains(key);
            if (key.equalsIgnoreCase(currentName) && !isSystemVariable) {
                throw new IllegalArgumentException("Circular reference: '" + currentName + "' references itself.");
            }
            // Replace with or without word boundaries to handle parentheses and other characters
            String pattern = "(?i)\\b" + Pattern.quote(key) + "\\b|(?i)\\(" + Pattern.quote(key) + "\\)|(?i)" + Pattern.quote(key);
            String value = String.valueOf(resolved.get(key));
            String before = expr;
            expr = expr.replaceAll(pattern, value);
            if (!before.equals(expr)) {
                logger.info("Replaced '{}' with '{}': '{}' -> '{}'", key, value, before, expr);
            }
        }
        
        // Clean up the expression - remove extra spaces and validate
        expr = expr.trim();
        
        // Check if expression is empty after replacement
        if (expr.isEmpty()) {
            return 0.0;
        }
        
        // Pre-process percentage notation (e.g., "40%" -> "40/100")
        expr = expr.replaceAll("(\\d+(\\.\\d+)?)%", "$1/100");
        
        logger.info("Evaluating formula: '{}' -> '{}'", formula, expr);
        try {
            return new ArithmeticParser(expr).parse();
        } catch (Exception e) {
            logger.error("Formula evaluation failed for '{}': '{}', error: {}", currentName, expr, e.getMessage());
            throw new IllegalArgumentException("Cannot evaluate formula for '" + currentName + "': " + e.getMessage());
        }
    }

    private Set<String> getComponentAliases(String name) {
        Set<String> aliases = new LinkedHashSet<>();
        if (name == null || name.isBlank()) return aliases;
        
        aliases.add(name);
        aliases.add(name.toUpperCase());
        aliases.add(name.toLowerCase());
        
        String noSpaces = name.replaceAll("\\s+", "");
        aliases.add(noSpaces);
        aliases.add(noSpaces.toUpperCase());
        aliases.add(noSpaces.toLowerCase());
        
        String underscored = name.replaceAll("\\s+", "_");
        aliases.add(underscored);
        aliases.add(underscored.toUpperCase());
        aliases.add(underscored.toLowerCase());
        
        String normalized = name.toLowerCase().replaceAll("[\\s_-]", "");
        if (normalized.equals("employeepf") || normalized.equals("pf")) {
            aliases.addAll(List.of("PF", "pf", "EmployeePF", "Employee_PF", "EMPLOYEE_PF"));
        } else if (normalized.equals("employerpf")) {
            aliases.addAll(List.of("EmployerPF", "Employer_PF", "EMPLOYER_PF"));
        } else if (normalized.equals("medicalallowance") || normalized.equals("medical")) {
            aliases.addAll(List.of("Medical", "MEDICAL", "MedicalAllowance", "Medical_Allowance", "MEDICAL_ALLOWANCE"));
        } else if (normalized.equals("specialallowance") || normalized.equals("special")) {
            aliases.addAll(List.of("Special", "SPECIAL", "SpecialAllowance", "Special_Allowance", "SPECIAL_ALLOWANCE"));
        } else if (normalized.equals("totaldeductions") || normalized.equals("totaldeduction")) {
            aliases.addAll(List.of("TotalDeductions", "Total_Deductions", "TOTAL_DEDUCTIONS"));
        }
        
        return aliases;
    }

    // ── Safe arithmetic parser ─────────────────────────────────────
    private static class ArithmeticParser {
        private final String input;
        private int pos;

        ArithmeticParser(String input) {
            // Remove only spaces between numbers and operators, but keep structure
            this.input = input.replaceAll("\\s+", "");
        }

        double parse() {
            double r = parseExpr();
            if (pos < input.length()) throw new IllegalArgumentException("Unexpected: " + input.charAt(pos));
            return r;
        }

        private double parseExpr() {
            double r = parseTerm();
            while (pos < input.length() && (input.charAt(pos) == '+' || input.charAt(pos) == '-')) {
                char op = input.charAt(pos++);
                double right = parseTerm();
                r = op == '+' ? r + right : r - right;
            }
            return r;
        }

        private double parseTerm() {
            double r = parseFactor();
            while (pos < input.length() && (input.charAt(pos) == '*' || input.charAt(pos) == '/' || input.charAt(pos) == '%')) {
                char op = input.charAt(pos++);
                double right = parseFactor();
                if (op == '/' && right == 0) throw new ArithmeticException("Division by zero");
                if (op == '%' && right == 0) throw new ArithmeticException("Modulo by zero");
                r = op == '*' ? r * right : (op == '/' ? r / right : r % right);
            }
            return r;
        }

        private double parseFactor() {
            if (pos < input.length() && input.charAt(pos) == '(') {
                pos++;
                double r = parseExpr();
                if (pos >= input.length() || input.charAt(pos) != ')') throw new IllegalArgumentException("Missing )");
                pos++;
                return r;
            }
            if (pos < input.length() && input.charAt(pos) == '-') { pos++; return -parseFactor(); }
            if (pos < input.length() && input.charAt(pos) == '+') { pos++; return parseFactor(); }
            return parseNumber();
        }

        private double parseNumber() {
            int start = pos;
            while (pos < input.length() && (Character.isDigit(input.charAt(pos)) || input.charAt(pos) == '.')) pos++;
            
            // Support scientific notation (e.g., 1.2E7 or 1.2e-7)
            if (pos < input.length() && (input.charAt(pos) == 'E' || input.charAt(pos) == 'e')) {
                pos++; // consume 'E' or 'e'
                if (pos < input.length() && (input.charAt(pos) == '+' || input.charAt(pos) == '-')) {
                    pos++; // consume sign
                }
                while (pos < input.length() && Character.isDigit(input.charAt(pos))) {
                    pos++; // consume exponent digits
                }
            }
            
            if (start == pos) {
                char problematicChar = pos < input.length() ? input.charAt(pos) : '?';
                throw new IllegalArgumentException("Expected number at pos " + pos + " but found '" + problematicChar + "' in '" + input + "'");
            }
            return Double.parseDouble(input.substring(start, pos));
        }
    }
}
