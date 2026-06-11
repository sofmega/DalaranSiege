package com.dalaran.dalarans.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class LocalEnvLoader {

    private LocalEnvLoader() {
    }

    public static void load(Path envPath) {
        if (!Files.isRegularFile(envPath)) {
            return;
        }

        try {
            for (String line : Files.readAllLines(envPath)) {
                String trimmed = line.trim();

                if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                    continue;
                }

                int separator = trimmed.indexOf('=');
                String key = trimmed.substring(0, separator).trim();
                String value = trimmed.substring(separator + 1).trim();

                if (!key.isEmpty() && System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ignored) {
            // Missing local env files should not block app startup.
        }
    }
}
