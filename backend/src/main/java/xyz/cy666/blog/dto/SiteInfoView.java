package xyz.cy666.blog.dto;

import java.util.List;

public record SiteInfoView(
        String startDate,
        List<AnniversaryView> anniversaries) {
}
