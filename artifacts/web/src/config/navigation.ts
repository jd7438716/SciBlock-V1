import type { LucideIcon } from "lucide-react";
import { Home, Mail, Users, FileText, ClipboardList } from "lucide-react";
import type { ResourceType } from "@/types/permissions";

export interface NavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
  /** 
   * 所需权限资源（使用权限系统）
   * @deprecated 推荐使用 permission 字段替代 roles
   */
  roles?: string[];
  /** 权限检查配置 */
  permission?: {
    resource: ResourceType;
    action?: 'view' | 'manage';
  };
}

export interface NavGroupAction {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
  action?: NavGroupAction;
}

// 顶部导航（所有已登录用户可见）
export const TOP_NAV: NavItem[] = [
  { label: "主页", href: "/home", Icon: Home },
  { label: "消息", href: "/home/messages", Icon: Mail },
];

// 分组导航
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "团队",
    items: [
      { label: "成员管理", href: "/home/members", Icon: Users },
      { 
        label: "周报管理", 
        href: "/home/reports", 
        Icon: ClipboardList,
        // 使用新的权限系统 - 仅导师可见
        permission: { resource: 'nav.team_reports', action: 'view' },
      },
    ],
  },
  {
    title: "个人",
    items: [],
    action: { label: "新建 SciNote", href: "/personal/new-experiment" },
  },
];

// 个人静态导航
export const PERSONAL_STATIC_NAV: NavItem[] = [
  { label: "我的周报", href: "/personal/my-reports", Icon: FileText },
];
