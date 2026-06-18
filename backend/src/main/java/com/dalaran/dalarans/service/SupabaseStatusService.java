package com.dalaran.dalarans.service;

import com.dalaran.dalarans.config.SupabaseProperties;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Service
public class SupabaseStatusService {

    private final SupabaseProperties properties;
    private final DataSource dataSource;

    public SupabaseStatusService(SupabaseProperties properties, DataSource dataSource) {
        this.properties = properties;
        this.dataSource = dataSource;
    }

    public SupabaseStatus checkStatus() {
        if (!properties.hasDatabaseConfig()) {
            return new SupabaseStatus(false, false, "Supabase database config is missing.");
        }

        try (Connection connection = dataSource.getConnection()) {
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
