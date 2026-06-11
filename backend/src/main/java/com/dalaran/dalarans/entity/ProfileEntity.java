package com.dalaran.dalarans.entity;

import com.dalaran.dalarans.security.AppRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "profiles", schema = "public")
public class ProfileEntity {

    @Id
    private UUID id;

    private String username;

    @Column(nullable = false)
    private String role = AppRole.USER.databaseValue();

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected ProfileEntity() {
        // Required by JPA
    }

    public ProfileEntity(UUID id) {
        this.id = id;
        this.role = AppRole.USER.databaseValue();
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public AppRole appRole() {
        return AppRole.fromDatabaseValue(role);
    }
}
