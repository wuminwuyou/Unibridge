package com.unibridge.backend.domain.project;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.project.dto.ProjectEvaluatePublicKeyResponse;
import com.unibridge.backend.domain.project.dto.ProjectEvaluateRequest;
import com.unibridge.backend.domain.project.dto.ProjectEvaluateResponse;
import com.unibridge.backend.infrastructure.client.LevelEvaluationService;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.crypto.CryptoAlgorithm;
import com.unibridge.backend.infrastructure.crypto.CryptoException;
import com.unibridge.backend.infrastructure.crypto.CryptoService;
import com.unibridge.backend.infrastructure.entities.infra.AsymmetricKey;
import com.unibridge.backend.infrastructure.entities.project.ProjectLevelAudit;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.AsymmetricKeyMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectLevelAuditMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ProjectEvaluateService {

    private static final Logger log = LoggerFactory.getLogger(ProjectEvaluateService.class);

    private static final String KEY_TYPE = "PROJECT_DESCRIPTION";
    private static final String CREATED_BY = "PROJECT_EVAL_API";
    private static final String STATUS_ACTIVE = "ACTIVE";

    private final CryptoService cryptoService;
    private final AsymmetricKeyMapper asymmetricKeyMapper;
    private final LevelEvaluationService levelEvaluationService;
    private final AccessService accessService;
    private final ProjectLevelAuditMapper projectLevelAuditMapper;

    public ProjectEvaluateService(CryptoService cryptoService,
                                  AsymmetricKeyMapper asymmetricKeyMapper,
                                  LevelEvaluationService levelEvaluationService,
                                  AccessService accessService,
                                  ProjectLevelAuditMapper projectLevelAuditMapper) {
        this.cryptoService = cryptoService;
        this.asymmetricKeyMapper = asymmetricKeyMapper;
        this.levelEvaluationService = levelEvaluationService;
        this.accessService = accessService;
        this.projectLevelAuditMapper = projectLevelAuditMapper;
    }

    @Transactional
    public ProjectEvaluatePublicKeyResponse generatePublicKey() {
        AsymmetricKey ak = cryptoService.generateAndPersistKeyPair(
                CryptoAlgorithm.RSA_2048_OAEP, KEY_TYPE, CREATED_BY);

        asymmetricKeyMapper.update(null, new LambdaUpdateWrapper<AsymmetricKey>()
                .eq(AsymmetricKey::getId, ak.getId())
                .set(AsymmetricKey::getKeyStatus, STATUS_ACTIVE)
                .set(AsymmetricKey::getActivatedAt, LocalDateTime.now())
                .set(AsymmetricKey::getUpdatedAt, LocalDateTime.now()));

        String publicKeyWithAlgo = ak.getAlgorithm() + "\n" + ak.getPublicKey();

        return ProjectEvaluatePublicKeyResponse.builder()
                .keyId(ak.getKeyId())
                .publicKey(publicKeyWithAlgo)
                .build();
    }

    @Transactional
    public ProjectEvaluateResponse evaluate(ProjectEvaluateRequest request, String authorization) {
        if (request == null || !StringUtils.hasText(request.getKeyId())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getDescription())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getEncryptedContentDetail())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        // 1. 解密 contentDetail
        String contentDetail;
        try {
            contentDetail = cryptoService.decryptHybridRsaOaep(
                    request.getEncryptedContentDetail(), request.getKeyId());
        } catch (CryptoException e) {
            log.warn("Decrypt failed for keyId={}: {}", request.getKeyId(), e.getMessage());
            throw new BusinessException(400, "解密失败，请重新获取公钥再试");
        }

        // 2. 解析当前用户
        String userUid = accessService.requireCurrentUserUid(authorization);

        log.info("Evaluating project: keyId={}, userUid={}, descLength={}, contentLength={}",
                request.getKeyId(), userUid,
                request.getDescription().length(), contentDetail.length());

        // 3. 调用 AI 等级评估模型（传入已解密 contentDetail 供模型评估，原始密文稍后覆盖审计字段）
        ProjectEvaluateResponse response;
        try {
            LevelEvaluationService.EvalResult result = levelEvaluationService.evaluate(
                    request.getDescription(), contentDetail,
                    request.getKeyId(), userUid);

            response = result.getUserResponse();
            ProjectLevelAudit audit = result.getAudit();

            // 4. 审计字段安全修复：contentDetailCiphertext 必须存原始密文，绝不能存明文
            audit.setContentDetailCiphertext(request.getEncryptedContentDetail());

            // 5. 落审计记录
            audit.setEvaluationUid(UUID.randomUUID().toString());
            projectLevelAuditMapper.insert(audit);

            log.info("Evaluation complete: level={}, evaluationUid={}",
                    response.getLevel(), audit.getEvaluationUid());

        } catch (Exception e) {
            log.error("AI evaluation failed, fallback to default level C", e);
            return ProjectEvaluateResponse.builder()
                    .level("?")
                    .explanation("AI 评估服务暂时不可用，无法返回评估结果。请稍后重试。")
                    .suggestions(null)
                    .build();
        }

        return response;
    }
}
