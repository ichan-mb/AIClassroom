'use client';

import { useState } from 'react';
import { useAgentRegistry } from '@/lib/orchestration/registry/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, PencilIcon, Trash2Icon, UserIcon } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';

/**
 * AgentConfigPanel
 * UI for managing classroom agents (Teacher, Assistants, Students).
 */
export function AgentConfigPanel() {
  const { t } = useI18n();
  const agents = useAgentRegistry((s) => s.agents);
  const deleteAgent = useAgentRegistry((s) => s.deleteAgent);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleDelete = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(agentId);
      if (selectedAgentId === agentId) {
        setSelectedAgentId(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Agent Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage AI agents for classroom discussions
          </p>
        </div>
        <Button size="sm" className="h-8">
          <PlusIcon className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2 scrollbar-thin">
        {agents.length > 0 ? (
          agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={cn(
                'group relative p-4 rounded-xl border transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5',
                selectedAgentId === agent.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card',
              )}
            >
              <div className="flex items-start gap-4">
                {/* Avatar Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
                  style={{ borderColor: agent.color, backgroundColor: `${agent.color}20` }}
                >
                  {agent.avatar ? (
                    <img src={agent.avatar} alt={agent.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <UserIcon className="w-5 h-5" style={{ color: agent.color }} />
                  )}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold truncate text-sm">{agent.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5 font-bold uppercase tracking-wider"
                      >
                        {t('settings.priority')} {agent.priority}
                      </Badge>
                      {!agent.isGenerated && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 font-bold uppercase tracking-wider"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {agent.role}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mb-1">
                        Persona
                      </p>
                      <p className="text-xs line-clamp-2 leading-relaxed text-foreground/80">
                        {agent.persona}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mb-1">
                        Available Actions ({agent.allowedActions.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {agent.allowedActions.slice(0, 4).map((action) => (
                          <span
                            key={action}
                            className="text-[9px] px-1.5 py-0.5 bg-muted rounded border border-border/50 font-medium"
                          >
                            {action}
                          </span>
                        ))}
                        {agent.allowedActions.length > 4 && (
                          <span className="text-[9px] text-muted-foreground px-1">
                            + {agent.allowedActions.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-0.5 rounded-lg shadow-sm">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <PencilIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(agent.id, e)}
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/20 text-center p-6">
            <UserIcon className="w-10 h-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-4">No agents configured</p>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first agent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
