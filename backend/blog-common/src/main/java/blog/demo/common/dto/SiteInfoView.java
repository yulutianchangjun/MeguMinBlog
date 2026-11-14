package blog.demo.common.dto;

import java.util.List;

public record SiteInfoView(
        String startDate,
        List<AnniversaryView> anniversaries) {
}
