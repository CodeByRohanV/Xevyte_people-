package com.register.example.controller;

import com.register.example.entity.AllCategories;
import com.register.example.service.AllCategoriesService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/all-categories")
@CrossOrigin(origins = "*")
public class AllCategoriesController {

    private final AllCategoriesService service;

    public AllCategoriesController(AllCategoriesService service) {
        this.service = service;
    }

    // Add new Category
    @PostMapping("/category/add")
    public String addCategory(@RequestParam String category) {
        service.addCategory(category);
        return "Category saved successfully";
    }

    // Add new Type
    @PostMapping("/type/add")
    public String addType(@RequestParam String type) {
        service.addType(type);
        return "Type saved successfully";
    }

    // Get all Categories + Types
    @GetMapping("/all")
    public List<AllCategories> getAll() {
        return service.getAll();
    }
}
