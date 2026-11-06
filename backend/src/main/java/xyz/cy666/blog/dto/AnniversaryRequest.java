package xyz.cy666.blog.dto;

import lombok.Data;

@Data
public class AnniversaryRequest {
    private String label;
    /** MM-DD，例如 11-30 */
    private String date;
    private String note;
    private Integer sort;
}
