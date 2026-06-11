package com.dalaran.dalarans.dto;

import java.util.UUID;

public record CurrentUserDto(
        UUID id,
        String email,
        String username,
        String role
) {
}
