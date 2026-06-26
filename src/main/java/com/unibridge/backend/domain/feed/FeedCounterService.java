package com.unibridge.backend.domain.feed;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.infrastructure.entities.note.NoteCounter;
import com.unibridge.backend.infrastructure.entities.project.ProjectCounter;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteCounterMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectCounterMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Feed 计数器统一读写服务。
 *
 * <h2>设计原则</h2>
 * <ul>
 *   <li>写入 → Redis 内存计数器（瞬时、高频）</li>
 *   <li>读取 → Redis 优先；缺失时回源 MySQL 并回填 Redis</li>
 *   <li>MySQL → 定期快照落库（TODO: 定时任务批量同步）</li>
 * </ul>
 *
 * <h2>Redis Key 规范</h2>
 * <ul>
 *   <li>笔记：{@code note:cnt:{contentTypeCode}:{field}}</li>
 *   <li>项目：{@code proj:cnt:{projectUid}:{field}}</li>
 *   <li>字段：{@code view | like | collect | comment}</li>
 * </ul>
 */
@Service
public class FeedCounterService {

    private static final Logger log = LoggerFactory.getLogger(FeedCounterService.class);

    // ── Redis key 前缀 ──
    private static final String NOTE_CNT_KEY = "note:cnt:";
    private static final String PROJ_CNT_KEY = "proj:cnt:";
    private static final String PROJ_CHAT_KEY = "proj:chat:";

    // ── 字段名 ──
    private static final String FIELD_VIEW = "view";
    private static final String FIELD_LIKE = "like";
    private static final String FIELD_COLLECT = "collect";
    private static final String FIELD_COMMENT = "comment";

    // ── TTL ──
    private static final long CNT_TTL_HOURS = 12;

    private final StringRedisTemplate stringRedisTemplate;
    private final NoteCounterMapper noteCounterMapper;
    private final ProjectCounterMapper projectCounterMapper;

    public FeedCounterService(StringRedisTemplate stringRedisTemplate,
                              NoteCounterMapper noteCounterMapper,
                              ProjectCounterMapper projectCounterMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.noteCounterMapper = noteCounterMapper;
        this.projectCounterMapper = projectCounterMapper;
    }

    // ============================================================================
    //  笔记计数 — 写入
    // ============================================================================

    /** 笔记浏览量 +1 */
    public void incrNoteView(String contentTypeCode) {
        incrNoteField(contentTypeCode, FIELD_VIEW);
    }

    /** 笔记点赞数 delta（+1 或 -1） */
    public void incrNoteLike(String contentTypeCode, int delta) {
        incrNoteFieldBy(contentTypeCode, FIELD_LIKE, delta);
    }

    /** 笔记收藏数 delta（+1 或 -1） */
    public void incrNoteCollect(String contentTypeCode, int delta) {
        incrNoteFieldBy(contentTypeCode, FIELD_COLLECT, delta);
    }

    /** 笔记评论数 delta */
    public void incrNoteComment(String contentTypeCode, int delta) {
        incrNoteFieldBy(contentTypeCode, FIELD_COMMENT, delta);
    }

    // ============================================================================
    //  笔记计数 — 批量读取（供 Feed 计算）
    // ============================================================================

    /**
     * 批量读取笔记计数，优先 Redis，缺失时回源 MySQL。
     * @return Map<contentTypeCode, NoteCounter>
     */
    public Map<String, NoteCounter> loadNoteCounters(Collection<String> contentTypeCodes) {
        if (contentTypeCodes.isEmpty()) return Map.of();

        Map<String, NoteCounter> result = new HashMap<>();
        Map<String, NoteCounter> missed = new HashMap<>();

        for (String code : contentTypeCodes) {
            NoteCounter cnt = readNoteCounterFromRedis(code);
            if (cnt != null) {
                result.put(code, cnt);
            } else {
                missed.put(code, null);
            }
        }

        if (!missed.isEmpty()) {
            Map<String, NoteCounter> dbMap = loadNoteCountersFromDb(missed.keySet());
            for (Map.Entry<String, NoteCounter> e : dbMap.entrySet()) {
                NoteCounter cnt = e.getValue();
                result.put(e.getKey(), cnt);
                writeNoteCounterToRedis(e.getKey(), cnt);
            }
            for (String code : missed.keySet()) {
                if (!result.containsKey(code)) {
                    NoteCounter zero = new NoteCounter();
                    zero.setContentTypeCode(code);
                    zero.setViewCount(0);
                    zero.setLikeCount(0);
                    zero.setCollectCount(0);
                    zero.setCommentCount(0);
                    result.put(code, zero);
                    writeNoteCounterToRedis(code, zero);
                }
            }
        }

        return result;
    }

