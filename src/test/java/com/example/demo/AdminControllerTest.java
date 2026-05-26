package com.example.demo;

import com.unibridge.backend.UnibridgeBackendApplication;
import com.unibridge.backend.domain.admin.dto.AdminLoginRequest;
import com.unibridge.backend.domain.admin.entity.SystemAdmin;
import com.unibridge.backend.domain.admin.mapper.SystemAdminMapper;
import com.unibridge.backend.domain.admin.dto.EntityCreateRequest;
import com.unibridge.backend.domain.admin.dto.UserRegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = UnibridgeBackendApplication.class)
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private SystemAdminMapper systemAdminMapper;

    private static String adminToken;
    private static Long createdEntityId;
    private static Long createdUserId;
    private static String testUserPhone;
    
    @Test
    @Order(0)
    void testDatabaseConnection() {
        System.out.println("测试数据库连接...");
        SystemAdmin admin = systemAdminMapper.selectById("admin_master");
        System.out.println("查询结果: " + admin);
        if (admin == null) {
            System.out.println("警告: admin_master账号不存在!");
        } else {
            System.out.println("admin_master账号存在: " + admin.getId());
        }
    }

    @Test
    @Order(1)
    void testAdminLogin() throws Exception {
        System.out.println("开始测试管理员登录...");
        
        AdminLoginRequest request = new AdminLoginRequest();
        request.setAdminId("admin_master");
        request.setPasswordHash("8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92");
        
        System.out.println("登录请求: adminId=" + request.getAdminId());

        MvcResult result = mockMvc.perform(post("/api/v1/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        adminToken = objectMapper.readTree(response).get("data").get("token").asText();
        System.out.println("管理员登录成功，Token: " + adminToken);
    }

    @Test
    @Order(2)
    void testGetEntitiesList() throws Exception {
        mockMvc.perform(get("/api/v1/admin/entities/list")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").exists());

        System.out.println("查询主体列表成功");
    }

    @Test
    @Order(3)
    void testCreateEntity() throws Exception {
        EntityCreateRequest request = new EntityCreateRequest();
        request.setName("测试大学");
        request.setType("UNIVERSITY");
        request.setIntro("这是一个测试大学");

        MvcResult result = mockMvc.perform(post("/api/v1/admin/entities")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("创建成功"))
                .andExpect(jsonPath("$.data.id").exists())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        createdEntityId = objectMapper.readTree(response).get("data").get("id").asLong();
        System.out.println("创建主体成功，ID: " + createdEntityId);
    }

    @Test
    @Order(4)
    void testGetEntityDetail() throws Exception {
        mockMvc.perform(get("/api/v1/admin/entities/" + createdEntityId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(createdEntityId))
                .andExpect(jsonPath("$.data.name").value("测试大学"));

        System.out.println("查询主体详情成功");
    }

    @Test
    @Order(5)
    void testUpdateEntity() throws Exception {
        EntityCreateRequest request = new EntityCreateRequest();
        request.setName("测试大学更新");
        request.setType("UNIVERSITY");
        request.setIntro("这是一个更新后的测试大学");

        mockMvc.perform(put("/api/v1/admin/entities/" + createdEntityId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("更新成功"))
                .andExpect(jsonPath("$.data.name").value("测试大学更新"));

        System.out.println("更新主体成功");
    }

    @Test
    @Order(6)
    void testGetUsersList() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/list")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").exists());

        System.out.println("查询用户列表成功");
    }

    @Test
    @Order(7)
    void testCreateUser() throws Exception {
        testUserPhone = "139" + String.format("%08d", (int)(Math.random() * 100000000));
        
        UserRegisterRequest request = new UserRegisterRequest();
        request.setPhone(testUserPhone);
        request.setPasswordHash("240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9");

        MvcResult result = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("创建成功"))
                .andExpect(jsonPath("$.data.id").exists())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        createdUserId = objectMapper.readTree(response).get("data").get("id").asLong();
        System.out.println("创建用户成功，ID: " + createdUserId);
    }

    @Test
    @Order(8)
    void testGetUserDetail() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/" + createdUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(createdUserId));

        System.out.println("查询用户详情成功");
    }

    @Test
    @Order(9)
    void testUpdateUser() throws Exception {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setPasswordHash("new_password_hash");

        mockMvc.perform(put("/api/v1/admin/users/" + createdUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("更新成功"));

        System.out.println("更新用户成功");
    }

    @Test
    @Order(10)
    void testDeleteEntity() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/entities/" + createdEntityId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("删除成功"));

        System.out.println("删除主体成功");
    }

    @Test
    @Order(11)
    void testDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/" + createdUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("删除成功"));

        System.out.println("删除用户成功");
    }

    @Test
    @Order(12)
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/list")
                        .param("page", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));

        System.out.println("未授权访问测试成功 - 返回401");
    }

    @Test
    @Order(13)
    void testInvalidToken() throws Exception {
        mockMvc.perform(get("/api/v1/admin/entities/list")
                        .header("Authorization", "Bearer invalid_token")
                        .param("page", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));

        System.out.println("无效token测试成功 - 返回401");
    }

    @Test
    @Order(14)
    void testGetNonExistentEntity() throws Exception {
        mockMvc.perform(get("/api/v1/admin/entities/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("主体不存在"));

        System.out.println("查询不存在主体测试成功 - 返回404");
    }

    @Test
    @Order(15)
    void testGetNonExistentUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("用户不存在"));

        System.out.println("查询不存在用户测试成功 - 返回404");
    }
}