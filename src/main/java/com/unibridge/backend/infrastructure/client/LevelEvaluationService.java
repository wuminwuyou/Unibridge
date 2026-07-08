package com.unibridge.backend.infrastructure.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibridge.backend.domain.project.dto.ProjectEvaluateResponse;
import com.unibridge.backend.infrastructure.client.dto.LevelEvalApiResponse;
import com.unibridge.backend.infrastructure.client.dto.LevelEvalResult;
import com.unibridge.backend.infrastructure.entities.project.ProjectLevelAudit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

/**
 * 项目难度等级评估服务。
 *
 * <p>封装 AI 模型 API 调用、JSON 解析、审计数据组装。
 * 提示词由 {@link LevelEvalPromptProvider} 独立管理。</p>
 */
@Service
public class LevelEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(LevelEvaluationService.class);
    private static final Set<String> VALID_LEVELS = Set.of("S", "A", "B", "C", "D", "E");

    @Value("${level-eval.api-key:}")
    private String apiKey;

    @Value("${level-eval.api.url:https://api.deepseek.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${level-eval.api.model:deepseek-v4-flash}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final LevelEvalPromptProvider promptProvider;

    public LevelEvaluationService(LevelEvalPromptProvider promptProvider) {
        this.restTemplate = new RestTemplateBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .readTimeout(Duration.ofSeconds(60))
                .build();
        this.objectMapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.promptProvider = promptProvider;
    }

    /**
     * 调用 AI 模型评估项目难度，同时产出用户响应和审计数据。
     *
     * @return 包含 {@link ProjectEvaluateResponse} 和审计实体 {@link ProjectLevelAudit}
     */
    public EvalResult evaluate(String description, String contentDetail,
                                String keyId, String userUid) {
        Map<String, Object> requestBody = buildRequestBody(description, contentDetail);
        String requestJson = toJson(requestBody);
        LevelEvalApiResponse apiResp = callApi(requestBody);
        log.info("API response: finish_reason={}, usage={}",
                apiResp.getChoices().get(0).getFinishReason(),
                apiResp.getUsage() != null ? apiResp.getUsage().getTotalTokens() + " tokens" : "unknown");
        String rawContent = apiResp.getChoices().get(0).getMessage().getContent();
        if (rawContent == null || rawContent.isBlank()) {
            log.error("Model returned empty content. finish_reason={}, prompt_tokens={}, completion_tokens={}. "
                       + "This usually means max_tokens is too low for thinking mode.",
                    apiResp.getChoices().get(0).getFinishReason(),
                    apiResp.getUsage() != null ? apiResp.getUsage().getPromptTokens() : "?",
                    apiResp.getUsage() != null ? apiResp.getUsage().getCompletionTokens() : "?");
            throw new RuntimeException("模型返回空内容：思考模式消耗了所有 max_tokens，请增大 max_tokens 或缩短输入长度。");
        }
        LevelEvalResult evalResult = parseContent(rawContent);
        ProjectEvaluateResponse userResp = toUserResponse(evalResult);
        ProjectLevelAudit audit = toAudit(evalResult, requestJson, apiResp,
                description, keyId, userUid);
        return new EvalResult(userResp, audit);
    }

    // ── 请求构建 ──

    private Map<String, Object> buildRequestBody(String description, String contentDetail) {
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", promptProvider.getSystemPrompt()),
                Map.of("role", "user", "content",
                        promptProvider.buildUserMessage(description, contentDetail))
        );
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", 0.3);
        body.put("max_tokens", 65536);
        body.put("thinking", Map.of("type", "enabled"));
        body.put("response_format", Map.of("type", "json_object"));
        return body;
    }

    // ── API 调用 ──

    private LevelEvalApiResponse callApi(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<LevelEvalApiResponse> resp = restTemplate.postForEntity(
                apiUrl, entity, LevelEvalApiResponse.class);
        if (resp.getBody() == null || resp.getBody().getChoices() == null
                || resp.getBody().getChoices().isEmpty()) {
            throw new RuntimeException("模型返回空结果");
        }
        return resp.getBody();
    }

    // ── JSON 解析（清洗 markdown 包裹）──

    private LevelEvalResult parseContent(String raw) {
        String json = raw.trim();
        if (json.startsWith("```")) {
            int s = json.indexOf("\n");
            int e = json.lastIndexOf("```");
            if (s > 0 && e > s) json = json.substring(s + 1, e).trim();
        }
        try {
            return objectMapper.readValue(json, LevelEvalResult.class);
        } catch (JsonProcessingException ex) {
            log.error("JSON parse failed: {}", raw, ex);
            throw new RuntimeException("AI 评估结果格式异常", ex);
        }
    }

    // ── 用户响应组装 ──

    private ProjectEvaluateResponse toUserResponse(LevelEvalResult r) {
        String level = safeLevel(r);

        LevelEvalResult.OverallLevel ov = r.getOverallLevel();
        String explanation = (ov != null && ov.getReason() != null)
                ? ov.getReason() : "模型未提供详细理由";

        // suggestions：优先逻辑检查失败，其次信息不足时的 guidance_summary
        String suggestions = buildSuggestions(r);
        if (suggestions == null && "?".equals(level)
                && ov != null && ov.getGuidanceSummary() != null
                && !ov.getGuidanceSummary().isBlank()) {
            suggestions = ov.getGuidanceSummary();
        }

        return ProjectEvaluateResponse.builder()
                .level(level).explanation(explanation).suggestions(suggestions).build();
    }

    private String safeLevel(LevelEvalResult r) {
        if (r.getOverallLevel() == null
                || r.getOverallLevel().getLevel() == null
                || r.getOverallLevel().getLevel().isBlank()) return "?";
        String u = r.getOverallLevel().getLevel().toUpperCase();
        if ("?".equals(u)) return "?";
        if ("N/A".equals(u)) return "N/A";
        return VALID_LEVELS.contains(u) ? u : "?";
    }

    private String buildSuggestions(LevelEvalResult r) {
        if (r.getPrecheck() == null || r.getPrecheck().getLogicCheck() == null) return null;
        var lc = r.getPrecheck().getLogicCheck();
        if (!lc.isFailed() || lc.getIssues() == null || lc.getIssues().isEmpty()) return null;
        StringBuilder sb = new StringBuilder("项目内容描述可能存在错误部分：\n");
        for (var issue : lc.getIssues()) {
            sb.append("- \"").append(issue.getQuote())
              .append("\"：").append(issue.getReason()).append("\n");
        }
        sb.append("请检查并修改。");
        return sb.toString();
    }

    // ── 审计实体组装 ──

    private ProjectLevelAudit toAudit(LevelEvalResult r, String requestJson,
                                       LevelEvalApiResponse apiResp,
                                       String desc, String keyId, String userUid) {
        ProjectLevelAudit a = new ProjectLevelAudit();
        a.setUserUid(userUid);
        a.setKeyId(keyId);
        a.setEvaluatorType("AI");
        a.setDescriptionPlaintext(desc);
        // contentDetailCiphertext 由外层 ProjectEvaluateService 用原始密文覆盖，此处不设置

        LevelEvalResult.Precheck pre = r.getPrecheck();
        a.setPrecheckStatus(pre != null ? pre.getStatus() : "unknown");
        a.setLogicCheckFailed(pre != null && pre.getLogicCheck() != null
                && pre.getLogicCheck().isFailed());

        LevelEvalResult.Features ft = r.getFeatures();
        if (ft != null) {
            setFeat(a, ft.getScaleAndSize(), 1);
            setFeat(a, ft.getIntegrationAndDepth(), 2);
            setFeat(a, ft.getStandardsAndConstraints(), 3);
            setFeat(a, ft.getSolutionAvailability(), 4);
            setFeat(a, ft.getTheoreticalThreshold(), 5);
            setFeat(a, ft.getDomainSpan(), 6);
        } else {
            defaultFeat(a);
        }

        LevelEvalResult.SummaryLevel eng = r.getEngineeringLevel();
        a.setEngineeringLevel(eng != null ? safeChar(eng.getLevel()) : "?");
        a.setEngineeringBasedOn(eng != null ? eng.getBasedOn() : "");

        LevelEvalResult.SummaryLevel inno = r.getInnovationLevel();
        a.setInnovationLevel(inno != null ? safeChar(inno.getLevel()) : "?");
        a.setInnovationBasedOn(inno != null ? inno.getBasedOn() : "");

        LevelEvalResult.OverallLevel ov = r.getOverallLevel();
        if (ov == null || ov.getLevel() == null || ov.getLevel().isBlank()) {
            a.setFinalLevel("?");
            a.setFinalReason("模型未提供理由");
        } else {
            String lv = ov.getLevel().toUpperCase();
            if ("?".equals(lv)) {
                a.setFinalLevel("?");
            } else if ("N/A".equals(lv)) {
                a.setFinalLevel("N/A");
            } else {
                a.setFinalLevel(safeChar(lv));
            }
            a.setFinalReason(ov.getReason() != null ? ov.getReason() : "模型未提供理由");
        }

        a.setRawModelOutput(toJson(r));
        a.setEvaluationRequest(requestJson);
        a.setModelName(model);

        LevelEvalApiResponse.Usage usage = apiResp.getUsage();
        if (usage != null) {
            a.setPromptTokens(usage.getPromptTokens());
            a.setCompletionTokens(usage.getCompletionTokens());
            a.setTokenUsage(usage.getTotalTokens());
            if (usage.getCompletionTokensDetails() != null) {
                a.setThinkingTokens(usage.getCompletionTokensDetails().getReasoningTokens());
            }
        }
        a.setOperatorUid(userUid);
        return a;
    }

    private void setFeat(ProjectLevelAudit a, LevelEvalResult.FeatureItem item, int idx) {
        String rawLevel = (item != null && item.getLevel() != null && !item.getLevel().isBlank())
                ? item.getLevel().toUpperCase() : "?";
        String lv = rawLevel.equals("?") ? "?" : rawLevel.substring(0, 1);
        String reason = (item != null && item.getReason() != null) ? item.getReason() : "";
        String evidence = (item != null && item.getEvidence() != null) ? item.getEvidence() : "未提及";
        switch (idx) {
            case 1: a.setFeatScale(lv); a.setFeatScaleReason(reason); a.setFeatScaleEvidence(evidence); break;
            case 2: a.setFeatIntegration(lv); a.setFeatIntegrationReason(reason); a.setFeatIntegrationEvidence(evidence); break;
            case 3: a.setFeatConstraints(lv); a.setFeatConstraintsReason(reason); a.setFeatConstraintsEvidence(evidence); break;
            case 4: a.setFeatAvailability(lv); a.setFeatAvailabilityReason(reason); a.setFeatAvailabilityEvidence(evidence); break;
            case 5: a.setFeatThreshold(lv); a.setFeatThresholdReason(reason); a.setFeatThresholdEvidence(evidence); break;
            case 6: a.setFeatDomainSpan(lv); a.setFeatDomainSpanReason(reason); a.setFeatDomainSpanEvidence(evidence); break;
        }
    }

    private void defaultFeat(ProjectLevelAudit a) {
        a.setFeatScale("?"); a.setFeatIntegration("?"); a.setFeatConstraints("?");
        a.setFeatAvailability("?"); a.setFeatThreshold("?"); a.setFeatDomainSpan("?");
    }

    private String safeChar(String lv) {
        if (lv == null || lv.isBlank()) return "?";
        if ("?".equals(lv)) return "?";
        String u = lv.toUpperCase().substring(0, 1);
        return "SABCDE".contains(u) ? u : "?";
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (JsonProcessingException e) { return "{}"; }
    }

    // ── 结果载体 ──

    public static class EvalResult {
        private final ProjectEvaluateResponse userResponse;
        private final ProjectLevelAudit audit;

        public EvalResult(ProjectEvaluateResponse userResponse, ProjectLevelAudit audit) {
            this.userResponse = userResponse;
            this.audit = audit;
        }

        public ProjectEvaluateResponse getUserResponse() { return userResponse; }
        public ProjectLevelAudit getAudit() { return audit; }
    }
}
