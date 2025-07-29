'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Define types
interface Project {
  id: number;
  project_name: string;
  builder_name?: string;
  status_id: number;
  status_label?: string;
}

interface Status {
  id: number;
  label: string;
}

interface Columns {
  [key: string]: {
    name: string;
    items: Project[];
  };
}

const ProjectsOngoingClient = () => {
  const [columns, setColumns] = useState<Columns>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectsRes, statusesRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/statuses')
        ]);

        if (!projectsRes.ok || !statusesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const projects: Project[] = await projectsRes.json();
        const statuses: Status[] = await statusesRes.json();

        const initialColumns: Columns = {};
        statuses.forEach(status => {
          initialColumns[status.id.toString()] = {
            name: status.label,
            items: []
          };
        });

        projects.forEach(project => {
          if (project.status_id && initialColumns[project.status_id.toString()]) {
            initialColumns[project.status_id.toString()].items.push(project);
          }
        });

        setColumns(initialColumns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const destItems = source.droppableId === destination.droppableId ? sourceItems : [...destColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, removed);

    const newColumns = {
      ...columns,
      [source.droppableId]: {
        ...sourceColumn,
        items: sourceItems
      },
      [destination.droppableId]: {
        ...destColumn,
        items: destItems
      }
    };
    setColumns(newColumns);

    try {
      const projectId = draggableId;
      const newStatusId = parseInt(destination.droppableId);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: newStatusId }),
      });
      if (!response.ok) throw new Error('Failed to update project status');
    } catch (err) {
      setError('Failed to update project status. Please try again.');
      // Revert UI on failure
      const oldSourceItems = [...columns[source.droppableId].items];
      const oldDestItems = [...columns[destination.droppableId].items];
      setColumns({
          ...columns,
          [source.droppableId]: { ...sourceColumn, items: oldSourceItems },
          [destination.droppableId]: { ...destColumn, items: oldDestItems },
      });
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading Projects...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      {isClient ? (
        <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(columns).map(([columnId, column]) => (
          <Droppable key={columnId} droppableId={columnId}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-gray-100 rounded-lg shadow-md p-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-300">
                  {column.name}
                  <span className="text-sm font-normal text-gray-500 ml-2">({column.items.length})</span>
                </h2>
                <div className="space-y-4 min-h-[400px]">
                  {column.items.map((item, index) => (
                    <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-md shadow-sm p-4 border-l-4 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''} border-blue-500`}
                          style={{
                            ...provided.draggableProps.style,
                          }}>
                          <h3 className="font-semibold text-gray-900">{item.project_name}</h3>
                          {item.builder_name && (
                            <p className="text-sm text-gray-600 mt-1">{item.builder_name}</p>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
      ) : null}
    </>
  );
};

export default ProjectsOngoingClient;
