package blog.demo.common.dto;

public record LoginResponse(String token, UserView user) {
}
