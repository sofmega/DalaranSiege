package com.dalaran.dalarans.service;

import com.dalaran.dalarans.config.SupabaseProperties;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@Service
public class SupabaseStatusService {

    private final SupabaseProperties properties;

    public SupabaseStatusService(SupabaseProperties properties) {
        this.properties = properties;
    }

    public SupabaseStatus checkStatus() {
        if (!properties.hasDatabaseConfig()) {
            return new SupabaseStatus(false, false, "Supabase database config is missing.");
        }

        try (Connection connection = DriverManager.getConnection(
                properties.dbUrl(),
                properties.dbUser(),
                properties.dbPassword()
        )) {
            return new SupabaseStatus(
                    true,
                    connection.isValid(5),
                    connection.getMetaData().getDatabaseProductName()
            );
        } catch (SQLException exception) {
            return new SupabaseStatus(true, false, exception.getMessage());
        }
    }

    public record SupabaseStatus(boolean configured, boolean connected, String message) {
    }
}
