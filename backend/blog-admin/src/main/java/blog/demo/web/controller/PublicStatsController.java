package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.TodayStatsView;
import blog.demo.system.service.StatsService;

/**
 * 公开的访问统计：只暴露今日 PV/UV 两个数字，不涉及明细。
 * 供前台页头的「今日访客」展示，访客与博主都能看到。
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class PublicStatsController {

    private final StatsService statsService;

    @GetMapping("/today")
    public ApiResponse<TodayStatsView> today() {
        return ApiResponse.ok(statsService.todayStats());
    }
}
