'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Save,
  RefreshCw,
  ShieldAlert,
  Lock,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { SettingsContent } from '@/components/settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  _count: {
    classrooms: number;
  };
}

/**
 * Admin Dashboard
 * Provides centralized management for system-wide AI configuration and user accounts.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // User Management State
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
  });

  const { fetchGlobalSettings, saveGlobalSettings } = useSettingsStore();

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Server error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error?.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) throw new Error('Session fetch failed');
        const session = await res.json();

        if (session?.user?.role === 'ADMIN') {
          setIsAdmin(true);
          // Pre-fetch data for the dashboard
          await Promise.all([fetchGlobalSettings(), fetchUsers()]);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [fetchGlobalSettings, fetchUsers]);

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      await saveGlobalSettings();
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error('Failed to save system settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetUserForm = () => {
    setShowUserForm(false);
    setEditingUserId(null);
    setUserFormData({ email: '', name: '', password: '', role: 'USER' });
  };

  const handleEditClick = (user: UserData) => {
    setEditingUserId(user.id);
    setUserFormData({
      email: user.email || '',
      name: user.name || '',
      password: '', // Leave blank for no change
      role: user.role,
    });
    setShowUserForm(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...userFormData,
        id: editingUserId || undefined,
      };

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingUserId ? 'User updated' : 'User created');
        resetUserForm();
        setTimeout(() => fetchUsers(), 100);
      } else {
        toast.error(data.error?.message || 'Failed to save user');
      }
    } catch (err) {
      toast.error('Error saving user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (
      !confirm('Are you sure you want to delete this user? This will also delete their classrooms.')
    )
      return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted');
        setTimeout(() => fetchUsers(), 100);
      } else {
        toast.error(data.error?.message || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => router.push('/')}
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Secure System Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fetchGlobalSettings()} disabled={isSaving}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              Sync DB
            </Button>
            <Button onClick={handleGlobalSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Global Config'}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-900 border">
            <TabsTrigger value="overview">System Settings</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="h-[75vh]">
              <SettingsContent showCloseButton={false} className="h-full border-none shadow-none" />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Registered Users
                  </CardTitle>
                  <CardDescription>Manage user accounts and permissions.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => (showUserForm ? resetUserForm() : setShowUserForm(true))}
                >
                  {showUserForm ? (
                    <X className="w-4 h-4 mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {showUserForm ? 'Cancel' : 'Add User'}
                </Button>
              </CardHeader>
              <CardContent>
                {showUserForm && (
                  <form
                    onSubmit={handleUserSubmit}
                    className="mb-8 p-6 border rounded-xl bg-gray-50 dark:bg-gray-900 animate-in slide-in-from-top duration-300"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary">
                      {editingUserId ? 'Edit User' : 'Create New User'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, email: e.target.value })
                          }
                          required
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={userFormData.name}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, name: e.target.value })
                          }
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password {editingUserId && '(Leave blank to keep)'}</Label>
                        <Input
                          type="password"
                          value={userFormData.password}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, password: e.target.value })
                          }
                          required={!editingUserId}
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={userFormData.role}
                          onValueChange={(v: any) => setUserFormData({ ...userFormData, role: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Standard User</SelectItem>
                            <SelectItem value="ADMIN">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={resetUserForm}>
                        Cancel
                      </Button>
                      <Button type="submit" className="min-w-[120px]">
                        {editingUserId ? 'Update User' : 'Create Account'}
                      </Button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="text-left py-3 px-4 font-bold">User</th>
                        <th className="text-left py-3 px-4 font-bold">Role</th>
                        <th className="text-left py-3 px-4 font-bold">Classrooms</th>
                        <th className="text-left py-3 px-4 font-bold">Created</th>
                        <th className="text-right py-3 px-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user.name?.charAt(0) || user.email?.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {user.name || 'Anonymous'}
                                </span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium text-muted-foreground">
                            {user._count.classrooms}
                          </td>
                          <td className="py-4 px-4 text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(user)}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersLoading && (
                    <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading user data...
                    </div>
                  )}
                  {!usersLoading && users.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">No users found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
