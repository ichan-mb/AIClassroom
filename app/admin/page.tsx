'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Lock, ArrowLeft, RefreshCw, Settings, Users, BookOpen } from 'lucide-react';
import { SystemSettingsTab } from '@/components/admin/SystemSettingsTab';
import { ClassroomManagementTab } from '@/components/admin/ClassroomManagementTab';
import { UserManagementTab } from '@/components/admin/UserManagementTab';

/**
 * Admin Dashboard
 *
 * Provides a clean, modular layout for system administrators.
 * Functionality is split into specialized tab components for better maintainability.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) throw new Error('Session fetch failed');
        const session = await res.json();

        if (session?.user?.role === 'ADMIN') {
          setIsAdmin(true);
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
  }, []);

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
        <h1 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          You do not have the required permissions to access the Admin Dashboard. Please log in with
          an administrator account.
        </p>
        <Button variant="outline" onClick={() => router.push('/')}>
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
              className="rounded-full shrink-0 h-10 w-10 shadow-sm"
              onClick={() => router.push('/')}
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Lock className="w-4 h-4" /> AI Classroom Management
              </p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-900 border p-1 h-12 shadow-sm rounded-xl inline-flex w-auto">
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary gap-2 h-full px-6 rounded-lg transition-all font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>System Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="classrooms"
              className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary gap-2 h-full px-6 rounded-lg transition-all font-medium"
            >
              <BookOpen className="w-4 h-4" />
              <span>Classrooms</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary gap-2 h-full px-6 rounded-lg transition-all font-medium"
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="settings"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
          >
            <SystemSettingsTab />
          </TabsContent>

          <TabsContent
            value="classrooms"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
          >
            <ClassroomManagementTab />
          </TabsContent>

          <TabsContent
            value="users"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
          >
            <UserManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
