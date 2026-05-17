import { SHA256 } from 'crypto-js';

/**
 * 将明文密码转换为 SHA256 哈希值
 * @param password 用户输入的明文密码
 * @returns 64位的十六进制字符串
 */
export const hashPassword = (password: string): string => {
    if (!password) return '';

    // 使用 SHA256 算法进行哈希
    // .toString() 默认会转换为 Hex (十六进制) 字符串
    return SHA256(password).toString();
};

/**
 * (进阶建议) 带盐哈希 (Salted Hash)
 * 如果你希望安全性更高，可以加上一个固定的盐值
 * 注意：前端加盐只是第一层防护，真正的加盐操作应该在后端存库时完成
 */
export const hashPasswordWithSalt = (password: string, salt: string = 'UniBridge_Secure_2026'): string => {
    return SHA256(password + salt).toString();
};