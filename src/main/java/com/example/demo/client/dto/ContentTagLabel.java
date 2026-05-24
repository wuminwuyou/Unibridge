package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Feed / 个人空间项目卡片标签：`{ label: string }`。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentTagLabel {
    private String label;
}
