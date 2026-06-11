package com.dalaran.dalarans.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record VoteBuildRequest(
        @Min(-1) @Max(1) int vote
) {
}
