package com.dalaran.dalarans.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateBuildRequest(
        @NotBlank String heroId,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String notes,
        @Size(max = 6) List<@NotBlank String> earlyItemIds,
        @Size(max = 6) List<@NotBlank String> coreItemIds,
        @Size(max = 6) List<@NotBlank String> optionalItemIds,
        // Legacy alias. Remove after the frontend sends coreItemIds.
        @Size(max = 6) List<@NotBlank String> itemIds
) {
}
