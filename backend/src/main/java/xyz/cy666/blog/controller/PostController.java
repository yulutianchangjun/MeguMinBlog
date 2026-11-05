package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.CategoryView;
import xyz.cy666.blog.dto.PostDetail;
import xyz.cy666.blog.dto.PostSummary;
import xyz.cy666.blog.service.CategoryService;
import xyz.cy666.blog.service.PostService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final CategoryService categoryService;

    @GetMapping("/posts")
    public ApiResponse<List<PostSummary>> posts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "new") String sort) {
        return ApiResponse.ok(postService.listPublished(category, keyword, sort));
    }

    @GetMapping("/posts/{slug}")
    public ApiResponse<PostDetail> detail(@PathVariable String slug) {
        PostDetail detail = postService.detail(slug, false);
        postService.incrementViews(detail.id());
        return ApiResponse.ok(detail);
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoryView>> categories() {
        return ApiResponse.ok(categoryService.list());
    }
}
