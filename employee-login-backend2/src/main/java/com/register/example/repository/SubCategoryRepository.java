package com.register.example.repository;

import com.register.example.entity.SubCategory;
import com.register.example.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    List<SubCategory> findByCategory(Category category);
}
