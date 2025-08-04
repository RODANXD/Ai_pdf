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
  } from "@/components/ui/sidebar"
  import {
    Brain,
    Home,
    Upload,
    MessageSquare,
    FileText,
    BarChart3,
    Settings,
    Users,
    Search,
    Lightbulb,
  } from "lucide-react"
  import Link from "next/link"
  
  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Upload Papers",
      url: "/dashboard/upload",
      icon: Upload,
    },
    {
      title: "Chat with AI",
      url: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: FileText,
    },
    {
      title: "Knowledge Graph",
      url: "/dashboard/Knowledge",
      icon: Brain,
    },
    
  ]
  
  const adminItems = [

    {
      title: "Settings",
      url: "/dashboard/user",
      icon: Users,
    },
  ]
  
  export function AppSidebar() {
    return (
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Research AI</span>
          </div>
        </SidebarHeader>
  
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
  
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        <SidebarFooter className="border-t p-4">
          <div className="text-xs text-gray-500">Research AI v1.0</div>
        </SidebarFooter>
      </Sidebar>
    )
  }
  