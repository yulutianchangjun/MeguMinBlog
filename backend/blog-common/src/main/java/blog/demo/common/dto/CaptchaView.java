package blog.demo.common.dto;

/** 登录验证码：只下发算式，答案留在服务端 Redis（按 IP 存，2 分钟有效） */
public record CaptchaView(String question) {
}
