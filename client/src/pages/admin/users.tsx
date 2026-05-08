import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Users, UserPlus, Shield, Key, Trash2, Edit, Loader2, 
  Crown, Bot, UserCog, Lock, Mail, CheckCircle2, Eye, EyeOff,
  Sparkles, Zap, Settings2
} from "lucide-react";

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  permissions?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
}

const MODULES = [
  { id: "dashboard", label: "Dashboard", description: "View analytics and overview" },
  { id: "homepage", label: "Home Page", description: "Edit homepage content" },
  { id: "articles", label: "Articles & Media", description: "Manage blog posts and media" },
  { id: "team", label: "Team Members", description: "Manage team profiles" },
  { id: "pricing", label: "Pricing Plans", description: "Configure pricing packages" },
  { id: "communications", label: "Communications", description: "Handle bookings and inquiries" },
  { id: "social", label: "Social Media", description: "Manage social integrations" },
  { id: "email", label: "Email Settings", description: "Configure email services" },
  { id: "popup", label: "Popup Forms", description: "Create marketing popups" },
  { id: "settings", label: "Settings", description: "System configuration" },
  { id: "users", label: "User Management", description: "Manage admin users" },
];

const ROLES = [
  { 
    id: "vyom_admin", 
    label: "Vyom Admin", 
    description: "Super admin with full access",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    badge: "bg-gradient-to-r from-amber-500 to-orange-500"
  },
  { 
    id: "admin", 
    label: "Admin", 
    description: "Standard administrator",
    icon: UserCog,
    color: "from-purple-500 to-blue-500",
    badge: "bg-gradient-to-r from-purple-500 to-blue-500"
  },
  { 
    id: "ai_agent", 
    label: "AI Agent", 
    description: "Automated AI assistant",
    icon: Bot,
    color: "from-cyan-500 to-teal-500",
    badge: "bg-gradient-to-r from-cyan-500 to-teal-500"
  },
];

export function UsersPage() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    permissions: [] as string[],
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/users", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/users/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update user", variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/users/${id}/password`, { password }, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Password updated successfully" });
      setIsPasswordOpen(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update password", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/users/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      permissions: [],
    });
  };

  const handleAddUser = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      permissions: JSON.stringify(formData.permissions),
    });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: {
        email: formData.email,
        role: formData.role,
        permissions: JSON.stringify(formData.permissions),
      },
    });
  };

  const handleChangePassword = () => {
    if (!selectedUser) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    updatePasswordMutation.mutate({
      id: selectedUser.id,
      password: passwordData.newPassword,
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      password: "",
      confirmPassword: "",
      role: user.role || "admin",
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
    });
    setIsEditOpen(true);
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setIsPasswordOpen(true);
  };

  const togglePermission = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleId)
        ? prev.permissions.filter(p => p !== moduleId)
        : [...prev.permissions, moduleId]
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: MODULES.map(m => m.id)
    }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find(r => r.id === role) || ROLES[1];
    const Icon = roleConfig.icon;
    return (
      <Badge className={`${roleConfig.badge} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {roleConfig.label}
      </Badge>
    );
  };

  const stats = {
    total: users.length,
    vyomAdmins: users.filter(u => u.role === "vyom_admin").length,
    admins: users.filter(u => u.role === "admin").length,
    aiAgents: users.filter(u => u.role === "ai_agent").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            User Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage admin users and their access permissions
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Total Users</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-100">Vyom Admins</p>
                <p className="text-3xl font-bold">{stats.vyomAdmins}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
                <Crown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-purple-500 to-blue-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Admins</p>
                <p className="text-3xl font-bold">{stats.admins}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
                <UserCog className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-cyan-500 to-teal-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-100">AI Agents</p>
                <p className="text-3xl font-bold">{stats.aiAgents}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
                <Bot className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No users found. Add your first user!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      user.role === "vyom_admin" 
                        ? "bg-gradient-to-br from-amber-500 to-orange-500" 
                        : user.role === "ai_agent"
                        ? "bg-gradient-to-br from-cyan-500 to-teal-500"
                        : "bg-gradient-to-br from-purple-500 to-blue-500"
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        {getRoleBadge(user.role)}
                        {user.twoFactorEnabled && (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <Shield className="w-3 h-3 mr-1" />
                            2FA
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email || "No email set"}</p>
                      {user.permissions && (
                        <div className="flex items-center gap-1 mt-1">
                          <Settings2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {JSON.parse(user.permissions).length} modules
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openPasswordDialog(user)}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    >
                      <Key className="w-4 h-4 mr-1" />
                      Password
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this user?")) {
                          deleteUserMutation.mutate(user.id);
                        }
                      }}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new admin user with specific role and permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? `border-transparent bg-gradient-to-br ${role.color} text-white` 
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-white" : "text-gray-600"}`} />
                      <p className={`font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>{role.label}</p>
                      <p className={`text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}>{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Module Permissions</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllPermissions}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={clearAllPermissions}>Clear All</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map((module) => (
                  <label
                    key={module.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.permissions.includes(module.id)
                        ? "border-purple-300 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Checkbox
                      checked={formData.permissions.includes(module.id)}
                      onCheckedChange={() => togglePermission(module.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{module.label}</p>
                      <p className="text-xs text-gray-500">{module.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddUser}
              disabled={createUserMutation.isPending || !formData.username || !formData.password}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Edit className="w-5 h-5 text-white" />
              </div>
              Edit User: {selectedUser?.username}
            </DialogTitle>
            <DialogDescription>
              Update user role and permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? `border-transparent bg-gradient-to-br ${role.color} text-white` 
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-white" : "text-gray-600"}`} />
                      <p className={`font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>{role.label}</p>
                      <p className={`text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}>{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Module Permissions</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllPermissions}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={clearAllPermissions}>Clear All</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map((module) => (
                  <label
                    key={module.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.permissions.includes(module.id)
                        ? "border-purple-300 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Checkbox
                      checked={formData.permissions.includes(module.id)}
                      onCheckedChange={() => togglePermission(module.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{module.label}</p>
                      <p className="text-xs text-gray-500">{module.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditUser}
              disabled={updateUserMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {updateUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Key className="w-5 h-5 text-white" />
              </div>
              Change Password: {selectedUser?.username}
            </DialogTitle>
            <DialogDescription>
              Set a new password for this user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleChangePassword}
              disabled={updatePasswordMutation.isPending || !passwordData.newPassword}
              className="bg-gradient-to-r from-orange-600 to-red-600"
            >
              {updatePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
