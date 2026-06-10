package com.dalaran.dalarans;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiController {

	@GetMapping("/api/hello")
	public HelloResponse hello() {
		return new HelloResponse("Spring Boot backend is running", Instant.now().toString());
	}

	public record HelloResponse(String message, String timestamp) {
	}
}
