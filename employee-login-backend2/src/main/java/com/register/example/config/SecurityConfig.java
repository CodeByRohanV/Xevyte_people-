package com.register.example.config;
 
import com.register.example.filter.ApiKeyFilter;
import com.register.example.security.JwtAuthenticationFilter;
 

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
 
import java.util.Arrays;
import java.util.Collections;
 
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.beans.factory.annotation.Value;
 
@Configuration
@EnableWebSecurity
public class SecurityConfig {
 
        private static final String SUBDOMAIN_WILDCARD = "://*.";
 
        // Inject FRONTEND_URL environment variable or property
        @Value("${FRONTEND_URL}")
        private String frontendUrl;
 
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter, ApiKeyFilter apiKeyFilter) throws Exception {
 
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(authorize -> authorize
 
                                                // Allow OPTIONS requests
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
 
                                                // Health Check Endpoint for AWS ALB
                                                .requestMatchers("/health").permitAll()
                                                .requestMatchers("/api/v1/analytics/generate-team-data").permitAll()
                                                .requestMatchers("/api/v1/analytics/cleanup-rohan-data").permitAll()
                                                .requestMatchers("/api/v1/analytics/dump-rohan-data").permitAll()
 
                                                // Auth APIs
                                                .requestMatchers("/api/auth/login",
                                                                "/api/auth/forgot-password",
                                                                "/api/auth/reset-password",
                                                                "/api/auth/tenant-branding/**",
                                                                "/api/auth/global-settings/**",
                                                                "/api/daily-entry/trigger-reminders",
                                                                "/api/resignations/trigger-exits",
                                                                "/api/v1/analytics/deep-test")
                                                .permitAll()
 
                                                // OTP APIs
                                                .requestMatchers("/api/v1/auth/send-otp",
                                                                "/api/v1/auth/verify-otp")
                                                .permitAll()
 
                                                // Public GET APIs
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/v1/applicants/*")
                                                .permitAll()
 
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/v1/preonboarding/*")
                                                .permitAll()
 
                                                // Calculation APIs
                                                .requestMatchers("/api/v1/calculations/**")
                                                .permitAll()
 
                                                // Public Exit Management APIs
                                                .requestMatchers("/api/external/exit-management/**")
                                                .permitAll()
 
                                                // All other APIs secured
                                                .anyRequest().authenticated());
 
                // Add API Key filter first (for /api/external/** routes)
                http.addFilterBefore(apiKeyFilter,
                                UsernamePasswordAuthenticationFilter.class);
 
                // Add JWT filter (validates Scaloz IAM tokens)
                http.addFilterBefore(jwtAuthenticationFilter,
                                UsernamePasswordAuthenticationFilter.class);
 
                return http.build();
        }
 
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
 
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
 
                // ── 1. Public exit-management endpoints (no credentials needed) ─────────
                CorsConfiguration publicConfig = new CorsConfiguration();
                publicConfig.setAllowedOriginPatterns(java.util.List.of("*"));
                publicConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                publicConfig.setAllowedHeaders(Collections.singletonList("*"));
                publicConfig.setAllowCredentials(false);
                publicConfig.setMaxAge(3600L);
                source.registerCorsConfiguration("/api/external/exit-management/**", publicConfig);
 
                // ── 2. All other APIs (subdomain-aware, with credentials) ─────────────
                CorsConfiguration configuration = new CorsConfiguration();
 
                java.util.List<String> allowedPatterns = new java.util.ArrayList<>();
 
                if (frontendUrl != null && !frontendUrl.isEmpty()) {
                        // Allow the exact frontend URL
                        allowedPatterns.add(frontendUrl);
 
                        // Dynamically derive the wildcard pattern for subdomains
                        try {
                                java.net.URL url = java.net.URI.create(frontendUrl).toURL();
                                String protocol = url.getProtocol();
                                String host = url.getHost();
                                int port = url.getPort();
                                String portSuffix = (port != -1) ? ":" + port : "";
 
                                // e.g. https://*.hrms.scaloz.com
                                allowedPatterns.add(protocol + SUBDOMAIN_WILDCARD + host + portSuffix);
 
                                if (host.startsWith("www.")) {
                                        String baseHost = host.substring(4);
                                        allowedPatterns.add(protocol + "://" + baseHost + portSuffix);
                                        allowedPatterns.add(protocol + SUBDOMAIN_WILDCARD + baseHost + portSuffix);
                                }
                        } catch (Exception e) {
                                if (frontendUrl.contains("://")) {
                                        allowedPatterns.add(frontendUrl.replace("://", SUBDOMAIN_WILDCARD));
                                }
                        }
                }
 
                // Always allow localhost subdomains for development
                // Use * (not [*]) for Ant-style port wildcard in setAllowedOriginPatterns
                allowedPatterns.add("http://localhost:*");
                allowedPatterns.add("http://*.localhost:*");
 
                // Staging and production subdomain patterns for Scaloz deployment
                allowedPatterns.add("https://*.hrmstest.scaloz.com");
                allowedPatterns.add("https://hrmstest.scaloz.com");
                allowedPatterns.add("https://*.hrms.scaloz.com");
                allowedPatterns.add("https://hrms.scaloz.com");
                allowedPatterns.add("https://*.workspacetest.scaloz.com");
                allowedPatterns.add("https://workspacetest.scaloz.com");
                allowedPatterns.add("https://*.apps.scaloz.com");
                allowedPatterns.add("https://apps.scaloz.com");
 
                configuration.setAllowedOriginPatterns(allowedPatterns);
 
                configuration.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
 
                configuration.setAllowedHeaders(Arrays.asList(
                                "Authorization",
                                "Content-Type",
                                "X-Requested-With",
                                "Accept",
                                "Origin",
                                "employeename",
                                "employeeid",
                                "managerId",
                                "reviewerId",
                                "hrId",
                                "adminId",
                                "financeId",
                                "Access-Control-Request-Method",
                                "Access-Control-Request-Headers"));
 
                configuration.setExposedHeaders(Arrays.asList(
                                "Access-Control-Allow-Origin",
                                "Access-Control-Allow-Credentials"));
 
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);
 
                source.registerCorsConfiguration("/**", configuration);
 
                return source;
        }
}