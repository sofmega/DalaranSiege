package com.dalaran.dalarans.config;

import java.nio.file.Path;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SupabaseProperties.class)
public class SupabaseConfig {

    static {
        LocalEnvLoader.load(Path.of(".env"));
        LocalEnvLoader.load(Path.of("..", ".env"));
    }
}
