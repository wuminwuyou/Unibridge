package com.unibridge.backend.domain.team.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "批量同步团队成员（ManageMembersForm 保存）")
@Data
public class SyncTeamMembersRequest {
    private List<MemberUpdate> updates;
    private List<MemberAddition> additions;
    private List<MemberRemoval> removals;

    @Data
    public static class MemberUpdate {
        private String uid;
        private String career;
        private Boolean isAdmin;
    }

    @Data
    public static class MemberAddition {
        private String uid;
        /** MEMBER | MENTOR */
        private String role;
        private String career;
    }

    @Data
    public static class MemberRemoval {
        private String uid;
    }
}
