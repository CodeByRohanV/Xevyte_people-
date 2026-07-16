package com.register.example.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    // ── Shared secret — MUST match Scaloz IAM's scaloz.app.jwtSecret ──
    @Value("${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970}")
    private String jwtSecret;

    // ── Issuer expected in every token from Scaloz IAM ─────────────
    @Value("${JWT_ISSUER:scaloz-iam}")
    private String jwtIssuer;

    @Value("${jwt.expiration:86400000}")
    private long JWT_EXPIRATION;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Generate a token (legacy — only used by forgot-password flow) ─
    public String generateToken(String employeeId) {
        return Jwts.builder()
                .setSubject(employeeId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateToken(String subject, java.util.Map<String, Object> extraClaims) {
        return Jwts.builder()
                .setIssuer(jwtIssuer)
                .setSubject(subject)
                .addClaims(extraClaims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 300000)) // 5 minutes expiration
                .signWith(getSigningKey())
                .compact();
    }

    // ── Extract subject (employeeId) from JWT ─────────────────────────
    public String getEmployeeIdFromJWT(String token) {
        return getClaims(token).getSubject();
    }

    // ── Extract any string claim (tenant, role, employeeId, name) ────
    public String extractStringClaim(String token, String claimKey) {
        Object val = getClaims(token).get(claimKey);
        return val != null ? val.toString() : null;
    }

    // ── Extract list claim (apps) ─────────────────────────────────────
    @SuppressWarnings("unchecked")
    public List<String> extractListClaim(String token, String claimKey) {
        Object val = getClaims(token).get(claimKey);
        if (val instanceof List) return (List<String>) val;
        return List.of();
    }

    // ── Validate token signature and expiry ───────────────────────────
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (SignatureException | MalformedJwtException | ExpiredJwtException | UnsupportedJwtException
                | IllegalArgumentException ex) {
            System.err.println("JWT Validation failed: " + ex.getMessage());
            return false;
        }
    }

    // ── Validate the token was issued by Scaloz IAM ───────────────────
    public boolean validateIssuer(String token) {
        try {
            String issuer = getClaims(token).getIssuer();
            return jwtIssuer.equals(issuer);
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ── Custom secret dynamic token methods (Option 2) ────────────────
    private javax.crypto.SecretKey getSigningKey(String customSecret) {
        byte[] keyBytes = customSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] paddedBytes = new byte[32];
            System.arraycopy(keyBytes, 0, paddedBytes, 0, keyBytes.length);
            for (int i = keyBytes.length; i < 32; i++) {
                paddedBytes[i] = (byte) 0;
            }
            keyBytes = paddedBytes;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String subject, java.util.Map<String, Object> extraClaims, String customSecret) {
        return Jwts.builder()
                .setIssuer(jwtIssuer)
                .setSubject(subject)
                .addClaims(extraClaims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 300000)) // 5 minutes expiration
                .signWith(getSigningKey(customSecret), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String authToken, String customSecret) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey(customSecret)).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception ex) {
            System.err.println("JWT Validation failed with custom secret in HRMS: " + ex.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token, String customSecret) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey(customSecret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
