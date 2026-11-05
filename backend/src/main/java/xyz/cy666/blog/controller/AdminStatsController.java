package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.CheckinView;
import xyz.cy666.blog.dto.UvSummaryView;
import xyz.cy666.blog.service.CheckinService;
import xyz.cy666.blog.service.StatsService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminStatsController {

    private final StatsService statsService;
    private final CheckinService checkinService;

    @GetMapping("/stats/uv")
    public ApiResponse<UvSummaryView> uv() {
        return ApiResponse.ok(statsService.summary());
    }

    @PostMapping("/checkin")
    public ApiResponse<CheckinView> checkin() {
        return ApiResponse.ok(checkinService.checkin());
    }
}
