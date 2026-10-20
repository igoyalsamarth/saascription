import {
  Add01Icon,
  Home01Icon,
  SparklesIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@saascription/ui";
import { Link, useRouterState } from "@tanstack/react-router";

import { SidebarUser } from "./sidebar-user";

const mainNav = [
  { title: "Dashboard", to: "/", icon: Home01Icon },
  { title: "Listings", to: "/listings", icon: Store01Icon },
  { title: "Add SaaS", to: "/add", icon: Add01Icon },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar className="z-20 w-64 min-w-64 border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sidebar-foreground">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
            aria-hidden
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-4" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-semibold tracking-tight">
              Saascription
            </span>
            <span className="block text-[0.625rem] text-muted-foreground">
              Seller
            </span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    className="w-full"
                    isActive={
                      item.to === "/listings"
                        ? pathname === "/listings" ||
                          pathname.startsWith("/listings/")
                        : pathname === item.to
                    }
                    render={<Link to={item.to} />}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      className="size-4 shrink-0"
                    />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
