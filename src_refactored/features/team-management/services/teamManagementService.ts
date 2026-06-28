// 01）团队管理 Feature — Services（调用 entities/team/api 和 entities/organization/api）
import { updateTeamProfileMembers } from '../../../entities/team/api/teamProfileApi'
import { createEntityTeam, updateEntityTeam, deleteEntityTeam, addEntityProfileMember, removeEntityProfileMember } from '../../../entities/organization/api/entityProfileApi'

// 02）统一导出团队/实验室 CRUD 操作
export { updateTeamProfileMembers, createEntityTeam, updateEntityTeam, deleteEntityTeam, addEntityProfileMember, removeEntityProfileMember }
