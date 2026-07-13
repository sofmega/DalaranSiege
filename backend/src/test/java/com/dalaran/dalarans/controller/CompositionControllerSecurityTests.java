package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.dto.CompositionDto;
import com.dalaran.dalarans.security.SecurityConfig;
import com.dalaran.dalarans.security.SupabaseJwtAuthenticationConverter;
import com.dalaran.dalarans.service.CompositionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.ServletWebSecurityAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CompositionController.class)
@Import(SecurityConfig.class)
@ImportAutoConfiguration({SecurityAutoConfiguration.class, ServletWebSecurityAutoConfiguration.class})
class CompositionControllerSecurityTests {

    private static final UUID COMPOSITION_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CompositionService compositionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private SupabaseJwtAuthenticationConverter jwtAuthenticationConverter;

    @Test
    void guestCanViewCompositionListAndDetail() throws Exception {
        when(compositionService.findAll(null)).thenReturn(List.of());
        when(compositionService.findById(COMPOSITION_ID, null)).thenReturn(composition());

        mockMvc.perform(get("/api/compositions")).andExpect(status().isOk());
        mockMvc.perform(get("/api/compositions/{id}", COMPOSITION_ID)).andExpect(status().isOk());
    }

    @Test
    void guestCannotCreateVoteOrDelete() throws Exception {
        mockMvc.perform(post("/api/compositions")
                        .contentType("application/json")
                        .content("""
                                {"name":"Strong team fight","notes":"","heroIds":["anduin"]}
                                """))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/compositions/{id}/vote", COMPOSITION_ID)
                        .contentType("application/json")
                        .content("{\"vote\":1}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/compositions/{id}", COMPOSITION_ID))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedUserCanCreateVoteAndDelete() throws Exception {
        when(compositionService.create(any(), any())).thenReturn(composition());
        when(compositionService.vote(any(), any(), any())).thenReturn(composition());

        mockMvc.perform(post("/api/compositions")
                        .with(jwt().jwt(token -> token.subject("11111111-1111-1111-1111-111111111111")))
                        .contentType("application/json")
                        .content("""
                                {"name":"Strong team fight","notes":"","heroIds":["anduin"]}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/compositions/{id}/vote", COMPOSITION_ID)
                        .with(jwt().jwt(token -> token.subject("11111111-1111-1111-1111-111111111111")))
                        .contentType("application/json")
                        .content("{\"vote\":1}"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/compositions/{id}", COMPOSITION_ID)
                        .with(jwt().jwt(token -> token.subject("11111111-1111-1111-1111-111111111111"))))
                .andExpect(status().isNoContent());
    }

    private CompositionDto composition() {
        return new CompositionDto(
                COMPOSITION_ID,
                "Strong team fight",
                "",
                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                "Player",
                List.of(),
                0,
                0,
                0,
                null,
                true,
                Instant.now(),
                Instant.now()
        );
    }
}
