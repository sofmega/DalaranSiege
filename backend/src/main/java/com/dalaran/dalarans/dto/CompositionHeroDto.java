package com.dalaran.dalarans.dto;

import java.util.List;

public record CompositionHeroDto(
        int position,
        String id,
        String name,
        String heroClass,
        List<String> roles,
        String iconUrl
) {
}
