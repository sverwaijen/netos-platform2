import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS, ROLE_HIERARCHY, type UserRole, type Permission } from "@shared/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Users, Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ROLE_COLORS: Record<UserRole, string> = {
  administrator: "bg-red-500/10 text-red-500 border-red-500/20",
  ceo: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  cfo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  host: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  company_owner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  teamadmin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  member: "bg-green-500/10 text-green-500 border-green-500/20",
  facility: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  cleaner: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  guest: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function UserRolesPage() {
  const { can, isAdmin, role: currentRole } = usePermissions();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<{ id: number; name: string | null; role: string } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("member");

  const usersQuery = trpc.roles.listUsers.useQuery(undefined, {
    enabled: can("roles.view"),
  });

  const updateRoleMutation = trpc.roles.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      usersQuery.refetch();
      setEditUser(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const filteredUsers = (usersQuery.data ?? []).filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const handleEditRole = (user: { id: number; name: string | null; role: string }) => {
    setEditUser(user);
    setNewRole((user.role as UserRole) || "member");
  };

  const handleSaveRole = () => {
    if (!editUser) return;
    updateRoleMutation.mutate({ userId: editUser.id, role: newRole as any });
  };

  // Group permissions by domain for the matrix view
  const permissionDomains = Array.from(
    new Set(
      (Object.keys(ROLE_PERMISSIONS.administrator) as unknown as Permission[])
        .map((p: Permission) => (typeof p === "string" ? p.split(".")[0] : ""))
    )
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          User Roles & Permissions
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage user roles and view the permission matrix for each role.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Shield className="h-4 w-4" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <Badge key={r} variant="outline" className={`text-xs ${ROLE_COLORS[r]}`}>
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Active</TableHead>
                    {can("roles.manage") && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {user.name?.charAt(0).toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[(user.role as UserRole) || "guest"]}`}>
                          {ROLE_LABELS[(user.role as UserRole) || "guest"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastSignedIn
                          ? new Date(user.lastSignedIn).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      {can("roles.manage") && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(user as any)}
                          >
                            Edit Role
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {usersQuery.isLoading ? "Loading users..." : "No users found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Permission Matrix Tab ─── */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Overview of which permissions each role has. Roles are ordered by hierarchy level.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 min-w-[160px]">Permission</TableHead>
                    {ROLES.map((r) => (
                      <TableHead key={r} className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className={`text-xs ${ROLE_COLORS[r]}`}>
                            {ROLE_LABELS[r]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            Level {ROLE_HIERARCHY[r]}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionDomains.map((domain: any) => {
                    const domainPerms = (ROLE_PERMISSIONS.administrator as readonly Permission[]).filter(
                      (p) => p.startsWith(domain + ".")
                    );
                    return domainPerms.map((perm, i) => (
                      <TableRow key={perm}>
                        <TableCell className="sticky left-0 bg-card z-10 font-mono text-xs">
                          {i === 0 && (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                              {domain}
                            </span>
                          )}
                          {perm}
                        </TableCell>
                        {ROLES.map((r) => (
                          <TableCell key={r} className="text-center">
                            {ROLE_PERMISSIONS[r].includes(perm) ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Edit Role Dialog ─── */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{editUser?.name || "this user"}</strong>.
              This will immediately change their access permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[r]}`}>
                        {ROLE_LABELS[r]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Level {ROLE_HIERARCHY[r]} — {ROLE_PERMISSIONS[r].length} permissions
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
