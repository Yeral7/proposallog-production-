"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { fetchWithAuth } from "@/lib/apiClient";

export interface ResidentialKanbanBoardProps {
  projects: Array<{
    id: number;
    project_name: string;
    status: { id: number; name: string } | null;
  }>;
  onStatusChanged?: () => void;
}

interface StatusItem { id: number; name: string; display_order: number | null }

const TARGET_STATUS_NAMES = ["Upcoming", "On Hold", "In Progress", "Completed"] as const;

function ColumnContainer({ id, title, titleClassName, children }: { id: string; title: string; titleClassName?: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`bg-white rounded-lg border ${isOver ? 'border-[var(--secondary-color)]' : 'border-gray-200'} shadow-sm p-3 min-h-[280px] flex-1`}>
      <div className={`font-semibold mb-2 ${titleClassName || 'text-gray-800'}`}>{title}</div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function DraggableCard({ id, title }: { id: string; title: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style: React.CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`border rounded-md p-2 bg-[var(--accent-gray)] hover:bg-gray-100 text-sm text-gray-800 cursor-grab ${isDragging ? 'opacity-70' : ''}`}>
      {title}
    </div>
  );
}

const ResidentialKanbanBoard: React.FC<ResidentialKanbanBoardProps> = ({ projects, onStatusChanged = () => {} }) => {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [localColumns, setLocalColumns] = useState<Record<string, number[]>>({}); // key: status:<id>

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Load statuses
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth('/api/residential-statuses', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch statuses');
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter((s: any) => TARGET_STATUS_NAMES.includes(s.name));
        // Sort by our desired order
        const order = TARGET_STATUS_NAMES;
        filtered.sort((a: StatusItem, b: StatusItem) => order.indexOf(a.name as any) - order.indexOf(b.name as any));
        setStatuses(filtered);
      } catch (e) {
        console.error(e);
        setStatuses([]);
      }
    };
    load();
  }, []);

  // Group projects into columns when projects or statuses change
  useEffect(() => {
    const next: Record<string, number[]> = {};
    for (const st of statuses) {
      next[`status:${st.id}`] = [];
    }
    for (const p of projects) {
      const stId = p.status?.id ?? null;
      const key = stId && next.hasOwnProperty(`status:${stId}`) ? `status:${stId}` : (statuses[0] ? `status:${statuses[0].id}` : '');
      if (key) next[key].push(p.id);
    }
    setLocalColumns(next);
  }, [projects, statuses]);

  const projectById = useMemo(() => {
    const map = new Map<number, { id: number; title: string }>();
    projects.forEach(p => map.set(p.id, { id: p.id, title: p.project_name }));
    return map;
  }, [projects]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return; // dropped outside

    const activeId = Number(String(active.id).replace('card:', ''));
    const overId = String(over.id);
    if (!overId.startsWith('status:')) return;

    const targetStatusId = Number(overId.split(':')[1]);

    // Optimistic UI: move card into target column (remove from others)
    setLocalColumns(prev => {
      const next: Record<string, number[]> = {};
      for (const [k, ids] of Object.entries(prev)) {
        next[k] = ids.filter(id => id !== activeId);
      }
      if (!next[overId]) next[overId] = [];
      next[overId] = [activeId, ...next[overId]];
      return next;
    });

    // Persist
    try {
      const res = await fetchWithAuth(`/api/residential-projects/${activeId}`, {
        method: 'PUT',
        body: JSON.stringify({ project_name: projectById.get(activeId)?.title || 'Project', status_id: targetStatusId })
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      onStatusChanged();
    } catch (e) {
      console.error(e);
      // On failure, trigger a refresh to correct state
      onStatusChanged();
    }
  };

  return (
    <div>
      {statuses.length === 0 ? (
        <div className="text-sm text-gray-600">No statuses found. Please ensure the following exist in residential_statuses: {TARGET_STATUS_NAMES.join(', ')}.</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {statuses.map((st) => {
              const name = st.name;
              const titleClassName = name === 'In Progress'
                ? 'text-green-600'
                : name === 'On Hold'
                ? 'text-yellow-600'
                : name === 'Upcoming'
                ? 'text-cyan-600'
                : name === 'Completed'
                ? 'text-blue-600'
                : 'text-gray-800';
              return (
                <ColumnContainer key={st.id} id={`status:${st.id}`} title={name} titleClassName={titleClassName}>
                  {(localColumns[`status:${st.id}`] || []).map((pid) => (
                    <DraggableCard key={`card:${pid}`} id={`card:${pid}`} title={projectById.get(pid)?.title || `Project ${pid}`} />
                  ))}
                </ColumnContainer>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default ResidentialKanbanBoard;
