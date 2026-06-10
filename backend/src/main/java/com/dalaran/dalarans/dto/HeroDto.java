package com.dalaran.dalarans.dto;

import java.util.List;

public record HeroDto(
        String id,
        String name,
        String heroClass,
        List<String> roles,
        String iconUrl
) {
}
