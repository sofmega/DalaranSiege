package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.dto.CurrentUserDto;
import com.dalaran.dalarans.service.ProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ProfileService profileService;

    public AuthController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public CurrentUserDto me(@AuthenticationPrincipal Jwt jwt) {
        return profileService.findOrCreateCurrentUser(jwt);
    }
}
