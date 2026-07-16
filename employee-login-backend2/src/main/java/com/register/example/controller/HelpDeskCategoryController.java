package com.register.example.controller;

import com.register.example.payload.CategoryDTO;
import com.register.example.payload.SubCategoryDTO;
import com.register.example.entity.Category;
import com.register.example.entity.SubCategory;
import com.register.example.service.HelpDeskCategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/helpdesk-categories")
@CrossOrigin(origins = "*")
public class HelpDeskCategoryController {

    private final HelpDeskCategoryService service;

    public HelpDeskCategoryController(HelpDeskCategoryService service) {
        this.service = service;
    }

    @PostMapping("/create")
    public CategoryDTO createCategory(@RequestBody CategoryDTO dto) {

        Category cat = service.createOrGetCategory(
                dto.getTeamName(),      // ✔ correct
                dto.getTicketType(),    // ✔ correct
                dto.getCategoryName()   // ✔ correct
        );

        return new CategoryDTO(
                cat.getId(),
                cat.getCategoryName(),
                cat.getTicketType(),
                cat.getTeamName()
        );
    }

    @GetMapping("/by-team-type")
    public List<CategoryDTO> getCategories(
            @RequestParam String teamName,
            @RequestParam String ticketType) {

        return service.getCategoriesByTeamAndType(teamName, ticketType)
                .stream()
                .map(c -> new CategoryDTO(
                        c.getId(),
                        c.getCategoryName(),
                        c.getTicketType(),
                        c.getTeamName()
                ))
                .toList();
    }

    @PostMapping("/{categoryId}/subcategories/create")
    public SubCategoryDTO createSubCat(
            @PathVariable Long categoryId,
            @RequestBody SubCategoryDTO dto) {

        SubCategory sub = service.createSubCategory(categoryId, dto.getSubCategoryName());
        return new SubCategoryDTO(sub.getId(), sub.getSubCategoryName());
    }

    @GetMapping("/{categoryId}/subcategories")
    public List<SubCategoryDTO> getSubCategories(@PathVariable Long categoryId) {
        return service.getSubCategoriesByCategory(categoryId)
                .stream()
                .map(s -> new SubCategoryDTO(s.getId(), s.getSubCategoryName()))
                .toList();
    }
    
    @GetMapping("/ticket-type")
    public List<CategoryDTO> getCategoriesByTicketType(@RequestParam String ticketType) {
        return service.getCategoriesByTicketType(ticketType)
                .stream()
                .map(c -> new CategoryDTO(
                        c.getId(),
                        c.getCategoryName(),
                        c.getTicketType(),
                        c.getTeamName()
                ))
                .toList();
    }

    @GetMapping("/ticket-types")
    public List<String> getAllTicketTypes() {
        return service.getAllTicketTypes();
    }
}
