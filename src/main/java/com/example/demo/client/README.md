# Legacy Client Package (Reference Only)

此目录为迁移前的分层结构快照，**不参与 Maven 编译**（见 `pom.xml` 中 `maven-compiler-plugin` 的 `includes` 配置）。

业务代码已按领域纵向切片迁移至：

```text
src/main/java/com/unibridge/backend/
├── application/          # 跨域共享能力（如 ContentUidResolver）
├── domain/               # auth / feed / note / project / space / interaction / admin
└── infrastructure/       # entities / mappers / config / security / media
```

验证通过后，可手动删除本目录。
