package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.ItemDto;
import com.dalaran.dalarans.mapper.CatalogMapper;
import com.dalaran.dalarans.repository.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final CatalogMapper catalogMapper;

    public ItemService(ItemRepository itemRepository, CatalogMapper catalogMapper) {
        this.itemRepository = itemRepository;
        this.catalogMapper = catalogMapper;
    }

    public List<ItemDto> findAll() {
        return itemRepository.findAllByOrderByNameAsc().stream()
                .map(catalogMapper::toDto)
                .toList();
    }

    public List<ItemDto> findByShopId(String shopId) {
        if (shopId == null || shopId.isBlank()) {
            return findAll();
        }

        return itemRepository.findByShopIdOrderByNameAsc(shopId).stream()
                .map(catalogMapper::toDto)
                .toList();
    }

    public Optional<ItemDto> findById(String id) {
        return itemRepository.findByIdIgnoreCase(id)
                .map(catalogMapper::toDto);
    }
}
