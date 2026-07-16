package com.register.example.controller;

import com.register.example.entity.DepartmentMetricsSummary;
import com.register.example.repository.DepartmentMetricsSummaryRepository;
import com.register.example.scheduler.AnalyticsAggregationScheduler;
import com.register.example.service.GroqAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DepartmentMetricsSummaryRepository summaryRepository;
    private final GroqAiService groqAiService;
    private final AnalyticsAggregationScheduler aggregationScheduler;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String department) {
        
        // Trigger aggregation asynchronously to keep data fresh without blocking the UI
        CompletableFuture.runAsync(() -> aggregationScheduler.aggregateMetrics());
        
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(30);

        List<DepartmentMetricsSummary> summaries = summaryRepository.findByRecordDateBetween(start, end);
        
        if (department != null && !department.isEmpty() && !"All".equalsIgnoreCase(department)) {
            summaries = summaries.stream()
                .filter(s -> s.getDepartment().equalsIgnoreCase(department))
                .collect(Collectors.toList());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", summaries);

        // Calculate top-level KPIs based on role (or globally if no role)
        // Find the most recent record date in the summaries list
        LocalDate latestDate = summaries.stream().map(DepartmentMetricsSummary::getRecordDate).max(LocalDate::compareTo).orElse(end);

        int totalEmployees = summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getTotalEmployees).sum();
        int activeLeaves = summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getActiveLeaves).sum();
        int pendingApprovals = summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getPendingApprovals).sum();
        int attritionCount = summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getAttritionCount).sum();

        // Advanced KPIs (Averaged across departments for the latest date)
        long deptCount = summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).count();
        double avgFlightRisk = deptCount > 0 ? summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getFlightRiskScore).average().orElse(0) : 0;
        double avgBurnoutRisk = deptCount > 0 ? summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getBurnoutRiskScore).average().orElse(0) : 0;
        double avgDeptHealth = deptCount > 0 ? summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getDepartmentHealthScore).average().orElse(0) : 0;
        double avgManagerEffectiveness = deptCount > 0 ? summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getManagerEffectivenessScore).average().orElse(0) : 0;
        int totalLeaveForecast = summaries.stream().filter(s -> s.getRecordDate().equals(latestDate)).mapToInt(DepartmentMetricsSummary::getLeaveForecast).sum();
        
        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalEmployees", totalEmployees);
        kpis.put("activeLeaves", activeLeaves);
        kpis.put("pendingApprovals", pendingApprovals);
        kpis.put("attritionCount", attritionCount);
        kpis.put("avgFlightRisk", Math.round(avgFlightRisk));
        kpis.put("avgBurnoutRisk", Math.round(avgBurnoutRisk));
        kpis.put("avgDeptHealth", Math.round(avgDeptHealth));
        kpis.put("avgManagerEffectiveness", Math.round(avgManagerEffectiveness));
        kpis.put("totalLeaveForecast", totalLeaveForecast);
        
        response.put("kpis", kpis);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, String>> getAiInsights(
            @RequestParam(required = false, defaultValue = "HR") String role) {
        
        // Trigger aggregation asynchronously to keep data fresh without blocking
        CompletableFuture.runAsync(() -> aggregationScheduler.aggregateMetrics());
        
        LocalDate start = LocalDate.now().minusDays(7);
        List<DepartmentMetricsSummary> summaries = summaryRepository.findByRecordDateBetween(start, LocalDate.now());
        
        String prompt = buildPromptFromSummaries(summaries, role);
        
        String insights = groqAiService.generateInsights(prompt).join();
        Map<String, String> res = new HashMap<>();
        res.put("insights", insights);
        return ResponseEntity.ok(res);
    }

    private String buildPromptFromSummaries(List<DepartmentMetricsSummary> summaries, String role) {
        StringBuilder prompt = new StringBuilder("You are an expert Enterprise AI Assistant. Provide 3 actionable, data-driven insights and recommendations specifically tailored for a " + role + " based on these recent metrics:\n");
        
        // Group by department for the latest date
        LocalDate latestDate = summaries.stream().map(DepartmentMetricsSummary::getRecordDate).max(LocalDate::compareTo).orElse(LocalDate.now());
        
        for (DepartmentMetricsSummary s : summaries) {
            if (s.getRecordDate().equals(latestDate)) {
                prompt.append("- ")
                      .append(s.getDepartment())
                      .append(": Headcount=").append(s.getTotalEmployees())
                      .append(", Active Leaves=").append(s.getActiveLeaves())
                      .append(", Pending Approvals=").append(s.getPendingApprovals())
                      .append(", Attrition=").append(s.getAttritionCount())
                      .append(", Flight Risk=").append(s.getFlightRiskScore()).append("/100")
                      .append(", Burnout Risk=").append(s.getBurnoutRiskScore()).append("/100")
                      .append(", Manager Effectiveness=").append(s.getManagerEffectivenessScore()).append("/100")
                      .append(", Dept Health=").append(s.getDepartmentHealthScore()).append("/100")
                      .append(", Leave Forecast (30 days)=").append(s.getLeaveForecast()).append("\n");
            }
        }
        prompt.append("Format as short bullet points focusing on decisions they need to make.");
        return prompt.toString();
    }
}
