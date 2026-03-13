import type { LucideIcon } from "lucide-react";
import { Home, Mail, Users, FileText } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const TOP_NAV: NavItem[] = [
  { label: "主页", href: "/home", Icon: Home },
  { label: "消息", href: "/home/messages", Icon: Mail },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "团队",
    items: [
      { label: "Members", href: "/home/members", Icon: Users },
      { label: "Reports", href: "/home/reports", Icon: FileText },
    ],
  },
  // Personal section: empty → hidden automatically.
  // Add items here when personal features are implemented.
  {
    title: "个人",
    items: [],
  },
];
