package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.CategoryView;
import blog.demo.common.dto.PostDetail;
import blog.demo.common.dto.PostSummary;
import blog.demo.system.service.CategoryService;
import blog.demo.system.service.PostService;

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
