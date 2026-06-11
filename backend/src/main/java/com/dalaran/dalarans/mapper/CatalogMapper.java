package com.dalaran.dalarans.mapper;

import com.dalaran.dalarans.dto.HeroDto;
import com.dalaran.dalarans.dto.ItemDto;
import com.dalaran.dalarans.dto.ItemRequirementDto;
import com.dalaran.dalarans.dto.ShopDto;
import com.dalaran.dalarans.entity.HeroEntity;
import com.dalaran.dalarans.entity.ItemEntity;
import com.dalaran.dalarans.entity.ShopEntity;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class CatalogMapper {

    public HeroDto toDto(HeroEntity hero) {
        return new HeroDto(
                hero.getId(),
                hero.getName(),
                hero.getHeroClass(),
                toList(hero.getRoles()),
                hero.getIconUrl()
        );
    }

    public ItemDto toDto(ItemEntity item) {
        return new ItemDto(
                item.getId(),
                item.getName(),
                item.getItemClass(),
                item.getPrice(),
                toList(item.getBonuses()),
                item.getDescription(),
                item.getRange(),
                nullToEmpty(item.getStats()),
                nullToEmpty(item.getRequirements()),
                toList(item.getShopIds()),
                item.getIconUrl()
        );
    }

    public ShopDto toDto(ShopEntity shop) {
        return new ShopDto(shop.getId(), shop.getName());
    }

    private List<String> toList(String[] values) {
        if (values == null) {
            return List.of();
        }

        return Arrays.asList(values);
    }

    private Map<String, Object> nullToEmpty(Map<String, Object> value) {
        if (value == null) {
            return Map.of();
        }

        return value;
    }

    private List<ItemRequirementDto> nullToEmpty(List<ItemRequirementDto> value) {
        if (value == null) {
            return List.of();
        }

        return value;
    }
}
