
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FooterAuth from "@/components/FooterAuth";
import FloatingCircles from "@/components/FloatingCircles";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Plus,
  FolderPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import QRCodeList from "@/components/QRCodeList";
import { useAuth } from "@/hooks/use-auth";
import { createFolder } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import HeaderAvatar from "@/components/ui/header-avatar";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedView, setSelectedView] = useState("all");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const { getAvatarUrl } = useAvatar();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  // const [profileData, setProfileData] = useState<any>(null);


  // Set sidebar collapsed by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: "Success",
        description: `Folder "${newFolderName}" created successfully`,
      });
      setNewFolderName("");
      setShowFolderDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      });
    }
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    createFolderMutation.mutate(newFolderName);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  let pageTitle = "Static QR Codes";
  if (selectedView === "barcode") pageTitle = "Barcodes";
  if (selectedView === "static") pageTitle = "Static QR Codes";
  if (selectedView === "dynamic" || selectedView === "dynamic-active" || selectedView === "dynamic-paused") pageTitle = "Dynamic QR Codes";

  return (
    <div className="min-h-screen flex flex-col w-full">
      <HeaderAvatar />
      <FloatingCircles />

      <SidebarProvider>
        <div className="flex-1 flex w-full relative">
          {/* Sidebar */}
          <div className={cn(
            "border-r border-border h-screen fixed top-0 left-0 transition-all duration-200 z-20 bg-background",
            sidebarCollapsed ? 'w-16' : 'w-64',
            // On mobile, overlay the content when expanded
            isMobile && !sidebarCollapsed && "shadow-lg"
          )}>
            <DashboardSidebar 
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              setShowFolderDialog={setShowFolderDialog}
              sidebarCollapsed={sidebarCollapsed}
              toggleSidebar={toggleSidebar}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Overlay for mobile when sidebar is open */}
          {isMobile && !sidebarCollapsed && (
            <div 
              className="fixed inset-0 bg-black/20 z-10" 
              onClick={() => setSidebarCollapsed(true)}
            />
          )}

          {/* Main Content */}
          <main className={cn(
            "flex-1 transition-all duration-200",
            // On desktop, push content when sidebar is open
            !isMobile && (sidebarCollapsed ? 'ml-16' : 'ml-64'),
            // On mobile, don't push content (overlay instead)
            isMobile && 'ml-0'
          )}>

            <div className="container mx-auto px-4 pt-0 pb-12">
              <div className="max-w-7xl mx-auto space-y-8 mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="hidden text-xl md:text-2xl font-bold">
                        {pageTitle}
                      </h1>
                      <h1 className="text-x1 md:text-2xl font-bold">
                        <span className="text-primary">Static QR</span> codes
                      </h1>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base">Manage your static QR codes</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full md:w-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          CREATE
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate("/generate")}>
                          <QrCode className="mr-2 h-4 w-4" />
                          QR Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/dynamic-qr")}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Dynamic QR Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowFolderDialog(true)}>
                          <FolderPlus className="mr-2 h-4 w-4" />
                          Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4">                
                  <QRCodeList 
                    filterType={selectedView} 
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
            </div>
          </main>

          <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button 
                  className="w-full" 
                  onClick={handleCreateFolder}
                  disabled={createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarProvider>

      <FooterAuth />
    </div>
  );
};

export default Dashboard;
