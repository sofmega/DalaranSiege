package com.dalaran.dalarans.repository;

import com.dalaran.dalarans.entity.HeroEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HeroRepository extends JpaRepository<HeroEntity, String> {

    List<HeroEntity> findAllByOrderByNameAsc();

    Optional<HeroEntity> findByIdIgnoreCase(String id);

    List<HeroEntity> findByHeroClassOrderByNameAsc(String heroClass);
}
