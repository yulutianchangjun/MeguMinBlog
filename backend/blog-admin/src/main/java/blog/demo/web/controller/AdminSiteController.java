package blog.demo.web.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import blog.demo.common.core.ApiResponse;
import blog.demo.common.dto.AnniversaryRequest;
import blog.demo.common.dto.AnniversaryView;
import blog.demo.system.service.SiteService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSiteController {

    private final SiteService siteService;

    @GetMapping("/anniversaries")
    public ApiResponse<List<AnniversaryView>> listAnniversaries() {
        return ApiResponse.ok(siteService.listAnniversaries());
    }

    @PostMapping("/anniversaries")
    public ApiResponse<AnniversaryView> createAnniversary(@RequestBody AnniversaryRequest request) {
        return ApiResponse.ok(siteService.createAnniversary(request));
    }

    @PutMapping("/anniversaries/{id}")
    public ApiResponse<AnniversaryView> updateAnniversary(@PathVariable Long id,
                                                          @RequestBody AnniversaryRequest request) {
        return ApiResponse.ok(siteService.updateAnniversary(id, request));
    }

    @DeleteMapping("/anniversaries/{id}")
    public ApiResponse<Void> deleteAnniversary(@PathVariable Long id) {
        siteService.deleteAnniversary(id);
        return ApiResponse.ok();
    }

    @PutMapping("/site-config")
    public ApiResponse<Void> updateStartDate(@RequestBody StartDateRequest request) {
        siteService.updateStartDate(request.getStartDate());
        return ApiResponse.ok();
    }

    @Data
    public static class StartDateRequest {
        private String startDate;
    }
}
