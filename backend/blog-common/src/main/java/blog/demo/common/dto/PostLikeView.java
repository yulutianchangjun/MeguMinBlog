package blog.demo.common.dto;

/** 点赞状态：liked 表示当前 IP 是否已赞，total 为该文章的总赞数 */
public record PostLikeView(boolean liked, int total) {
}
