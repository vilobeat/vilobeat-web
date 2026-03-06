'use client';

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, UserPlus, ShieldAlert, Plus, Check } from "lucide-react";

const PERMISSIONS = [
    { id: "MANAGE_DISTRIBUTION", label: "Approve Distribution" },
    { id: "MANAGE_FINANCE", label: "Edit Revenue & Payouts" },
    { id: "MANAGE_TASKS", label: "Handle Mastering & Lyrics" },
    { id: "MANAGE_USERS", label: "Edit Users & Suspend" },
    { id: "MANAGE_BROADCAST", label: "Send Announcements" }
];

export default function RolesManagementPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [customRoles, setCustomRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // New Role Form State
    const [showNewRole, setShowNewRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
    const [creatingRole, setCreatingRole] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/roles`);
            const data = await res.json();
            setAdmins(data.admins || []);
            setUsers(data.users || []);
            setCustomRoles(data.customRoles || []);
        } catch (error) {
            console.error("Failed to fetch roles", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole.replace(/_/g, ' ')}?`)) return;

        setUpdating(userId);
        try {
            await fetch(`/api/admin/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ASSIGN_USER", userId, newRole })
            });
            await fetchRoles();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName) return;

        setCreatingRole(true);
        try {
            await fetch(`/api/admin/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CREATE_ROLE", roleName: newRoleName, permissions: newRolePermissions })
            });
            setShowNewRole(false);
            setNewRoleName("");
            setNewRolePermissions([]);
            await fetchRoles();
        } catch (e) {
            console.error(e);
        } finally {
            setCreatingRole(false);
        }
    };

    const togglePermission = (permId: string) => {
        setNewRolePermissions(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]);
    };

    const systemRoles = ['SUPER_ADMIN', 'FINANCE_MANAGER', 'SUPPORT_STAFF'];
    const allRoles = [...systemRoles, ...customRoles.map(cr => cr.name)];

    return (
        <div className="space-y-6 font-grotesk animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-primary" /> Roles & Access Levels
                    </h1>
                    <p className="text-muted-foreground mt-1">Create custom staff roles and manage access controls.</p>
                </div>
                {!showNewRole && (
                    <button onClick={() => setShowNewRole(true)} className="bg-primary text-white px-4 py-2 font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors">
                        <Plus size={16} /> Create Custom Role
                    </button>
                )}
            </div>

            {showNewRole && (
                <div className="bg-card border border-border p-6 shadow-soft relative overflow-hidden">
                    <h3 className="text-lg font-bold mb-4 font-heading">Build A Custom Role</h3>
                    <form onSubmit={handleCreateRole} className="space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Role Title</label>
                            <input
                                type="text"
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                className="w-full max-w-md px-4 py-2 bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                                placeholder="e.g. Content Reviewer"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Assign Permissions</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {PERMISSIONS.map(perm => (
                                    <label key={perm.id} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${newRolePermissions.includes(perm.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                                        <div className={`w-5 h-5 flex items-center justify-center border ${newRolePermissions.includes(perm.id) ? 'bg-primary border-primary text-white' : 'bg-background border-border text-transparent'}`}>
                                            <Check size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">{perm.label}</div>
                                            <div className="text-[10px] opacity-70 font-mono">{perm.id}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                            <button type="submit" disabled={creatingRole || !newRoleName} className="bg-primary text-white px-6 py-2 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {creatingRole ? 'Saving...' : 'Save Role'}
                            </button>
                            <button type="button" onClick={() => setShowNewRole(false)} className="text-muted-foreground hover:text-foreground font-bold text-sm px-4 py-2">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-card border border-border flex flex-col h-full shadow-soft">
                        <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <ShieldAlert size={16} className="text-primary" /> Active Staff Members
                            </h3>
                        </div>
                        {loading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/10 border-b border-border/50">
                                            <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                            <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Role</th>
                                            <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {admins.map(admin => (
                                            <tr key={admin.id} className="hover:bg-muted/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-sm">{admin.artistName || "No Name"}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{admin.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-1 bg-muted/50 border border-border text-[10px] font-bold tracking-wider uppercase">
                                                        {admin.role.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {updating === admin.id ? <Loader2 className="animate-spin inline text-primary ml-auto" size={16} /> : (
                                                        <select
                                                            className="bg-background border border-border text-xs px-2 py-1.5 font-bold outline-none cursor-pointer focus:border-primary"
                                                            value={admin.role}
                                                            onChange={e => handleRoleChange(admin.id, e.target.value)}
                                                        >
                                                            <option value="ARTIST" className="text-rose-500">Revoke Access (Artist)</option>
                                                            <optgroup label="System Roles">
                                                                {systemRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                                            </optgroup>
                                                            {customRoles.length > 0 && (
                                                                <optgroup label="Custom Roles">
                                                                    {customRoles.map(r => <option key={r.name} value={r.name}>{r.name.replace(/_/g, ' ')}</option>)}
                                                                </optgroup>
                                                            )}
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border flex flex-col shadow-soft mb-6">
                        <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2 text-sm">
                                <ShieldCheck size={16} /> Custom Roles Library
                            </h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {customRoles.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">No custom roles built yet.</p>
                            ) : (
                                customRoles.map(r => (
                                    <div key={r.id} className="border border-border/50 bg-background p-3">
                                        <div className="font-black text-xs uppercase tracking-wider mb-2">{r.name.replace(/_/g, ' ')}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {JSON.parse(r.permissions).map((p: string) => (
                                                <span key={p} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 border border-primary/20">{p.replace('MANAGE_', '')}</span>
                                            ))}
                                            {JSON.parse(r.permissions).length === 0 && <span className="text-[9px] text-muted-foreground">No permissions</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-card border border-border flex flex-col shadow-soft">
                        <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2 text-sm">
                                <UserPlus size={16} /> Promote Staff
                            </h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center justify-between border border-border/50 p-2 hover:border-border transition-colors group">
                                    <div className="truncate pr-2">
                                        <div className="text-xs font-bold truncate">{u.artistName || 'Unnamed'}</div>
                                        <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRoleChange(u.id, customRoles.length > 0 ? customRoles[0].name : 'SUPPORT_STAFF')}
                                        disabled={updating === u.id}
                                        className="px-2 py-1 bg-muted group-hover:bg-primary group-hover:text-white text-foreground border border-border group-hover:border-primary text-[10px] font-bold transition-all whitespace-nowrap"
                                    >
                                        Assign
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
