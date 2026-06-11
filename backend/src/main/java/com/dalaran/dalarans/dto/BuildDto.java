package com.dalaran.dalarans.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BuildDto(
        UUID id,
        String heroId,
        String name,
        String notes,
        UUID authorId,
        String authorName,
        List<String> itemIds,
        int score,
        int upvotes,
        int downvotes,
        Integer currentUserVote,
        Instant createdAt,
        Instant updatedAt
) {
}
