package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.BuildDto;
import com.dalaran.dalarans.dto.CreateBuildRequest;
import com.dalaran.dalarans.dto.CurrentUserDto;
import com.dalaran.dalarans.dto.UpdateBuildRequest;
import com.dalaran.dalarans.dto.VoteBuildRequest;
import com.dalaran.dalarans.exception.BuildLimitExceededException;
import com.dalaran.dalarans.exception.ForbiddenBuildAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BuildService {

    private final JdbcTemplate jdbcTemplate;
    private final ProfileService profileService;

    public BuildService(JdbcTemplate jdbcTemplate, ProfileService profileService) {
        this.jdbcTemplate = jdbcTemplate;
        this.profileService = profileService;
    }

    public List<BuildDto> findPublicBuilds(String heroId, Jwt jwt) {
        UUID currentUserId = jwt == null ? null : UUID.fromString(jwt.getSubject());
        List<BuildRow> rows = jdbcTemplate.query("""
                select b.id,
                       b.hero_id,
                       b.name,
                       b.notes,
                       b.user_id,
                       coalesce(p.username, 'Unknown player') as author_name,
                       b.created_at,
                       b.updated_at,
                       coalesce(sum(v.vote_value), 0)::int as score,
                       count(v.id) filter (where v.vote_value = 1)::int as upvotes,
                       count(v.id) filter (where v.vote_value = -1)::int as downvotes,
                       (
                         select bv.vote_value
                         from public.build_votes bv
                         where bv.build_id = b.id
                           and bv.user_id = ?
                       ) as current_user_vote
                from public.builds b
                left join public.profiles p on p.id = b.user_id
                left join public.build_votes v on v.build_id = b.id
                where b.hero_id = ?
                  and b.is_public = true
                group by b.id, p.username
                order by score desc, b.created_at desc
                """, (rs, rowNum) -> new BuildRow(
                rs.getObject("id", UUID.class),
                rs.getString("hero_id"),
                rs.getString("name"),
                rs.getString("notes"),
                rs.getObject("user_id", UUID.class),
                rs.getString("author_name"),
                toInstant(rs.getTimestamp("created_at")),
                toInstant(rs.getTimestamp("updated_at")),
                rs.getInt("score"),
                rs.getInt("upvotes"),
                rs.getInt("downvotes"),
                (Integer) rs.getObject("current_user_vote")
        ), currentUserId, heroId);

        Map<UUID, List<String>> itemIdsByBuild = findItemIdsByBuild(rows.stream().map(BuildRow::id).toList());

        return rows.stream()
                .map(row -> row.toDto(itemIdsByBuild.getOrDefault(row.id(), List.of())))
                .toList();
    }

    @Transactional
    public BuildDto createBuild(CreateBuildRequest request, Jwt jwt) {
        CurrentUserDto user = profileService.findOrCreateCurrentUser(jwt);
        int existingBuilds = jdbcTemplate.queryForObject("""
                select count(*)
                from public.builds
                where user_id = ?
                  and hero_id = ?
                """, Integer.class, user.id(), request.heroId().trim());

        if (existingBuilds >= 4) {
            throw new BuildLimitExceededException();
        }

        List<String> itemIds = request.itemIds().stream()
                .map(String::trim)
                .filter(itemId -> !itemId.isBlank())
                .limit(6)
                .toList();

        UUID buildId = jdbcTemplate.queryForObject("""
                insert into public.builds (user_id, hero_id, name, notes, is_public)
                values (?, ?, ?, ?, true)
                returning id
                """, UUID.class, user.id(), request.heroId().trim(), request.name().trim(), cleanNotes(request.notes()));

        for (int i = 0; i < itemIds.size(); i++) {
            jdbcTemplate.update("""
                    insert into public.build_items (build_id, item_id, slot_index)
                    values (?, ?, ?)
                    """, buildId, itemIds.get(i), i);
        }

        return findPublicBuilds(request.heroId(), jwt).stream()
                .filter(build -> build.id().equals(buildId))
                .findFirst()
                .orElseThrow();
    }

    @Transactional
    public BuildDto updateBuild(UUID buildId, UpdateBuildRequest request, Jwt jwt) {
        profileService.findOrCreateCurrentUser(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        BuildOwner buildOwner = findBuildOwner(buildId);

        if (!buildOwner.userId().equals(userId)) {
            throw new ForbiddenBuildAccessException();
        }

        List<String> itemIds = request.itemIds().stream()
                .map(String::trim)
                .filter(itemId -> !itemId.isBlank())
                .limit(6)
                .toList();

        jdbcTemplate.update("""
                update public.builds
                set name = ?, notes = ?
                where id = ?
                """, request.name().trim(), cleanNotes(request.notes()), buildId);
        jdbcTemplate.update("delete from public.build_items where build_id = ?", buildId);

        for (int i = 0; i < itemIds.size(); i++) {
            jdbcTemplate.update("""
                    insert into public.build_items (build_id, item_id, slot_index)
                    values (?, ?, ?)
                    """, buildId, itemIds.get(i), i);
        }

        return findPublicBuilds(buildOwner.heroId(), jwt).stream()
                .filter(build -> build.id().equals(buildId))
                .findFirst()
                .orElseThrow();
    }

    @Transactional
    public void deleteBuild(UUID buildId, Jwt jwt) {
        profileService.findOrCreateCurrentUser(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        BuildOwner buildOwner = findBuildOwner(buildId);

        if (!buildOwner.userId().equals(userId)) {
            throw new ForbiddenBuildAccessException();
        }

        jdbcTemplate.update("delete from public.builds where id = ?", buildId);
    }

    @Transactional
    public BuildDto vote(UUID buildId, VoteBuildRequest request, Jwt jwt) {
        profileService.findOrCreateCurrentUser(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());

        if (request.vote() == 0) {
            jdbcTemplate.update("delete from public.build_votes where build_id = ? and user_id = ?", buildId, userId);
        } else {
            jdbcTemplate.update("""
                    insert into public.build_votes (build_id, user_id, vote_value)
                    values (?, ?, ?)
                    on conflict (build_id, user_id)
                    do update set vote_value = excluded.vote_value
                    """, buildId, userId, request.vote());
        }

        String heroId = jdbcTemplate.queryForObject(
                "select hero_id from public.builds where id = ?",
                String.class,
                buildId
        );

        return findPublicBuilds(heroId, jwt).stream()
                .filter(build -> build.id().equals(buildId))
                .findFirst()
                .orElseThrow();
    }

    private Map<UUID, List<String>> findItemIdsByBuild(List<UUID> buildIds) {
        Map<UUID, List<String>> result = new LinkedHashMap<>();

        if (buildIds.isEmpty()) {
            return result;
        }

        String placeholders = String.join(",", buildIds.stream().map(id -> "?").toList());
        jdbcTemplate.query("""
                select build_id, item_id
                from public.build_items
                where build_id in (%s)
                order by build_id, slot_index
                """.formatted(placeholders), rs -> {
            UUID buildId = rs.getObject("build_id", UUID.class);
            result.computeIfAbsent(buildId, ignored -> new ArrayList<>()).add(rs.getString("item_id"));
        }, buildIds.toArray());

        return result;
    }

    private BuildOwner findBuildOwner(UUID buildId) {
        return jdbcTemplate.queryForObject("""
                select user_id, hero_id
                from public.builds
                where id = ?
                """, (rs, rowNum) -> new BuildOwner(
                rs.getObject("user_id", UUID.class),
                rs.getString("hero_id")
        ), buildId);
    }

    private String cleanNotes(String notes) {
        return notes == null ? "" : notes.trim();
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private record BuildRow(
            UUID id,
            String heroId,
            String name,
            String notes,
            UUID authorId,
            String authorName,
            Instant createdAt,
            Instant updatedAt,
            int score,
            int upvotes,
            int downvotes,
            Integer currentUserVote
    ) {
        BuildDto toDto(List<String> itemIds) {
            return new BuildDto(
                    id,
                    heroId,
                    name,
                    notes,
                    authorId,
                    authorName,
                    itemIds,
                    score,
                    upvotes,
                    downvotes,
                    currentUserVote,
                    createdAt,
                    updatedAt
            );
        }
    }

    private record BuildOwner(UUID userId, String heroId) {
    }
}
