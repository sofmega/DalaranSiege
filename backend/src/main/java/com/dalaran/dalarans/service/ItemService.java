package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.ItemDto;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    private final List<ItemDto> items;

    public ItemService(ObjectMapper objectMapper) {
        this.items = loadItems(objectMapper);
    }

    public List<ItemDto> findAll() {
        return items;
    }

    public List<ItemDto> findByShopId(String shopId) {
        if (shopId == null || shopId.isBlank()) {
            return findAll();
        }

        return items.stream()
                .filter(item -> item.shopIds().contains(shopId))
                .toList();
    }

    public Optional<ItemDto> findById(String id) {
        return items.stream()
                .filter(item -> item.id().equalsIgnoreCase(id))
                .findFirst();
    }

    private List<ItemDto> loadItems(ObjectMapper objectMapper) {
        ClassPathResource resource = new ClassPathResource("data/items.json");

        try (InputStream inputStream = resource.getInputStream()) {
            ItemDto[] loadedItems = objectMapper.readValue(inputStream, ItemDto[].class);
            return List.of(loadedItems);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load item data from data/items.json", exception);
        }
    }
}
