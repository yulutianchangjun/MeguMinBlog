package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.CheckinView;
import blog.demo.common.dto.UvSummaryView;
import blog.demo.system.service.CheckinService;
import blog.demo.system.service.StatsService;

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
