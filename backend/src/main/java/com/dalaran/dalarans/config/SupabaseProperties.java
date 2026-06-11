package com.dalaran.dalarans.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "supabase")
public record SupabaseProperties(
        String url,
        String jwtIssuer,
        String dbUrl,
        String dbUser,
        String dbPassword
) {

    public boolean hasDatabaseConfig() {
        return hasText(dbUrl) && hasText(dbUser) && hasText(dbPassword);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
