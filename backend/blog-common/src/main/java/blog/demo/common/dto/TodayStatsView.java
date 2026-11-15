package blog.demo.common.dto;

/** 今日访问统计（公开接口，前台页头展示） */
public record TodayStatsView(String date, long pv, long uv) {
}
