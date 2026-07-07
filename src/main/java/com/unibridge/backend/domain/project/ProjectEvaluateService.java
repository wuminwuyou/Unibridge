package com.unibridge.backend.domain.project;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.domain.project.dto.ProjectEvaluatePublicKeyResponse;
import com.unibridge.backend.domain.project.dto.ProjectEvaluateRequest;
import com.unibridge.backend.domain.project.dto.ProjectEvaluateResponse;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.crypto.CryptoAlgorithm;
import com.unibridge.backend.infrastructure.crypto.CryptoException;
import com.unibridge.backend.infrastructure.crypto.CryptoService;
import com.unibridge.backend.infrastructure.entities.infra.AsymmetricKey;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.AsymmetricKeyMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
public class ProjectEvaluateService {

    private static final Logger log = LoggerFactory.getLogger(ProjectEvaluateService.class);

    private static final String KEY_TYPE = "PROJECT_DESCRIPTION";
    private static final String CREATED_BY = "PROJECT_EVAL_API";
    private static final String STATUS_ACTIVE = "ACTIVE";

    private final CryptoService cryptoService;
    private final AsymmetricKeyMapper asymmetricKeyMapper;

    public ProjectEvaluateService(CryptoService cryptoService,
                                  AsymmetricKeyMapper asymmetricKeyMapper) {
        this.cryptoService = cryptoService;
        this.asymmetricKeyMapper = asymmetricKeyMapper;
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

    public ProjectEvaluateResponse evaluate(ProjectEvaluateRequest request) {
        if (request == null || !StringUtils.hasText(request.getKeyId())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getDescription())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getEncryptedContentDetail())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        String contentDetail;
        try {
            contentDetail = cryptoService.decryptRsaOaep(
                    request.getEncryptedContentDetail(), request.getKeyId());
        } catch (CryptoException e) {
            log.warn("Decrypt failed for keyId={}: {}", request.getKeyId(), e.getMessage());
            throw new BusinessException(400, "解密失败，请重新获取公钥再试");
        }

        String combinedContent = request.getDescription() + "\n" + contentDetail;
        log.info("Project evaluation request: contentLength={}", combinedContent.length());

        // TODO: 接入项目难度评估模型，根据 combinedContent 返回 level / explanation / suggestions
        return ProjectEvaluateResponse.builder()
                .level("C")
                .explanation("评估功能尚未接入，当前返回默认等级 C。")
                .suggestions(null)
                .build();
    }
}
