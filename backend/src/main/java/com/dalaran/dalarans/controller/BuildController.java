package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.dto.BuildDto;
import com.dalaran.dalarans.dto.CreateBuildRequest;
import com.dalaran.dalarans.dto.UpdateBuildRequest;
import com.dalaran.dalarans.dto.VoteBuildRequest;
import com.dalaran.dalarans.service.BuildService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/builds")
@CrossOrigin(origins = "http://localhost:4201")
public class BuildController {

    private final BuildService buildService;

    public BuildController(BuildService buildService) {
        this.buildService = buildService;
    }

    @GetMapping
    public ResponseEntity<List<BuildDto>> getPublicBuilds(
            @RequestParam String heroId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(buildService.findPublicBuilds(heroId, jwt));
    }

    @PostMapping
    public ResponseEntity<BuildDto> createBuild(
            @Valid @RequestBody CreateBuildRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(buildService.createBuild(request, jwt));
    }

    @PostMapping("/{buildId}/vote")
    public ResponseEntity<BuildDto> vote(
            @PathVariable UUID buildId,
            @Valid @RequestBody VoteBuildRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(buildService.vote(buildId, request, jwt));
    }

    @PutMapping("/{buildId}")
    public ResponseEntity<BuildDto> updateBuild(
            @PathVariable UUID buildId,
            @Valid @RequestBody UpdateBuildRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(buildService.updateBuild(buildId, request, jwt));
    }

    @DeleteMapping("/{buildId}")
    public ResponseEntity<Void> deleteBuild(
            @PathVariable UUID buildId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        buildService.deleteBuild(buildId, jwt);
        return ResponseEntity.noContent().build();
    }
}
