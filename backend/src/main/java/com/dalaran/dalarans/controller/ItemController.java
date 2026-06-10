package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.dto.ItemDto;
import com.dalaran.dalarans.service.ItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/items", "/api/items"})
@CrossOrigin(origins = "http://localhost:4201")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public ResponseEntity<List<ItemDto>> getAllItems(@RequestParam(required = false) String shopId) {
        return ResponseEntity.ok(itemService.findByShopId(shopId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemDto> getItemById(@PathVariable String id) {
        return itemService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
