package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.HeroDto;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

@Service
public class HeroService {

    private final List<HeroDto> heroes;

    public HeroService(ObjectMapper objectMapper) {
        this.heroes = loadHeroes(objectMapper);
    }

    public List<HeroDto> findAll() {
        return heroes;
    }

    public Optional<HeroDto> findById(String id) {
        return heroes.stream()
                .filter(hero -> hero.id().equalsIgnoreCase(id))
                .findFirst();
    }

    private List<HeroDto> loadHeroes(ObjectMapper objectMapper) {
        ClassPathResource resource = new ClassPathResource("data/heroes.json");

        try (InputStream inputStream = resource.getInputStream()) {
            HeroDto[] loadedHeroes = objectMapper.readValue(inputStream, HeroDto[].class);
            return List.of(loadedHeroes);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load hero data from data/heroes.json", exception);
        }
    }
}
