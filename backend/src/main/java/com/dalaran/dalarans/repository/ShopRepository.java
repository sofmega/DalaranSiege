package com.dalaran.dalarans.repository;

import com.dalaran.dalarans.entity.ShopEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopRepository extends JpaRepository<ShopEntity, String> {

    List<ShopEntity> findAllByOrderByNameAsc();
}
