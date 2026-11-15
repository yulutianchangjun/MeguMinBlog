package blog.demo.common.dto;

/** 登录验证码：id 用于校验，question 是展示给用户的算式 */
public record CaptchaView(String id, String question) {
}
