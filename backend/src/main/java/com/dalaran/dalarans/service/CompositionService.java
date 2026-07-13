package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.CompositionDto;
import com.dalaran.dalarans.dto.CompositionHeroDto;
import com.dalaran.dalarans.dto.CreateCompositionRequest;
import com.dalaran.dalarans.dto.CurrentUserDto;
import com.dalaran.dalarans.dto.VoteBuildRequest;
import com.dalaran.dalarans.exception.CompositionLimitExceededException;
import com.dalaran.dalarans.exception.ForbiddenCompositionAccessException;
import com.dalaran.dalarans.exception.InvalidCompositionException;
import com.dalaran.dalarans.repository.HeroRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Array;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CompositionService {

    static final int MAX_COMPOSITIONS_PER_USER = 4;
    static final int MAX_HEROES = 6;

    private final JdbcTemplate jdbcTemplate;
    private final ProfileService profileService;
    private final HeroRepository heroRepository;

    public CompositionService(
            JdbcTemplate jdbcTemplate,
            ProfileService profileService,
            HeroRepository heroRepository
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.profileService = profileService;
        this.heroRepository = heroRepository;
    }

    public List<CompositionDto> findAll(Jwt jwt) {
        UUID currentUserId = currentUserId(jwt);
        List<CompositionRow> rows = queryCompositionRows("", currentUserId);
        return toDtos(rows, currentUserId);
    }

    public CompositionDto findById(UUID compositionId, Jwt jwt) {
        UUID currentUserId = currentUserId(jwt);
        List<CompositionRow> rows = queryCompositionRows("where c.id = ?", currentUserId, compositionId);
        if (rows.isEmpty()) {
            throw new EmptyResultDataAccessException(1);
        }
        return toDtos(rows, currentUserId).getFirst();
    }

    @Transactional
    public CompositionDto create(CreateCompositionRequest request, Jwt jwt) {
        CurrentUserDto user = profileService.findOrCreateCurrentUser(jwt);
        String name = normalizeName(request.name());
        String notes = normalizeNotes(request.notes());
        List<String> heroIds = resolveAndValidateHeroIds(request.heroIds());

        lockCompositionLimit(user.id());
        Integer existingCount = jdbcTemplate.queryForObject(
                "select count(*) from public.compositions where user_id = ?",
                Integer.class,
                user.id()
        );
        if (existingCount != null && existingCount >= MAX_COMPOSITIONS_PER_USER) {
            throw new CompositionLimitExceededException();
        }

        UUID compositionId;
        try {
            compositionId = jdbcTemplate.queryForObject("""
                    insert into public.compositions (user_id, name, notes)
                    values (?, ?, ?)
                    returning id
                    """, UUID.class, user.id(), name, notes);
        } catch (DataAccessException exception) {
            if (isCompositionLimitViolation(exception)) {
                throw new CompositionLimitExceededException();
            }
            throw exception;
        }

        for (int position = 0; position < heroIds.size(); position++) {
            jdbcTemplate.update("""
                    insert into public.composition_heroes (composition_id, hero_id, position)
                    values (?, ?, ?)
                    """, compositionId, heroIds.get(position), position);
        }

        return findById(compositionId, jwt);
    }

    @Transactional
    public void delete(UUID compositionId, Jwt jwt) {
        profileService.findOrCreateCurrentUser(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        UUID ownerId = findOwner(compositionId);
        if (!ownerId.equals(userId)) {
            throw new ForbiddenCompositionAccessException();
        }
        jdbcTemplate.update("delete from public.compositions where id = ?", compositionId);
    }

    @Transactional
    public CompositionDto vote(UUID compositionId, VoteBuildRequest request, Jwt jwt) {
        profileService.findOrCreateCurrentUser(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        findOwner(compositionId);

        if (request.vote() == 0) {
            jdbcTemplate.update(
                    "delete from public.composition_votes where composition_id = ? and user_id = ?",
                    compositionId,
                    userId
            );
        } else {
            jdbcTemplate.update("""
                    insert into public.composition_votes (composition_id, user_id, vote_value)
                    values (?, ?, ?)
                    on conflict (composition_id, user_id)
                    do update set vote_value = excluded.vote_value
                    """, compositionId, userId, request.vote());
        }

        return findById(compositionId, jwt);
    }

    List<String> resolveAndValidateHeroIds(List<String> submittedHeroIds) {
        if (submittedHeroIds == null || submittedHeroIds.isEmpty()) {
            throw new InvalidCompositionException("A composition must contain at least one hero.");
        }
        if (submittedHeroIds.size() > MAX_HEROES) {
            throw new InvalidCompositionException("A composition can contain at most 6 heroes.");
        }

        List<String> heroIds = submittedHeroIds.stream().map(heroId -> {
            if (heroId == null || heroId.isBlank()) {
                throw new InvalidCompositionException("Hero IDs cannot be blank.");
            }
            return heroId.trim();
        }).toList();

        if (new LinkedHashSet<>(heroIds).size() != heroIds.size()) {
            throw new InvalidCompositionException("The same hero cannot appear twice in a composition.");
        }

        Set<String> existingIds = new HashSet<>();
        heroRepository.findAllById(heroIds).forEach(hero -> existingIds.add(hero.getId()));
        List<String> missingIds = heroIds.stream().filter(heroId -> !existingIds.contains(heroId)).toList();
        if (!missingIds.isEmpty()) {
            throw new InvalidCompositionException("Unknown hero IDs: " + String.join(", ", missingIds));
        }

        return heroIds;
    }

    String normalizeName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.length() < 3 || normalized.length() > 80) {
            throw new InvalidCompositionException("Composition name must be between 3 and 80 characters.");
        }
        return normalized;
    }

    String normalizeNotes(String notes) {
        String normalized = notes == null ? "" : notes.trim();
        if (normalized.length() > 2000) {
            throw new InvalidCompositionException("Composition notes must contain at most 2000 characters.");
        }
        return normalized;
    }

    private List<CompositionRow> queryCompositionRows(
            String whereClause,
            UUID currentUserId,
            Object... filterParameters
    ) {
        List<Object> parameters = new ArrayList<>();
        parameters.add(currentUserId);
        parameters.addAll(Arrays.asList(filterParameters));

        return jdbcTemplate.query("""
                select c.id,
                       c.name,
                       c.notes,
                       c.user_id,
                       coalesce(p.username, 'Unknown player') as author_name,
                       c.created_at,
                       c.updated_at,
                       coalesce(sum(v.vote_value), 0)::int as score,
                       count(v.id) filter (where v.vote_value = 1)::int as upvotes,
                       count(v.id) filter (where v.vote_value = -1)::int as downvotes,
                       (
                         select cv.vote_value
                         from public.composition_votes cv
                         where cv.composition_id = c.id
                           and cv.user_id = ?
                       ) as current_user_vote
                from public.compositions c
                left join public.profiles p on p.id = c.user_id
                left join public.composition_votes v on v.composition_id = c.id
                %s
                group by c.id, p.username
                order by score desc, c.created_at desc
                """.formatted(whereClause), (rs, rowNum) -> new CompositionRow(
                rs.getObject("id", UUID.class),
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
        ), parameters.toArray());
    }

    private List<CompositionDto> toDtos(List<CompositionRow> rows, UUID currentUserId) {
        Map<UUID, List<CompositionHeroDto>> heroesByComposition = findHeroesByComposition(
                rows.stream().map(CompositionRow::id).toList()
        );
        return rows.stream()
                .map(row -> row.toDto(
                        heroesByComposition.getOrDefault(row.id(), List.of()),
                        currentUserId != null && currentUserId.equals(row.authorId())
                ))
                .toList();
    }

    private Map<UUID, List<CompositionHeroDto>> findHeroesByComposition(List<UUID> compositionIds) {
        if (compositionIds.isEmpty()) {
            return Map.of();
        }

        String placeholders = String.join(",", compositionIds.stream().map(id -> "?").toList());
        Map<UUID, List<CompositionHeroDto>> result = new LinkedHashMap<>();
        jdbcTemplate.query("""
                select ch.composition_id,
                       ch.position,
                       h.id,
                       h.name,
                       h.hero_class,
                       h.roles,
                       h.icon_url
                from public.composition_heroes ch
                join public.heroes h on h.id = ch.hero_id
                where ch.composition_id in (%s)
                order by ch.composition_id, ch.position
                """.formatted(placeholders), rs -> {
            UUID compositionId = rs.getObject("composition_id", UUID.class);
            result.computeIfAbsent(compositionId, ignored -> new ArrayList<>()).add(new CompositionHeroDto(
                    rs.getInt("position"),
                    rs.getString("id"),
                    rs.getString("name"),
                    rs.getString("hero_class"),
                    sqlArrayToStrings(rs.getArray("roles")),
                    rs.getString("icon_url")
            ));
        }, compositionIds.toArray());
        return result;
    }

    private void lockCompositionLimit(UUID userId) {
        jdbcTemplate.query(
                "select pg_advisory_xact_lock(hashtextextended(?, 0))",
                (rs, rowNum) -> null,
                userId.toString()
        );
    }

    private UUID findOwner(UUID compositionId) {
        return jdbcTemplate.queryForObject(
                "select user_id from public.compositions where id = ?",
                UUID.class,
                compositionId
        );
    }

    private boolean isCompositionLimitViolation(DataAccessException exception) {
        Throwable cause = exception.getMostSpecificCause();
        return cause.getMessage() != null && cause.getMessage().contains("maximum of 4 compositions");
    }

    private static UUID currentUserId(Jwt jwt) {
        return jwt == null ? null : UUID.fromString(jwt.getSubject());
    }

    private static List<String> sqlArrayToStrings(Array array) throws SQLException {
        return array == null ? List.of() : List.copyOf(Arrays.asList((String[]) array.getArray()));
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    record CompositionRow(
            UUID id,
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
        CompositionDto toDto(List<CompositionHeroDto> heroes, boolean ownedByCurrentUser) {
            return new CompositionDto(
                    id,
                    name,
                    notes,
                    authorId,
                    authorName,
                    heroes,
                    score,
                    upvotes,
                    downvotes,
                    currentUserVote,
                    ownedByCurrentUser,
                    createdAt,
                    updatedAt
            );
        }
    }
}
