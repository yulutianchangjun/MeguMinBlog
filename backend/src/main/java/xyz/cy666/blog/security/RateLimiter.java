package xyz.cy666.blog.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import xyz.cy666.blog.common.BizException;

import java.time.Duration;
import java.time.Instant;

/**
 * 基于 Redis 的滑动窗口（分钟/小时两级）限流。
 * 留言接口：同一 IP 每分钟 1 条、每小时 5 条。
 */
@Service
@RequiredArgsConstructor
public class RateLimiter {

    private static final int PER_MINUTE = 1;
    private static final int PER_HOUR = 5;

    private final StringRedisTemplate redis;

    public void checkMessage(String ip) {
        long minute = Instant.now().getEpochSecond() / 60;
        long hour = Instant.now().getEpochSecond() / 3600;

        String minuteKey = "rl:msg:m:" + ip + ":" + minute;
        String hourKey = "rl:msg:h:" + ip + ":" + hour;

        Long minuteCount = redis.opsForValue().increment(minuteKey);
        if (minuteCount != null && minuteCount == 1L) {
            redis.expire(minuteKey, Duration.ofMinutes(2));
        }
        if (minuteCount != null && minuteCount > PER_MINUTE) {
            throw BizException.tooMany("留言太快了，请一分钟后再试");
        }

        Long hourCount = redis.opsForValue().increment(hourKey);
        if (hourCount != null && hourCount == 1L) {
            redis.expire(hourKey, Duration.ofHours(2));
        }
        if (hourCount != null && hourCount > PER_HOUR) {
            throw BizException.tooMany("本小时的留言次数已用完，请稍后再来");
        }
    }

    /**
     * 文章评论：同一 IP 每分钟 1 条、每小时 10 条。
     */
    public void checkComment(String ip) {
        long minute = Instant.now().getEpochSecond() / 60;
        long hour = Instant.now().getEpochSecond() / 3600;

        String minuteKey = "rl:cmt:m:" + ip + ":" + minute;
        String hourKey = "rl:cmt:h:" + ip + ":" + hour;

        Long minuteCount = redis.opsForValue().increment(minuteKey);
        if (minuteCount != null && minuteCount == 1L) {
            redis.expire(minuteKey, Duration.ofMinutes(2));
        }
        if (minuteCount != null && minuteCount > 1) {
            throw BizException.tooMany("评论太快了，请一分钟后再试");
        }

        Long hourCount = redis.opsForValue().increment(hourKey);
        if (hourCount != null && hourCount == 1L) {
            redis.expire(hourKey, Duration.ofHours(2));
        }
        if (hourCount != null && hourCount > 10) {
            throw BizException.tooMany("本小时的评论次数已用完，请稍后再来");
        }
    }
}
