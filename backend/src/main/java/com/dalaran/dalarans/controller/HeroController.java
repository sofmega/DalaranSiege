package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.dto.HeroDto;
import com.dalaran.dalarans.service.HeroService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/heroes")
@CrossOrigin(origins = "http://localhost:4201")
public class HeroController {

    private final HeroService heroService;

    public HeroController(HeroService heroService) {
        this.heroService = heroService;
    }

    @GetMapping
    public ResponseEntity<List<HeroDto>> getAllHeroes() {
        return ResponseEntity.ok(heroService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HeroDto> getHeroById(@PathVariable String id) {
        return heroService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
