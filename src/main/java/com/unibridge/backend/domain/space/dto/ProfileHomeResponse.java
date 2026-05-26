package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 个人空间「主页」Tab 响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileHomeResponse {
    /** 当前 Profile 主体 UID（user.user_uid） */
    private String uid;

    /**
     * 是否查看自己的空间：access_token 解码 UID 与 query {@code uid} 逐字符一致时为 {@code true}。
     */
    private Boolean viewingOwnSpace;
    private List<ProfileProjectItem> projects;
    private List<ProfileNoteItem> notes;
    private Long projectTotal;
    private Long noteTotal;
}
