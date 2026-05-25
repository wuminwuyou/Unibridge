SELECT COUNT(*) AS total FROM note WHERE status='PUBLISHED';
SELECT CASE WHEN content_type_code LIKE 'TX%' THEN 'IMAGE_TEXT' ELSE 'VIDEO' END AS note_type, COUNT(*) AS cnt
FROM note WHERE status='PUBLISHED' GROUP BY 1;
SELECT id, content_type_code, title, like_count, published_at FROM note WHERE status='PUBLISHED' ORDER BY id;
