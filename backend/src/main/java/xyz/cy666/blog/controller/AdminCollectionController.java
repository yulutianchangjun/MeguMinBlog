package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.CollectionRequest;
import xyz.cy666.blog.dto.CollectionView;
import xyz.cy666.blog.service.CollectionService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/collections")
@RequiredArgsConstructor
public class AdminCollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ApiResponse<List<CollectionView>> list() {
        return ApiResponse.ok(collectionService.list());
    }

    @PostMapping
    public ApiResponse<CollectionView> create(@RequestBody CollectionRequest request) {
        request.setId(null);
        return ApiResponse.ok(collectionService.save(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CollectionView> update(@PathVariable Long id, @RequestBody CollectionRequest request) {
        request.setId(id);
        return ApiResponse.ok(collectionService.save(request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        collectionService.delete(id);
        return ApiResponse.ok();
    }
}
