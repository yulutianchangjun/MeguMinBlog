package xyz.cy666.blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.dto.SiteInfoView;
import xyz.cy666.blog.service.SiteService;

@RestController
@RequestMapping("/api/site")
@RequiredArgsConstructor
public class SiteController {

    private final SiteService siteService;

    /** 前台站点信息：开站日期 + 纪念日倒计时数据 */
    @GetMapping
    public ApiResponse<SiteInfoView> info() {
        return ApiResponse.ok(siteService.info());
    }
}
