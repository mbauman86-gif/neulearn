import { useLocation, Link } from "wouter";
import { Home, BookOpen, Users, Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import NeuLearnLogo from "./NeuLearnLogo";
import { useAuth } from "@/lib/useAuth";

interface ParentLayoutProps {
  children: React.ReactNode;
}

const mainNavItems = [
  {
    title: "Home",
    url: "/parent/dashboard",
    icon: Home,
  },
  {
    title: "Lessons",
    url: "/parent/lessons",
    icon: BookOpen,
  },
  {
    title: "Community",
    url: "/parent/community",
    icon: Users,
  },
];

const settingsSubItems = [
  {
    title: "Billing",
    url: "/parent/settings/billing",
  },
  {
    title: "Parent Profile",
    url: "/parent/settings/profile",
  },
];

export default function ParentLayout({ children }: ParentLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/parent/login");
  };

  const isSettingsActive = location.startsWith("/parent/settings");

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <NeuLearnLogo size="sm" />
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={`nav-${item.title.toLowerCase()}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  
                  <Collapsible defaultOpen={isSettingsActive} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isSettingsActive}
                          data-testid="nav-settings"
                        >
                          <Settings className="w-5 h-5" />
                          <span>Settings</span>
                          <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {settingsSubItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location === subItem.url}
                                data-testid={`nav-settings-${subItem.title.toLowerCase().replace(' ', '-')}`}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center h-14 px-4 border-b bg-white shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto bg-[var(--neulearn-surface-light)]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
