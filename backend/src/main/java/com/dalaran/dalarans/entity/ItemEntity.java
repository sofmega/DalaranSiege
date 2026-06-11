package com.dalaran.dalarans.entity;

import com.dalaran.dalarans.dto.ItemRequirementDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "items", schema = "public")
public class ItemEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "item_class", nullable = false)
    private String itemClass;

    @Column(nullable = false)
    private int price;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private String[] bonuses;

    @Column(nullable = false)
    private String description;

    @Column(name = "\"range\"")
    private Integer range;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> stats;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<ItemRequirementDto> requirements;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "shop_ids", nullable = false, columnDefinition = "text[]")
    private String[] shopIds;

    @Column(name = "icon_url", nullable = false)
    private String iconUrl;

    protected ItemEntity() {
        // Required by JPA
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getItemClass() {
        return itemClass;
    }

    public int getPrice() {
        return price;
    }

    public String[] getBonuses() {
        return bonuses;
    }

    public String getDescription() {
        return description;
    }

    public Integer getRange() {
        return range;
    }

    public Map<String, Object> getStats() {
        return stats;
    }

    public List<ItemRequirementDto> getRequirements() {
        return requirements;
    }

    public String[] getShopIds() {
        return shopIds;
    }

    public String getIconUrl() {
        return iconUrl;
    }
}
