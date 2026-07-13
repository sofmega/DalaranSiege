package com.dalaran.dalarans.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateCompositionRequest(
        @NotBlank @Size(min = 3, max = 80) String name,
        @Size(max = 2000) String notes,
        @NotNull @Size(min = 1, max = 6) List<@NotBlank String> heroIds
) {
}
