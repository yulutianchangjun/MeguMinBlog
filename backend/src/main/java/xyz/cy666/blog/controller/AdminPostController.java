package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.PostDetail;
import xyz.cy666.blog.dto.PostRequest;
import xyz.cy666.blog.dto.PostSummary;
import xyz.cy666.blog.service.PostService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;

    @GetMapping
    public ApiResponse<List<PostSummary>> list() {
        return ApiResponse.ok(postService.listAll());
    }

    @PostMapping
    public ApiResponse<PostDetail> create(@RequestBody PostRequest request) {
        request.setId(null);
        return ApiResponse.ok(postService.save(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PostDetail> update(@PathVariable Long id, @RequestBody PostRequest request) {
        request.setId(id);
        return ApiResponse.ok(postService.save(request));
    }

    @PatchMapping("/{id}/flags")
    public ApiResponse<PostSummary> flags(@PathVariable Long id,
                                          @RequestParam(required = false) Boolean pinned,
                                          @RequestParam(required = false) String status) {
        return ApiResponse.ok(postService.updateFlags(id, pinned, status));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        postService.delete(id);
        return ApiResponse.ok();
    }
}
