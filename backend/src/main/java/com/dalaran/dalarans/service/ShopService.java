package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.ShopDto;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
public class ShopService {

    private final List<ShopDto> shops;

    public ShopService(ObjectMapper objectMapper) {
        this.shops = loadShops(objectMapper);
    }

    public List<ShopDto> findAll() {
        return shops;
    }

    private List<ShopDto> loadShops(ObjectMapper objectMapper) {
        ClassPathResource resource = new ClassPathResource("data/shops.json");

        try (InputStream inputStream = resource.getInputStream()) {
            ShopDto[] loadedShops = objectMapper.readValue(inputStream, ShopDto[].class);
            return List.of(loadedShops);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load shop data from data/shops.json", exception);
        }
    }
}
