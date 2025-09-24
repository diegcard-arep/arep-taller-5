package com.arep.properties.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.arep.properties.model.Property;
import com.arep.properties.repository.PropertyRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class PropertyService {
    private final PropertyRepository repository;

    public PropertyService(PropertyRepository repository) {
        this.repository = repository;
    }

    public Property create(Property p) {
        p.setId(null);
        return repository.save(p);
    }

    public Page<Property> list(String address, BigDecimal minPrice, BigDecimal maxPrice, Integer minSize, Integer maxSize, Pageable pageable) {
        Specification<Property> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (address != null && !address.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("address")), "%" + address.toLowerCase() + "%"));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (minSize != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("size"), minSize));
            }
            if (maxSize != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("size"), maxSize));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return repository.findAll(spec, pageable);
    }

    public Optional<Property> get(Long id) {
        return repository.findById(id);
    }

    public Optional<Property> update(Long id, Property body) {
        return repository.findById(id).map(existing -> {
            existing.setAddress(body.getAddress());
            existing.setPrice(body.getPrice());
            existing.setSize(body.getSize());
            existing.setDescription(body.getDescription());
            return repository.save(existing);
        });
    }

    public boolean delete(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
