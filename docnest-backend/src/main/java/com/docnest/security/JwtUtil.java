package com.docnest.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(String email, Long officeId) {
        var builder = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration));
        if (officeId != null) {
            builder.claim("officeId", officeId);
        }
        return builder.signWith(getSignKey(), SignatureAlgorithm.HS256).compact();
    }

    /** Backward-compat: generate token without office scoping */
    public String generateToken(String email) {
        return generateToken(email, null);
    }

    public Long extractOfficeId(String token) {
        try {
            var claims = Jwts.parserBuilder()
                    .setSigningKey(getSignKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Object officeId = claims.get("officeId");
            return officeId != null ? Long.valueOf(officeId.toString()) : null;
        } catch (Exception e) {
            return null;
        }
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Date exp = Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return exp.before(new Date());
    }

    public long getExpiration() {
        return expiration;
    }

    private Key getSignKey() {
        String base64Secret = Base64.getEncoder().encodeToString(secret.getBytes());
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
    }
}
