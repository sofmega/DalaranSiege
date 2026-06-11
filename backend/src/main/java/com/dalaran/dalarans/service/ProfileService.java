package com.dalaran.dalarans.service;

import com.dalaran.dalarans.dto.CurrentUserDto;
import com.dalaran.dalarans.entity.ProfileEntity;
import com.dalaran.dalarans.repository.ProfileRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional
    public CurrentUserDto findOrCreateCurrentUser(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        ProfileEntity profile = profileRepository.findById(userId)
                .orElseGet(() -> profileRepository.save(new ProfileEntity(userId)));
        String username = extractUsername(jwt);

        if ((profile.getUsername() == null || profile.getUsername().isBlank()) && username != null) {
            profile.setUsername(username);
        }

        return new CurrentUserDto(
                profile.getId(),
                extractEmail(jwt),
                profile.getUsername(),
                profile.appRole().databaseValue()
        );
    }

    private String extractEmail(Jwt jwt) {
        String email = jwt.getClaimAsString("email");

        if (email != null) {
            return email;
        }

        Map<String, Object> userMetadata = jwt.getClaim("user_metadata");

        if (userMetadata == null) {
            return null;
        }

        Object metadataEmail = userMetadata.get("email");
        return metadataEmail instanceof String value ? value : null;
    }

    private String extractUsername(Jwt jwt) {
        Map<String, Object> userMetadata = jwt.getClaim("user_metadata");

        if (userMetadata == null) {
            return fallbackUsername(jwt);
        }

        Object username = userMetadata.get("username");
        if (username instanceof String value && !value.isBlank()) {
            return value.trim();
        }

        Object name = userMetadata.get("name");
        if (name instanceof String value && !value.isBlank()) {
            return value.trim();
        }

        return fallbackUsername(jwt);
    }

    private String fallbackUsername(Jwt jwt) {
        String email = extractEmail(jwt);

        if (email == null || email.isBlank() || !email.contains("@")) {
            return "user-" + jwt.getSubject().substring(0, 8);
        }

        return email.substring(0, email.indexOf('@')) + "-" + jwt.getSubject().substring(0, 8);
    }
}
