import {
  AiBrain01Icon,
  Calendar01Icon,
  Cards01Icon,
  CoinsDollarIcon,
  Home01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@saascription/ui";
import { Link, useRouterState } from "@tanstack/react-router";

import { SidebarUserMenu } from "./sidebar-user-menu";

type NavItem = {
  title: string;
  /** Use registered paths once routes exist; `string` avoids drift before files are added. */
  href: string;
  icon: typeof Home01Icon;
};

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: Home01Icon },
  { title: "Spends & Savings", href: "/spends", icon: CoinsDollarIcon },
  { title: "Subscriptions", href: "/subs", icon: Cards01Icon },
  { title: "Calendar", href: "/cal", icon: Calendar01Icon },
  { title: "AI Optimization", href: "/ai", icon: AiBrain01Icon },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar className="z-20 min-w-64 w-64 border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sidebar-foreground">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
            aria-hidden
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            SaaScription
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive =
                  (item.href === "/" &&
                    item.title === "Dashboard" &&
                    pathname === "/") ||
                  (item.href !== "/" && pathname === item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className="w-full"
                      isActive={isActive}
                      render={<Link to={item.href} />}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        className="size-4 shrink-0"
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
