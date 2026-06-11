package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.ShopDto;
import com.dalaran.dalarans.mapper.CatalogMapper;
import com.dalaran.dalarans.repository.ShopRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final CatalogMapper catalogMapper;

    public ShopService(ShopRepository shopRepository, CatalogMapper catalogMapper) {
        this.shopRepository = shopRepository;
        this.catalogMapper = catalogMapper;
    }

    public List<ShopDto> findAll() {
        return shopRepository.findAllByOrderByNameAsc().stream()
                .map(catalogMapper::toDto)
                .toList();
    }
}
