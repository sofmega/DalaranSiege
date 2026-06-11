package com.dalaran.dalarans.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Component
public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(AppRole.USER.authority()));

        if (isAdmin(jwt)) {
            authorities.add(new SimpleGrantedAuthority(AppRole.ADMIN.authority()));
        }

        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private boolean isAdmin(Jwt jwt) {
        String role = jwt.getClaimAsString("role");

        if ("admin".equalsIgnoreCase(role)) {
            return true;
        }

        Map<String, Object> appMetadata = jwt.getClaim("app_metadata");
        return appMetadata != null && "admin".equalsIgnoreCase(String.valueOf(appMetadata.get("role")));
    }
}
