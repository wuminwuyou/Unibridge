import request from '../utils/request';

// 管理员登录接口
export const loginApi = (data: any) => {
    return request({
        url: '/admin/login',
        method: 'post',
        data,
    });
};

// 获取管理员个人信息
export const getInfoApi = () => {
    return request({
        url: '/admin/info',
        method: 'get',
    });
};