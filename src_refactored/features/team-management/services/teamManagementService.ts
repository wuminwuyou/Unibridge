// 01）团队/实验室管理 Service — 透传 entities/team 与 entities/organization 的写入 API
import {
  updateTeamProfileMembers,
  createStudentTeam,
} from '@entities/team/api/teamProfileApi'
import {
  createEntityTeam, updateEntityTeam, deleteEntityTeam,
  addEntityProfileMember, removeEntityProfileMember,
  searchEntityProfileUsers,
} from '@entities/organization/api/entityProfileApi'

// 02）团队成员 CRUD（统一对外出口）
export { updateTeamProfileMembers, createStudentTeam }

// 03）机构实验室与人员 CRUD（统一对外出口）
export {
  createEntityTeam, updateEntityTeam, deleteEntityTeam,
  addEntityProfileMember, removeEntityProfileMember,
  searchEntityProfileUsers,
}
