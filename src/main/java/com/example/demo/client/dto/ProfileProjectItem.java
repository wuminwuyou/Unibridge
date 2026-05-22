package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 个人空间项目卡片项。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileProjectItem {
    private String title;
    private String summary;
    private List<TagLabel> tags;
    private String company;
    private String publisher;
    private String publishTime;
    private String level;
    private String amount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagLabel {
        private String label;
    }
}
