package blog.demo.web.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.SiteInfoView;
import blog.demo.system.service.SiteService;

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
