package com.docnest.repository;

import com.docnest.entity.TaxSlayerConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxSlayerConfigRepository extends JpaRepository<TaxSlayerConfig, Integer> {
    TaxSlayerConfig findByRowKey(Integer rowKey);
}
