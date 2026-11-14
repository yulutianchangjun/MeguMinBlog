package blog.demo.common.dto;

import java.util.List;

public record UvSummaryView(
        long pv,
        long uv,
        long todayPv,
        long todayUv,
        int activeDays,
        List<PageCountView> topPages,
        List<UvDayView> series) {

    public record PageCountView(String path, long count) {
    }
}
