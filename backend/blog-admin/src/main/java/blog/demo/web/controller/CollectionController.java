package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.CollectionView;
import blog.demo.common.dto.PostSummary;
import blog.demo.system.service.CollectionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ApiResponse<List<CollectionView>> list() {
        return ApiResponse.ok(collectionService.list());
    }

    @GetMapping("/{slug}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable String slug) {
        CollectionView collection = collectionService.detail(slug);
        List<PostSummary> posts = collectionService.posts(slug);
        return ApiResponse.ok(Map.of("collection", collection, "posts", posts));
    }
}
