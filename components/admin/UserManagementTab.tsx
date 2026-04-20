'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Trash2, Edit2, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';

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
 * UserManagementTab Component
 *
 * Provides functionality to list, create, edit, and delete users
 * within the Admin Dashboard.
 */
export function UserManagementTab() {
  const { t } = useI18n();

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

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetUserForm = () => {
    setShowUserForm(false);
    setEditingUserId(null);
    setUserFormData({ email: '', name: '', password: '', role: 'USER' });
  };

  const handleEditUserClick = (user: UserData) => {
    setEditingUserId(user.id);
    setUserFormData({
      email: user.email || '',
      name: user.name || '',
      password: '',
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
        toast.error(data.error || 'Failed to save user');
      }
    } catch (err) {
      toast.error('Error saving user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? This will also delete all their classrooms.',
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted');
        setTimeout(() => fetchUsers(), 100);
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Error deleting user');
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Registered Users
          </CardTitle>
          <CardDescription>Manage user accounts and permissions.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={usersLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-2', usersLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => (showUserForm ? resetUserForm() : setShowUserForm(true))}
          >
            {showUserForm ? <X className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {showUserForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>
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
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  required
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Password {editingUserId && '(Leave blank to keep)'}</Label>
                <Input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
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
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                        user.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                          : 'bg-gray-50 text-gray-600 border-gray-200',
                      )}
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
                        onClick={() => handleEditUserClick(user)}
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
  );
}