    /** 回源 MySQL 批量读取笔记计数 */
    private Map<String, NoteCounter> loadNoteCountersFromDb(Collection<String> codes) {
        LambdaQueryWrapper<NoteCounter> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(NoteCounter::getContentTypeCode, codes);
        List<NoteCounter> list = noteCounterMapper.selectList(wrapper);
        return list.stream().collect(Collectors.toMap(NoteCounter::getContentTypeCode, c -> c, (a, b) -> a));
    }

    // ============================================================================
    //  项目计数 — 写入
    // ============================================================================

    /** 项目浏览量 +1 */
    public void incrProjectView(String projectUid) {
        incrProjectField(projectUid, FIELD_VIEW);
    }

    /** 项目收藏数 delta（+1 或 -1） */
    public void incrProjectCollect(String projectUid, int delta) {
        incrProjectFieldBy(projectUid, FIELD_COLLECT, delta);
    }

    /** 项目私聊去重用户 */
    public void addProjectChatUser(String projectUid, String userUid) {
        stringRedisTemplate.opsForHyperLogLog().add(PROJ_CHAT_KEY + projectUid, userUid);
    }

    // ============================================================================
    //  项目计数 — 读取
    // ============================================================================

    public int getProjectViewCount(String projectUid) {
        return readProjectField(projectUid, FIELD_VIEW);
    }

    public int getProjectCollectCount(String projectUid) {
        return readProjectField(projectUid, FIELD_COLLECT);
    }

    public long getProjectChatUniqueCount(String projectUid) {
        return stringRedisTemplate.opsForHyperLogLog().size(PROJ_CHAT_KEY + projectUid);
    }

    // ============================================================================
    //  底层 Redis 操作
    // ============================================================================

    // ── 笔记 ──

    private static String noteKey(String contentTypeCode, String field) {
        return NOTE_CNT_KEY + contentTypeCode + ":" + field;
    }

    private void incrNoteField(String code, String field) {
        String key = noteKey(code, field);
        stringRedisTemplate.opsForValue().increment(key, 1);
        stringRedisTemplate.expire(key, CNT_TTL_HOURS, TimeUnit.HOURS);
    }

    private void incrNoteFieldBy(String code, String field, int delta) {
        if (delta == 0) return;
        String key = noteKey(code, field);
        stringRedisTemplate.opsForValue().increment(key, delta);
        stringRedisTemplate.expire(key, CNT_TTL_HOURS, TimeUnit.HOURS);
    }

    private NoteCounter readNoteCounterFromRedis(String code) {
        String viewKey = noteKey(code, FIELD_VIEW);
        String v = stringRedisTemplate.opsForValue().get(viewKey);
        if (v == null) return null;

        NoteCounter cnt = new NoteCounter();
        cnt.setContentTypeCode(code);
        cnt.setViewCount(parseInt(stringRedisTemplate.opsForValue().get(viewKey)));
        cnt.setLikeCount(parseInt(stringRedisTemplate.opsForValue().get(noteKey(code, FIELD_LIKE))));
        cnt.setCollectCount(parseInt(stringRedisTemplate.opsForValue().get(noteKey(code, FIELD_COLLECT))));
        cnt.setCommentCount(parseInt(stringRedisTemplate.opsForValue().get(noteKey(code, FIELD_COMMENT))));
        return cnt;
    }

    private void writeNoteCounterToRedis(String code, NoteCounter cnt) {
        incrNoteFieldBy(code, FIELD_VIEW, nullSafe(cnt.getViewCount()));
        incrNoteFieldBy(code, FIELD_LIKE, nullSafe(cnt.getLikeCount()));
        incrNoteFieldBy(code, FIELD_COLLECT, nullSafe(cnt.getCollectCount()));
        incrNoteFieldBy(code, FIELD_COMMENT, nullSafe(cnt.getCommentCount()));
    }

    // ── 项目 ──

    private static String projKey(String projectUid, String field) {
        return PROJ_CNT_KEY + projectUid + ":" + field;
    }

    private void incrProjectField(String projectUid, String field) {
        String key = projKey(projectUid, field);
        stringRedisTemplate.opsForValue().increment(key, 1);
        stringRedisTemplate.expire(key, CNT_TTL_HOURS, TimeUnit.HOURS);
    }

    private void incrProjectFieldBy(String projectUid, String field, int delta) {
        if (delta == 0) return;
        String key = projKey(projectUid, field);
        stringRedisTemplate.opsForValue().increment(key, delta);
        stringRedisTemplate.expire(key, CNT_TTL_HOURS, TimeUnit.HOURS);
    }

    private int readProjectField(String projectUid, String field) {
        return parseInt(stringRedisTemplate.opsForValue().get(projKey(projectUid, field)));
    }

    // ============================================================================
    //  工具
    // ============================================================================

    private static int parseInt(String value) {
        if (value == null) return 0;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static int nullSafe(Integer value) {
        return value == null ? 0 : value;
    }
}
