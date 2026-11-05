package xyz.cy666.blog.dto;

import java.util.List;

public record UvSummaryView(
        long pv,
        long uv,
        long todayPv,
        long todayUv,
        int activeDays,
        List<UvDayView> series) {
}
