package com.dalaran.dalarans.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "shops", schema = "public")
public class ShopEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    protected ShopEntity() {
        // Required by JPA
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
