package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.HeroDto;
import com.dalaran.dalarans.mapper.CatalogMapper;
import com.dalaran.dalarans.repository.HeroRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HeroService {

    private final HeroRepository heroRepository;
    private final CatalogMapper catalogMapper;

    public HeroService(HeroRepository heroRepository, CatalogMapper catalogMapper) {
        this.heroRepository = heroRepository;
        this.catalogMapper = catalogMapper;
    }

    public List<HeroDto> findAll() {
        return heroRepository.findAllByOrderByNameAsc().stream()
                .map(catalogMapper::toDto)
                .toList();
    }

    public Optional<HeroDto> findById(String id) {
        return heroRepository.findByIdIgnoreCase(id)
                .map(catalogMapper::toDto);
    }
}
