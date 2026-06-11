package com.dalaran.dalarans.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateBuildRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String notes,
        @NotEmpty @Size(max = 6) List<@NotBlank String> itemIds
) {
}
