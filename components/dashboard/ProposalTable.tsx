import React from 'react';

// Define the type for a single project, including the joined data
export interface Project {
  id: number;
  project_name: string;
  builder_name: string;
  estimator_name: string;
  status_label: string;
  location_name: string | null;
  due_date: string;
  contract_value: number;
}

interface ProposalTableProps {
  projects: Project[];
}

const ProposalTable: React.FC<ProposalTableProps> = ({ projects }) => {
  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-3 px-4 text-left">Project Name</th>
            <th className="py-3 px-4 text-left">Builder</th>
            <th className="py-3 px-4 text-left">Estimator</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4 text-left">Location</th>
            <th className="py-3 px-4 text-left">Due Date</th>
            <th className="py-3 px-4 text-left">Contract Value</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {projects.map((project) => (
            <tr key={project.id} className="border-b">
              <td className="py-3 px-4">{project.project_name}</td>
              <td className="py-3 px-4">{project.builder_name}</td>
              <td className="py-3 px-4">{project.estimator_name}</td>
              <td className="py-3 px-4">{project.status_label}</td>
              <td className="py-3 px-4">{project.location_name || 'N/A'}</td>
              <td className="py-3 px-4">{project.due_date}</td>
              <td className="py-3 px-4">${project.contract_value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProposalTable;
