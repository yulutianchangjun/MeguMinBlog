package xyz.cy666.blog.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.TrackRequest;
import xyz.cy666.blog.security.ClientIp;
import xyz.cy666.blog.service.StatsService;

@RestController
@RequestMapping("/api/track")
@RequiredArgsConstructor
public class TrackController {

    private final StatsService statsService;

    @PostMapping
    public ApiResponse<Void> track(@RequestBody(required = false) TrackRequest request,
                                   HttpServletRequest servletRequest) {
        if (request != null) {
            statsService.track(request.path(), request.slug(), ClientIp.of(servletRequest));
        }
        return ApiResponse.ok();
    }
}
