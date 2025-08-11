'use client'

import React, { useState, useEffect } from 'react';
import { 
  HiChartBar, 
  HiChartPie, 
  HiOutlineCash, 
  HiOutlineDocumentReport, 
  HiOutlineInformationCircle, 
  HiOutlineCalendar,
  HiCurrencyDollar,
  HiOfficeBuilding,
  HiUserGroup,
  HiClipboardCheck
} from 'react-icons/hi';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { formatDateToCharlotte } from '../../lib/timezone';

// Define types for our data
interface Project {
  id: number;
  project_name: string;
  builder_id: number;
  builder_name: string;
  estimator_id: number;
  estimator_name: string;
  supervisor_id: number;
  supervisor_name: string;
  location_id: number;
  location_name: string;
  status_id: number;
  status_label: string;
  due_date: string;
  contract_value: number;
}

// Division interface removed

interface Status {
  id: number;
  label: string;
}

const AnalyticsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'performance'>('overview');

  // Fetch data from our backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const projectsRes = await fetch('/api/projects');
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
        
        // Fetch statuses
        const statusesRes = await fetch('/api/statuses');
        if (!statusesRes.ok) throw new Error('Failed to fetch statuses');
        const statusesData = await statusesRes.json();
        setStatuses(statusesData);

      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Analytics Dashboard</h1>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <HiOutlineInformationCircle className="mr-1" />
            {loading ? 'Loading data...' : 'Data updated'}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto pb-1">
          <nav className="flex min-w-max space-x-3 sm:space-x-8">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'projects' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Project Analytics
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'performance' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Performance Metrics
            </button>
          </nav>
        </div>

        {/* Loading or Error States */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Content - will be expanded in next steps */}
        {!loading && !error && (
          <>
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Project Status Pie Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Project Status Distribution</h3>
                    <span className="text-gray-700">
                      <HiChartPie className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="h-80 w-full">
                    {projects.length > 0 && statuses.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                          <Pie
                            data={statuses.map(status => {
                              const count = projects.filter(p => p.status_id === status.id).length;
                              return {
                                name: status.label,
                                value: count,
                                percentage: count > 0 ? ((count / projects.length) * 100).toFixed(1) + '%' : '0%'
                              };
                            }).filter(item => item.value > 0)} // Only show statuses that have projects
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={90}
                            innerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            paddingAngle={2}
                            label={false}
                          >
                            {statuses.map((status, index) => {
                              // Professional color palette
                              const colors = ["#334D5C", "#45B7B8", "#EFC958", "#E27A3F", "#DF5A49", "#4A6491", "#93B7BE"];
                              return <Cell key={status.id} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={1} />;
                            })}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [`${value} projects (${props.payload.percentage})`, name]}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}
                          />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            iconSize={10}
                            formatter={(value) => <span style={{ fontSize: '12px', color: '#4b5563' }}>{value}</span>}
                            wrapperStyle={{ paddingTop: '15px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        {loading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                        ) : (
                          <p>No status data available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contract Value Distribution Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Contract Value Distribution</h3>
                    <span className="text-gray-700">
                      <HiOutlineCash className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="h-80">
                    {projects.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { range: '<$50K', count: projects.filter(p => p.contract_value && p.contract_value < 50000).length },
                            { range: '$50K-$100K', count: projects.filter(p => p.contract_value && p.contract_value >= 50000 && p.contract_value < 100000).length },
                            { range: '$100K-$200K', count: projects.filter(p => p.contract_value && p.contract_value >= 100000 && p.contract_value < 200000).length },
                            { range: '$200K-$500K', count: projects.filter(p => p.contract_value && p.contract_value >= 200000 && p.contract_value < 500000).length },
                            { range: '>$500K', count: projects.filter(p => p.contract_value && p.contract_value >= 500000).length },
                          ]}
                          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                          barSize={28}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                          <XAxis 
                            dataKey="range" 
                            tick={{ fontSize: 11, fill: '#4b5563' }}
                            tickLine={false}
                            axisLine={{ strokeOpacity: 0.3 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#4b5563' }}
                            tickLine={false}
                            axisLine={{ strokeOpacity: 0.3 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} projects`, 'Count']}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Bar 
                            dataKey="count" 
                            name="Projects"
                          >
                            {[
                              '#334D5C', '#45B7B8', '#EFC958', '#E27A3F', '#DF5A49'
                            ].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        {loading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                        ) : (
                          <p>No contract value data available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Projects Timeline Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Due Date Timeline</h3>
                    <span className="text-gray-700">
                      <HiOutlineCalendar className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="h-80">
                    {projects.length > 0 && projects.some(p => p.due_date) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(() => {
                            // Group projects by month
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const projectsByMonth = months.map(month => {
                              return { 
                                month,
                                count: projects.filter(p => {
                                  if (!p.due_date) return false;
                                  const date = new Date(p.due_date);
                                  return months[date.getMonth()] === month;
                                }).length
                              };
                            });
                            return projectsByMonth;
                          })()}
                          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 11, fill: '#4b5563' }}
                            tickLine={false}
                            axisLine={{ strokeOpacity: 0.3 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#4b5563' }}
                            tickLine={false}
                            axisLine={{ strokeOpacity: 0.3 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} projects`, 'Due this month']}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}
                            cursor={{ stroke: 'rgba(0, 0, 0, 0.15)', strokeWidth: 1 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#3182CE" 
                            strokeWidth={2}
                            dot={{ fill: '#3182CE', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#3182CE', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        {loading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                        ) : (
                          <p>No due date data available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Project Analytics Tab Content */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Project Contract Value Analysis</h3>
                    <span className="bg-gray-100 text-gray-700 p-2 rounded-full">
                      <HiChartBar className="w-5 h-5" />
                    </span>
                  </div>
                  {projects.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white table-auto text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-1 sm:py-2 px-2 sm:px-4 text-left text-xs sm:text-sm">Project</th>
                            <th className="py-1 sm:py-2 px-2 sm:px-4 text-left text-xs sm:text-sm">Status</th>
                            <th className="py-1 sm:py-2 px-2 sm:px-4 text-right text-xs sm:text-sm">Contract Value</th>
                            <th className="py-1 sm:py-2 px-2 sm:px-4 text-left text-xs sm:text-sm">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {projects
                            .filter(project => project.contract_value)
                            .sort((a, b) => b.contract_value - a.contract_value)
                            .slice(0, 10)
                            .map(project => {
                              const status = statuses.find(s => s.id === project.status_id);
                              return (
                                <tr key={project.id}>
                                  <td className="py-1 sm:py-2 px-2 sm:px-4 text-xs sm:text-base">{project.project_name}</td>
                                  <td className="py-1 sm:py-2 px-2 sm:px-4 text-xs sm:text-base">{status?.label || 'Unknown'}</td>
                                  <td className="py-1 sm:py-2 px-2 sm:px-4 text-right text-xs sm:text-base">${project.contract_value?.toLocaleString() || 'N/A'}</td>
                                  <td className="py-1 sm:py-2 px-2 sm:px-4 text-xs sm:text-base">
                                    {project.due_date 
                                      ? formatDateToCharlotte(project.due_date) 
                                      : 'N/A'}
                                  </td>
                                </tr>
                              );
                            })}
                          
                        </tbody>
                      </table>
                      <p className="text-gray-500 text-sm mt-2 text-right">Showing top 10 projects by contract value</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No project data available</div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Metrics Tab Content */}
            {activeTab === 'performance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Value Distribution */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Contract Value Distribution</h3>
                    <HiOutlineCash className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="h-80">
                    {projects.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={projects
                            .filter(project => project.contract_value)
                            .sort((a, b) => b.contract_value - a.contract_value)
                            .slice(0, 10)}
                          margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
                          barSize={30}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                          <XAxis 
                            dataKey="project_name" 
                            angle={-35} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fontSize: 11, fill: '#4b5563' }}
                            tickLine={false}
                            axisLine={{ strokeOpacity: 0.3 }}
                            interval={0}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${(value/1000).toLocaleString()}K`}
                            tick={{ fontSize: 11, fill: '#4b5563' }}
                            tickLine={false}
                            axisLine={{ strokeOpacity: 0.3 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Contract Value']}
                            labelFormatter={(label) => `Project: ${label}`}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0' }}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Bar 
                            dataKey="contract_value" 
                            name="Contract Value">
                            {projects
                              .filter(project => project.contract_value)
                              .map((_, index) => {
                                const colors = ['#334D5C', '#45B7B8', '#EFC958', '#E27A3F', '#DF5A49', '#4A6491', '#93B7BE'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        {loading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                        ) : (
                          <p>No contract value data available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="col-span-1 flex flex-col space-y-4">
                  {/* Average Contract Value */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Average Contract</h3>
                      <HiCurrencyDollar className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {projects.length > 0 && projects.some(p => p.contract_value)
                          ? `$${Math.round(projects.reduce((sum, p) => sum + (p.contract_value || 0), 0) / 
                              projects.filter(p => p.contract_value).length).toLocaleString()}`
                          : '$0'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Across {projects.filter(p => p.contract_value).length} projects
                      </p>
                    </div>
                  </div>
                  
                  {/* Total Contract Value */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Total Portfolio</h3>
                      <HiOutlineCash className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-900">
                        ${projects.reduce((sum, p) => sum + (p.contract_value || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">All projects combined</p>
                    </div>
                  </div>
                  
                  {/* Project Due Date Analysis */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Due Date Status</h3>
                      <HiOutlineCalendar className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {projects.length > 0 
                          ? `${Math.round(projects.filter(p => p.due_date).length / projects.length * 100)}%`
                          : '0%'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Projects with due dates: {projects.filter(p => p.due_date).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
