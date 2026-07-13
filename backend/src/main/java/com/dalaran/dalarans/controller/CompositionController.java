package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.dto.CompositionDto;
import com.dalaran.dalarans.dto.CreateCompositionRequest;
import com.dalaran.dalarans.dto.VoteBuildRequest;
import com.dalaran.dalarans.service.CompositionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compositions")
public class CompositionController {

    private final CompositionService compositionService;

    public CompositionController(CompositionService compositionService) {
        this.compositionService = compositionService;
    }

    @GetMapping
    public ResponseEntity<List<CompositionDto>> getCompositions(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(compositionService.findAll(jwt));
    }

    @GetMapping("/{compositionId}")
    public ResponseEntity<CompositionDto> getComposition(
            @PathVariable UUID compositionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(compositionService.findById(compositionId, jwt));
    }

    @PostMapping
    public ResponseEntity<CompositionDto> createComposition(
            @Valid @RequestBody CreateCompositionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(compositionService.create(request, jwt));
    }

    @PostMapping("/{compositionId}/vote")
    public ResponseEntity<CompositionDto> vote(
            @PathVariable UUID compositionId,
            @Valid @RequestBody VoteBuildRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(compositionService.vote(compositionId, request, jwt));
    }

    @DeleteMapping("/{compositionId}")
    public ResponseEntity<Void> deleteComposition(
            @PathVariable UUID compositionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        compositionService.delete(compositionId, jwt);
        return ResponseEntity.noContent().build();
    }
}
