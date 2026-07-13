package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.CreateCompositionRequest;
import com.dalaran.dalarans.dto.CurrentUserDto;
import com.dalaran.dalarans.dto.VoteBuildRequest;
import com.dalaran.dalarans.entity.HeroEntity;
import com.dalaran.dalarans.exception.CompositionLimitExceededException;
import com.dalaran.dalarans.exception.ForbiddenCompositionAccessException;
import com.dalaran.dalarans.exception.InvalidCompositionException;
import com.dalaran.dalarans.repository.HeroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CompositionServiceTests {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OTHER_USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID COMPOSITION_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    private JdbcTemplate jdbcTemplate;
    private ProfileService profileService;
    private HeroRepository heroRepository;
    private CompositionService compositionService;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        profileService = mock(ProfileService.class);
        heroRepository = mock(HeroRepository.class);
        compositionService = new CompositionService(jdbcTemplate, profileService, heroRepository);
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(USER_ID.toString());
        when(profileService.findOrCreateCurrentUser(jwt))
                .thenReturn(new CurrentUserDto(USER_ID, "player@example.com", "Player", "user"));
        when(heroRepository.findAllById(any())).thenAnswer(invocation -> {
            Iterable<String> requestedIds = invocation.getArgument(0);
            List<HeroEntity> heroes = new ArrayList<>();
            requestedIds.forEach(heroId -> {
                HeroEntity hero = mock(HeroEntity.class);
                when(hero.getId()).thenReturn(heroId);
                heroes.add(hero);
            });
            return heroes;
        });
    }

    @Test
    void authenticatedUserCanCreateAndOwnerComesFromJwt() {
        mockSuccessfulRead(USER_ID);
        when(jdbcTemplate.queryForObject(contains("count(*)"), eq(Integer.class), eq(USER_ID))).thenReturn(0);
        when(jdbcTemplate.queryForObject(contains("insert into public.compositions"), eq(UUID.class),
                eq(USER_ID), eq("Strong team fight"), eq("Balanced notes"))).thenReturn(COMPOSITION_ID);

        compositionService.create(new CreateCompositionRequest(
                "  Strong team fight  ",
                "  Balanced notes  ",
                List.of("anduin", "arthas", "jaina")
        ), jwt);

        verify(jdbcTemplate).update(contains("composition_heroes"), eq(COMPOSITION_ID), eq("anduin"), eq(0));
        verify(jdbcTemplate).update(contains("composition_heroes"), eq(COMPOSITION_ID), eq("arthas"), eq(1));
        verify(jdbcTemplate).update(contains("composition_heroes"), eq(COMPOSITION_ID), eq("jaina"), eq(2));
    }

    @Test
    void heroOrderIsPreserved() {
        List<String> heroIds = compositionService.resolveAndValidateHeroIds(
                List.of("anduin", "arthas", "cairne", "jaina")
        );
        assertEquals(List.of("anduin", "arthas", "cairne", "jaina"), heroIds);
    }

    @Test
    void duplicateHeroesAreRejected() {
        InvalidCompositionException exception = assertThrows(
                InvalidCompositionException.class,
                () -> compositionService.resolveAndValidateHeroIds(List.of("anduin", "anduin"))
        );
        assertEquals("The same hero cannot appear twice in a composition.", exception.getMessage());
    }

    @Test
    void sevenHeroesAreRejected() {
        assertThrows(InvalidCompositionException.class, () -> compositionService.resolveAndValidateHeroIds(
                List.of("h1", "h2", "h3", "h4", "h5", "h6", "h7")
        ));
    }

    @Test
    void zeroHeroesAreRejected() {
        assertThrows(
                InvalidCompositionException.class,
                () -> compositionService.resolveAndValidateHeroIds(List.of())
        );
    }

    @Test
    void missingHeroIsRejected() {
        HeroEntity hero = mock(HeroEntity.class);
        when(hero.getId()).thenReturn("anduin");
        doReturn(List.of(hero)).when(heroRepository).findAllById(any());

        InvalidCompositionException exception = assertThrows(
                InvalidCompositionException.class,
                () -> compositionService.resolveAndValidateHeroIds(List.of("anduin", "missing"))
        );
        assertEquals("Unknown hero IDs: missing", exception.getMessage());
    }

    @Test
    void emptyNameIsRejectedAfterTrimming() {
        assertThrows(InvalidCompositionException.class, () -> compositionService.normalizeName("   "));
    }

    @Test
    void fifthCompositionIsRejected() {
        when(jdbcTemplate.queryForObject(contains("count(*)"), eq(Integer.class), eq(USER_ID))).thenReturn(4);

        assertThrows(CompositionLimitExceededException.class, () -> compositionService.create(
                new CreateCompositionRequest("Valid name", "", List.of("anduin")),
                jwt
        ));
        verify(jdbcTemplate, never()).update(contains("composition_heroes"), any(), any(), any());
    }

    @Test
    void missingCompositionReturnsNotFound() {
        when(jdbcTemplate.query(contains("select c.id"), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of());
        assertThrows(
                EmptyResultDataAccessException.class,
                () -> compositionService.findById(COMPOSITION_ID, null)
        );
    }

    @Test
    void ownerCanDeleteCompositionAndCascadesAreHandledByDatabase() {
        when(jdbcTemplate.queryForObject(contains("select user_id"), eq(UUID.class), eq(COMPOSITION_ID)))
                .thenReturn(USER_ID);
        compositionService.delete(COMPOSITION_ID, jwt);
        verify(jdbcTemplate).update("delete from public.compositions where id = ?", COMPOSITION_ID);
    }

    @Test
    void anotherUserCannotDeleteComposition() {
        when(jdbcTemplate.queryForObject(contains("select user_id"), eq(UUID.class), eq(COMPOSITION_ID)))
                .thenReturn(OTHER_USER_ID);
        assertThrows(ForbiddenCompositionAccessException.class, () -> compositionService.delete(COMPOSITION_ID, jwt));
    }

    @Test
    void repeatedVotingUsesOneUpsertRecord() {
        when(jdbcTemplate.queryForObject(contains("select user_id"), eq(UUID.class), eq(COMPOSITION_ID)))
                .thenReturn(USER_ID);
        mockSuccessfulRead(USER_ID);

        compositionService.vote(COMPOSITION_ID, new VoteBuildRequest(1), jwt);
        compositionService.vote(COMPOSITION_ID, new VoteBuildRequest(-1), jwt);

        verify(jdbcTemplate, org.mockito.Mockito.times(2)).update(
                contains("on conflict (composition_id, user_id)"),
                eq(COMPOSITION_ID),
                eq(USER_ID),
                any()
        );
    }

    private void mockSuccessfulRead(UUID ownerId) {
        CompositionService.CompositionRow row = new CompositionService.CompositionRow(
                COMPOSITION_ID,
                "Strong team fight",
                "Balanced notes",
                ownerId,
                "Player",
                Instant.now(),
                Instant.now(),
                0,
                0,
                0,
                null
        );
        when(jdbcTemplate.query(contains("select c.id"), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of(row));
    }
}
