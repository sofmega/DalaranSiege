package com.dalaran.dalarans;

import java.nio.file.Path;

import com.dalaran.dalarans.config.LocalEnvLoader;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DalaranSApplication {

	public static void main(String[] args) {
		LocalEnvLoader.load(Path.of("backend", ".env"));
		LocalEnvLoader.load(Path.of(".env"));
		LocalEnvLoader.load(Path.of("..", ".env"));
		SpringApplication.run(DalaranSApplication.class, args);
	}

}
