package blog.demo.web.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.TrackRequest;
import blog.demo.common.utils.ClientIp;
import blog.demo.system.service.StatsService;

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
