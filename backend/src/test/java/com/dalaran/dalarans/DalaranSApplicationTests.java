package com.dalaran.dalarans;

import com.dalaran.dalarans.config.SupabaseProperties;
import com.dalaran.dalarans.controller.HealthController;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DalaranSApplicationTests {

    @Test
    void healthEndpointReportsUpWithoutExternalDependencies() {
        assertEquals(Map.of("status", "UP"), new HealthController().health());
    }

    @Test
    void supabaseDatabaseConfigurationRequiresEveryCredential() {
        SupabaseProperties complete = new SupabaseProperties(
                "https://example.supabase.co",
                "https://example.supabase.co/auth/v1",
                "jdbc:postgresql://example:5432/postgres",
                "postgres.example",
                "password"
        );
        SupabaseProperties missingPassword = new SupabaseProperties(
                complete.url(),
                complete.jwtIssuer(),
                complete.dbUrl(),
                complete.dbUser(),
                ""
        );

        assertTrue(complete.hasDatabaseConfig());
        assertFalse(missingPassword.hasDatabaseConfig());
    }
}
