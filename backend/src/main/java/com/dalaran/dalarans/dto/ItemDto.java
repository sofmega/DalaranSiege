package com.dalaran.dalarans.dto;

import java.util.Map;
import java.util.List;

public record ItemDto(
        String id,
        String name,
        String itemClass,
        int price,
        List<String> bonuses,
        String description,
        Integer range,
        Map<String, Object> stats,
        List<ItemRequirementDto> requirements,
        List<String> shopIds,
        String iconUrl
) {
}
