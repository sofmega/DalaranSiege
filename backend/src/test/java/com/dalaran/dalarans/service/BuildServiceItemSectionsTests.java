package com.dalaran.dalarans.service;

import com.dalaran.dalarans.entity.ItemEntity;
import com.dalaran.dalarans.exception.InvalidBuildItemsException;
import com.dalaran.dalarans.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BuildServiceItemSectionsTests {

    private BuildService buildService;
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        ItemRepository itemRepository = mock(ItemRepository.class);
        when(itemRepository.findAllById(any())).thenAnswer(invocation -> {
            Iterable<String> requestedIds = invocation.getArgument(0);
            List<ItemEntity> items = new ArrayList<>();
            requestedIds.forEach(itemId -> {
                ItemEntity item = mock(ItemEntity.class);
                when(item.getId()).thenReturn(itemId);
                items.add(item);
            });
            return items;
        });
        jdbcTemplate = mock(JdbcTemplate.class);
        buildService = new BuildService(jdbcTemplate, mock(ProfileService.class), itemRepository);
    }

    @Test
    void allowsSixItemsInEverySection() {
        BuildService.ItemSections sections = buildService.resolveAndValidateItems(
                itemIds("early", 6),
                itemIds("core", 6),
                itemIds("optional", 6),
                null
        );

        assertEquals(6, sections.earlyItems().size());
        assertEquals(6, sections.coreItems().size());
        assertEquals(6, sections.optionalItems().size());
    }

    @Test
    void rejectsSevenEarlyItems() {
        assertSectionLimit("earlyItemIds", itemIds("early", 7), List.of("core-1"), List.of());
    }

    @Test
    void rejectsSevenCoreItems() {
        assertSectionLimit("coreItemIds", List.of(), itemIds("core", 7), List.of());
    }

    @Test
    void rejectsSevenOptionalItems() {
        assertSectionLimit("optionalItemIds", List.of(), List.of("core-1"), itemIds("optional", 7));
    }

    @Test
    void mapsLegacyItemIdsToCoreWhenSectionedFieldsAreAbsent() {
        BuildService.ItemSections sections = buildService.resolveAndValidateItems(
                null,
                null,
                null,
                List.of("legacy-1", "legacy-1", "legacy-2")
        );

        assertEquals(List.of(), sections.earlyItems());
        assertEquals(List.of("legacy-1", "legacy-1", "legacy-2"), sections.coreItems());
        assertEquals(List.of(), sections.optionalItems());
    }

    @Test
    void earlyBuildAllowsSixRepeatedItemSlots() {
        BuildService.ItemSections sections = buildService.resolveAndValidateItems(
                repeated("sobi-mask", 6), List.of(), List.of(), null
        );

        assertEquals(repeated("sobi-mask", 6), sections.earlyItems());
    }

    @Test
    void coreBuildAllowsSixRepeatedItemSlots() {
        BuildService.ItemSections sections = buildService.resolveAndValidateItems(
                List.of(), repeated("steel-sword", 6), List.of(), null
        );

        assertEquals(repeated("steel-sword", 6), sections.coreItems());
    }

    @Test
    void optionalItemsAllowSixRepeatedItemSlots() {
        BuildService.ItemSections sections = buildService.resolveAndValidateItems(
                List.of(), List.of(), repeated("potion", 6), null
        );

        assertEquals(repeated("potion", 6), sections.optionalItems());
    }

    @Test
    void responsePreservesRepeatedItems() {
        List<String> repeatedCoreItems = List.of("steel-sword", "steel-sword", "shield-of-honor");
        BuildService.BuildRow row = new BuildService.BuildRow(
                UUID.randomUUID(),
                "archmage",
                "Repeated items",
                "",
                UUID.randomUUID(),
                "Player",
                Instant.now(),
                Instant.now(),
                0,
                0,
                0,
                null
        );

        var response = row.toDto(new BuildService.ItemSections(List.of(), repeatedCoreItems, List.of()));

        assertEquals(repeatedCoreItems, response.coreItems());
        assertEquals(repeatedCoreItems, response.itemIds());
    }

    @Test
    void savedBuildReloadPreservesRepeatedItemsAndPositionOrder() {
        UUID buildId = UUID.randomUUID();
        List<String> storedItems = List.of("sobi-mask", "sobi-mask", "steel-sword", "sobi-mask");

        doAnswer(invocation -> {
            RowCallbackHandler handler = invocation.getArgument(1);
            var resultSet = mock(java.sql.ResultSet.class);
            when(resultSet.getObject("build_id", UUID.class)).thenReturn(buildId);
            when(resultSet.getString("section")).thenReturn("EARLY");
            for (String itemId : storedItems) {
                when(resultSet.getString("item_id")).thenReturn(itemId);
                handler.processRow(resultSet);
            }
            return null;
        }).when(jdbcTemplate).query(anyString(), any(RowCallbackHandler.class), any(Object[].class));

        Map<UUID, BuildService.ItemSections> reloaded = buildService.findItemsByBuild(List.of(buildId));

        assertEquals(storedItems, reloaded.get(buildId).earlyItems());
    }

    private void assertSectionLimit(
            String fieldName,
            List<String> earlyItemIds,
            List<String> coreItemIds,
            List<String> optionalItemIds
    ) {
        InvalidBuildItemsException exception = assertThrows(
                InvalidBuildItemsException.class,
                () -> buildService.resolveAndValidateItems(earlyItemIds, coreItemIds, optionalItemIds, null)
        );
        assertEquals(fieldName + " must contain at most 6 items.", exception.getMessage());
    }

    private List<String> itemIds(String prefix, int count) {
        return java.util.stream.IntStream.rangeClosed(1, count)
                .mapToObj(index -> prefix + "-" + index)
                .toList();
    }

    private List<String> repeated(String itemId, int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(ignored -> itemId)
                .toList();
    }
}
