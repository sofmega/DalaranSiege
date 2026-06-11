package com.dalaran.dalarans.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "heroes", schema = "public")
public class HeroEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "hero_class", nullable = false)
    private String heroClass;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] roles;

    @Column(name = "icon_url", nullable = false)
    private String iconUrl;

    protected HeroEntity() {
        // Required by JPA
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getHeroClass() {
        return heroClass;
    }

    public String[] getRoles() {
        return roles;
    }

    public String getIconUrl() {
        return iconUrl;
    }
}