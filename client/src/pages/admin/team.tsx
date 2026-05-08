import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Save, Loader2, Upload, Clock, CheckCircle2, Circle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type TeamMember } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { insertTeamMemberSchema } from "@shared/schema";
import { z } from "zod";

const teamFormSchema = insertTeamMemberSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

export function TeamPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamMember | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [checkedMembers, setCheckedMembers] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      role: "",
      description: "",
      imageUrl: "",
      animationEnabled: true,
      enabled: true,
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      form.setValue("imageUrl", dataUrl);
      setUploadingImage(false);
      toast({ title: "Image uploaded successfully!", description: "Image is ready to save" });
    };
    reader.readAsDataURL(file);
  };

  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleImageUpload(files[0]);
    }
  };

  const toggleMemberCheck = (id: string) => {
    const newChecked = new Set(checkedMembers);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedMembers(newChecked);
  };

  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/team", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member added" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/team/${editingTeam?.id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member updated" });
      setIsDialogOpen(false);
      setEditingTeam(null);
      form.reset();
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/team/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member deleted" });
    },
  });

  const onSubmit = async (data: TeamFormData) => {
    if (!data.imageUrl) {
      toast({ title: "Please upload a team member image", variant: "destructive" });
      return;
    }
    if (editingTeam) {
      updateTeamMutation.mutate(data);
    } else {
      createTeamMutation.mutate(data);
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTeam(null); form.reset(); }} data-testid="button-add-team">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
              <DialogDescription>
                {editingTeam ? "Update the team member details below" : "Fill in the details to add a new team member"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Team member name" {...field} data-testid="input-team-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lead Developer" {...field} data-testid="input-team-role" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio / Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the team member" {...field} data-testid="textarea-team-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Visible on Website</FormLabel>
                        <div className="text-[0.8rem] text-muted-foreground">
                          Show this team member on the public team page
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Team Member Photo</FormLabel>
                  <div
                    onDragEnter={handleDragEvents}
                    onDragLeave={handleDragEvents}
                    onDragOver={handleDragEvents}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                      dragActive ? "border-primary bg-primary/10 scale-102" : "border-muted-foreground/30 hover:border-primary/50"
                    } ${uploadingImage ? "opacity-50" : ""}`}
                    data-testid="dropzone-team-image"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                      data-testid="input-team-image"
                    />
                    <div className="space-y-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    {form.watch("imageUrl") && (
                      <div className="mt-4 animate-in fade-in">
                        <img src={form.watch("imageUrl")} alt="Preview" className="w-24 h-24 rounded-lg object-cover mx-auto" data-testid="image-preview" />
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={createTeamMutation.isPending || updateTeamMutation.isPending || uploadingImage} className="w-full" data-testid="button-save-team">
                  {createTeamMutation.isPending || updateTeamMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingTeam ? "Update" : "Add"} Member
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Team Members Checklist</h2>
        {teamMembers.length > 0 ? (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover-elevate transition-all" data-testid={`team-checklist-${member.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMemberCheck(member.id)}
                      className="flex-shrink-0 transition-all"
                      data-testid={`checkbox-team-${member.id}`}
                    >
                      {checkedMembers.has(member.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>

                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.imageUrl || ""} alt={member.name} />
                      <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{member.name}</h3>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{getRelativeTime(member.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTeam(member);
                          form.reset(member);
                          setIsDialogOpen(true);
                        }}
                        data-testid={`button-edit-team-${member.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTeamMutation.mutate(member.id)}
                        data-testid={`button-delete-team-${member.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {member.description && (
                    <p className="text-xs text-muted-foreground mt-2 pl-8">{member.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No team members yet. Add your first team member!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
