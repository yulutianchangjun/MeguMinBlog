package blog.demo.web.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.CategoryView;
import blog.demo.common.dto.PostDetail;
import blog.demo.common.dto.PostLikeView;
import blog.demo.common.dto.PostSummary;
import blog.demo.common.utils.ClientIp;
import blog.demo.framework.security.RateLimiter;
import blog.demo.system.service.CategoryService;
import blog.demo.system.service.PostLikeService;
import blog.demo.system.service.PostService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final CategoryService categoryService;
    private final PostLikeService postLikeService;
    private final RateLimiter rateLimiter;

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

    /** 当前 IP 对这篇文章的点赞状态（是否已赞 + 总赞数） */
    @GetMapping("/posts/{slug}/like")
    public ApiResponse<PostLikeView> likeStatus(@PathVariable String slug, HttpServletRequest request) {
        return ApiResponse.ok(postLikeService.status(slug, ClientIp.of(request)));
    }

    /** 点赞 / 取消点赞：同一 IP 再点一次即取消，按 IP 去重入库 */
    @PostMapping("/posts/{slug}/like")
    public ApiResponse<PostLikeView> toggleLike(@PathVariable String slug, HttpServletRequest request) {
        String ip = ClientIp.of(request);
        rateLimiter.checkLike(ip);
        return ApiResponse.ok(postLikeService.toggle(slug, ip));
    }
}
