'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { BookOpen, Share2, Clock, User as UserIcon, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClassroomData {
  id: string;
  name: string;
  userId: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

/**
 * ClassroomManagementTab Component
 *
 * Provides functionality to list all classrooms in the system,
 * toggle their shared status, and delete them.
 */
export function ClassroomManagementTab() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/classrooms');
      if (!res.ok) throw new Error('Failed to load classrooms');
      const data = await res.json();
      if (data.success) {
        setClassrooms(data.classrooms);
      }
    } catch (err) {
      console.error('Fetch classrooms error:', err);
      toast.error('Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleToggleShare = async (id: string, isShared: boolean) => {
    try {
      const res = await fetch('/api/admin/classrooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isShared }),
      });
      const data = await res.json();
      if (data.success) {
        setClassrooms((prev) => prev.map((c) => (c.id === id ? { ...c, isShared } : c)));
        toast.success(isShared ? 'Classroom is now shared' : 'Classroom is now private');
      }
    } catch (err) {
      toast.error('Failed to update shared status');
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.'))
      return;
    try {
      const res = await fetch(`/api/admin/classrooms?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setClassrooms((prev) => prev.filter((c) => c.id !== id));
        toast.success('Classroom deleted');
      }
    } catch (err) {
      toast.error('Failed to delete classroom');
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> System Classrooms
            </CardTitle>
            <CardDescription>Monitor and moderate all generated content.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchClassrooms} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="text-left py-3 px-4 font-bold">Classroom</th>
                <th className="text-left py-3 px-4 font-bold">Owner</th>
                <th className="text-left py-3 px-4 font-bold">Shared</th>
                <th className="text-left py-3 px-4 font-bold">Updated</th>
                <th className="text-right py-3 px-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classrooms.map((classroom) => (
                <tr
                  key={classroom.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[200px]">
                          {classroom.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          ID: {classroom.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {classroom.user.name || 'Anonymous'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {classroom.user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={classroom.isShared}
                        onCheckedChange={(checked) => handleToggleShare(classroom.id, checked)}
                      />
                      <Share2
                        className={cn(
                          'w-3.5 h-3.5',
                          classroom.isShared ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(classroom.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/classroom/${classroom.id}`)}
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                        title="View Classroom"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClassroom(classroom.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading classroom list...
            </div>
          )}
          {!loading && classrooms.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No classrooms found in the system.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
