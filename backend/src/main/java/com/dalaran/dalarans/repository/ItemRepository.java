package com.dalaran.dalarans.repository;

import com.dalaran.dalarans.entity.ItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<ItemEntity, String> {

    List<ItemEntity> findAllByOrderByNameAsc();

    Optional<ItemEntity> findByIdIgnoreCase(String id);

    @Query(value = """
            select *
            from public.items
            where :shopId = any(shop_ids)
            order by name asc
            """, nativeQuery = true)
    List<ItemEntity> findByShopIdOrderByNameAsc(@Param("shopId") String shopId);
}
