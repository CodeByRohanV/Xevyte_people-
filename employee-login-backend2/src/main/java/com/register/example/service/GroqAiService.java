package com.register.example.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class GroqAiService {

    @Value("${groq.api.key:#{null}}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    private final RestTemplate restTemplate;

    public GroqAiService() {
        this.restTemplate = new RestTemplate();
    }

    @Async
    public CompletableFuture<String> generateInsights(String prompt) {
        String activeKey = groqApiKey;
        
        // Fallback: Read directly from .env file if Spring failed to inject it
        if (activeKey == null || activeKey.isEmpty() || activeKey.equals("${groq.api.key}")) {
            try {
                java.util.Properties props = new java.util.Properties();
                props.load(new java.io.FileInputStream(".env"));
                activeKey = props.getProperty("GROQ_API_KEY");
                if (activeKey != null) {
                    activeKey = activeKey.trim();
                }
            } catch (Exception e) {
                log.warn("Failed to load .env file directly.");
            }
        }
        
        if (activeKey == null || activeKey.isEmpty()) {
            log.warn("Groq API key not configured. Skipping AI insights.");
            return CompletableFuture.completedFuture("⚠️ AI Insights are currently unavailable.\n\nReason: The GROQ_API_KEY environment variable is not configured. Please add it to your .env file to enable generative AI features for this dashboard.");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(activeKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama3-8b-8192");
            
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            
            requestBody.put("messages", List.of(message));
            requestBody.put("temperature", 0.7);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(groqApiUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> messageResp = (Map<String, Object>) choices.get(0).get("message");
                    return CompletableFuture.completedFuture((String) messageResp.get("content"));
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate insights from Groq API: {}", e.getMessage());
        }
        
        return CompletableFuture.completedFuture("Failed to retrieve AI insights.");
    }
}
