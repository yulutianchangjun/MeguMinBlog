package xyz.cy666.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank(message = "请留下你的昵称")
        @Size(min = 2, max = 20, message = "昵称需要 2~20 个字符")
        String author,

        @NotBlank(message = "评论内容不能为空")
        @Size(min = 2, max = 1000, message = "评论需要 2~1000 个字符")
        String content,

        String turnstileToken) {
}
