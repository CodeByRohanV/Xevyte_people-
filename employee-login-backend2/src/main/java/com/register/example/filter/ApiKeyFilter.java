package com.register.example.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to validate JWT for external server-to-server communication
 * Only applies to /api/external/** endpoints
 */
@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Autowired
    private com.register.example.security.JwtTokenProvider jwtTokenProvider;

    private static final String EXTERNAL_API_PATH = "/api/external/";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Bypass OPTIONS requests for CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestPath = request.getRequestURI();

        // Only apply this filter to external API endpoints, bypassing exit-management public forms
        if (requestPath.startsWith(EXTERNAL_API_PATH) && !requestPath.startsWith("/api/external/exit-management/")) {
            String authHeader = request.getHeader("Authorization");

            boolean isAuthenticated = false;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                if (jwtTokenProvider.validateToken(jwt) && jwtTokenProvider.validateIssuer(jwt)) {
                    isAuthenticated = true;
                }
            }

            if (!isAuthenticated) {
                System.out.println("❌ Auth Failed: Invalid token for path: " + requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter()
                        .write("{\"error\": \"Unauthorized\", \"message\": \"Valid Bearer JWT is required\"}");
                return;
            }

            // ✅ Set authentication in context for SecurityFilterChain
            org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth = 
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                    "EXTERNAL_SYSTEM", 
                    null, 
                    java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_EXTERNAL_API"))
                );
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
        }

        // JWT is valid or not an external endpoint, continue with the request
        filterChain.doFilter(request, response);
    }
}
