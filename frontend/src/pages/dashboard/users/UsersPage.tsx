import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Pencil, Trash2, Loader2, Users, ArrowLeft, ClipboardList } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { RoleForm } from "./components/RoleForm";
import { StaffForm } from "./components/StaffForm";
import { Link } from "react-router-dom";

export function UsersPage() {
    const [activeTab, setActiveTab] = useState("staff");
    const [roles, setRoles] = useState<any[]>([]);
    const [staffMembers, setStaffMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [editingStaff, setEditingStaff] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rolesRes, staffRes] = await Promise.all([
                fetchWithAuth('/api/jamath/staff-roles/'),
                fetchWithAuth('/api/jamath/staff-members/')
            ]);

            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (staffRes.ok) setStaffMembers(await staffRes.json());

        } catch (err) {
            console.error("Failed to fetch RBAC data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteRole = async (id: number) => {
        if (!confirm("Are you sure? This might affect users assigned to this role.")) return;
        try {
            await fetchWithAuth(`/api/jamath/staff-roles/${id}/`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            alert("Failed to delete role");
        }
    };

    const handleDeleteStaff = async (id: number) => {
        if (!confirm("Remove this staff member? Their user account will be deleted and they will no longer be able to log in.")) return;
        try {
            await fetchWithAuth(`/api/jamath/staff-members/${id}/`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            alert("Failed to remove staff");
        }
    };

    const openEditRole = (role: any) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const openEditStaff = (staff: any) => {
        setEditingStaff(staff);
        setIsStaffModalOpen(true);
    };

    const handleSuccess = () => {
        setIsRoleModalOpen(false);
        setIsStaffModalOpen(false);
        setEditingRole(null);
        setEditingStaff(null);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Access Control (RBAC)</h2>
                            <p className="text-muted-foreground">Manage staff roles, permissions, and audit logs.</p>
                        </div>
                        <Link to="/dashboard/users/activity">
                            <Button variant="outline">
                                <ClipboardList className="mr-2 h-4 w-4" /> Activity Logs
                            </Button>
                        </Link>
                    </div>
                </div>

                {activeTab === 'staff' ? (
                    <Button onClick={() => { setEditingStaff(null); setIsStaffModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Assign Staff
                    </Button>
                ) : (
                    <Button onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Create Role
                    </Button>
                )}
            </div>

            <Tabs defaultValue="staff" onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="staff" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Staff Members
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Roles & Permissions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="staff">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Directory</CardTitle>
                            <CardDescription>Users with assigned roles and responsibilities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
                            ) : staffMembers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No staff members assigned yet.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Designation</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staffMembers.map((staff) => (
                                            <TableRow key={staff.id}>
                                                <TableCell className="font-medium">
                                                    {staff.user_email}
                                                </TableCell>
                                                <TableCell>{staff.designation}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{staff.role_name}</Badge>
                                                </TableCell>
                                                <TableCell>{staff.joined_at}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditStaff(staff)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteStaff(staff.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Roles</CardTitle>
                            <CardDescription>Define what each role can access and manage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
                            ) : roles.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No roles defined yet.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Permissions</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">{role.name}</TableCell>
                                                <TableCell>{role.description}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(role.permissions).map(([mod, level]) => (
                                                            <Badge key={mod} variant="secondary" className="text-xs">
                                                                {mod}: {String(level)}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditRole(role)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteRole(role.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Role Modal */}
            <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
                        <DialogDescription>
                            Configure module-level permissions for this role.
                        </DialogDescription>
                    </DialogHeader>
                    <RoleForm
                        role={editingRole}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsRoleModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Staff Modal */}
            <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingStaff ? "Edit Staff Assignment" : "Assign Role to User"}</DialogTitle>
                        <DialogDescription>
                            Assign a role to a registered user.
                        </DialogDescription>
                    </DialogHeader>
                    <StaffForm
                        staff={editingStaff}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsStaffModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
