package xyz.cy666.blog.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.CommentRequest;
import xyz.cy666.blog.dto.CommentView;
import xyz.cy666.blog.security.ClientIp;
import xyz.cy666.blog.service.CommentService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/posts/{slug}/comments")
    public ApiResponse<List<CommentView>> list(@PathVariable String slug) {
        return ApiResponse.ok(commentService.listBySlug(slug));
    }

    @PostMapping("/posts/{slug}/comments")
    public ApiResponse<CommentView> create(@PathVariable String slug,
                                           @Valid @RequestBody CommentRequest request,
                                           HttpServletRequest servletRequest) {
        return ApiResponse.ok(commentService.create(slug, request, ClientIp.of(servletRequest)));
    }
}
