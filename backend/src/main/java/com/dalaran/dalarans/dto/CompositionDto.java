package com.dalaran.dalarans.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CompositionDto(
        UUID id,
        String name,
        String notes,
        UUID authorId,
        String authorName,
        List<CompositionHeroDto> heroes,
        int score,
        int upvotes,
        int downvotes,
        Integer currentUserVote,
        boolean ownedByCurrentUser,
        Instant createdAt,
        Instant updatedAt
) {
}
