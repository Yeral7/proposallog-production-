'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineOfficeBuilding, HiOutlineExclamation } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';
import { formatDateToCharlotte, getCurrentCharlotteTime } from '@/lib/timezone';

interface Project {
  id: number;
  project_name: string;
  builder_name: string;
  estimator_name: string;
  status_name: string;
  submission_date: string | null;
  due_date: string | null;
  follow_up_date: string | null;
  contract_value: number | null;
  priority_name: string | null;
}

interface BuilderStats {
  builder: string;
  project_count: number;
}

interface EstimatorStats {
  estimator: string;
  project_count: number;
}

const CommercialPage = () => {
  const [highPriorityProjects, setHighPriorityProjects] = useState<Project[]>([]);
  const [topBuilder, setTopBuilder] = useState<BuilderStats | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState({ open: 0, awarded: 0, awardedValue: 0, lost: 0 });
  const [dueSoon, setDueSoon] = useState<Project[]>([]);
  const [followUpsToday, setFollowUpsToday] = useState<Project[]>([]);
  const [pipeline, setPipeline] = useState<{ [status: string]: number }>({});
  const [topEstimator, setTopEstimator] = useState<EstimatorStats | null>(null);
  const [dueWindowDays, setDueWindowDays] = useState<number>(7);
  const [followUpWhen, setFollowUpWhen] = useState<'today' | 'tomorrow'>('today');

  // Month name for submissions header and list of proposals submitted this month
  const monthName = React.useMemo(() => {
    const nowCLT = getCurrentCharlotteTime();
    return nowCLT.toLocaleString('en-US', { month: 'long', timeZone: 'America/New_York' });
  }, []);
  const submittedThisMonth = React.useMemo(() => {
    const now = getCurrentCharlotteTime();
    const m = now.getMonth();
    const y = now.getFullYear();
    return projects
      .filter((p) => {
        if (!p.submission_date) return false;
        const d = new Date(p.submission_date);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .sort((a, b) => (new Date(b.submission_date || '').getTime()) - (new Date(a.submission_date || '').getTime()))
      .slice(0, 7);
  }, [projects]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (highPriorityProjects.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % highPriorityProjects.length);
      }, 3000); // Change slide every 3 seconds
      return () => clearInterval(interval);
    }
  }, [highPriorityProjects.length]);

  // Recompute Due Soon and Follow-ups when filters change
  useEffect(() => {
    const now = getCurrentCharlotteTime();
    const until = new Date(now);
    until.setDate(now.getDate() + dueWindowDays);

    const dueList = projects
      .filter((p) => {
        if (!p.due_date) return false;
        const statusLc = (p.status_name || '').toLowerCase();
        if (statusLc === 'lost' || statusLc === 'awarded') return false;
        const d = new Date(p.due_date);
        return d >= now && d <= until;
      })
      .sort((a, b) => (new Date(a.due_date || '').getTime()) - (new Date(b.due_date || '').getTime()))
      .slice(0, 7);
    setDueSoon(dueList);

    const todayCLT = getCurrentCharlotteTime();
    const y = todayCLT.getFullYear();
    const m = String(todayCLT.getMonth() + 1).padStart(2, '0');
    const d0 = String(todayCLT.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d0}`;
    const tomorrowCLT = new Date(todayCLT);
    tomorrowCLT.setDate(todayCLT.getDate() + 1);
    const y2 = tomorrowCLT.getFullYear();
    const m2 = String(tomorrowCLT.getMonth() + 1).padStart(2, '0');
    const d2 = String(tomorrowCLT.getDate()).padStart(2, '0');
    const tomorrowStr = `${y2}-${m2}-${d2}`;

    const followList = projects
      .filter((p) => {
        const statusLc = (p.status_name || '').toLowerCase();
        if (statusLc === 'lost' || statusLc === 'awarded') return false;
        const target = followUpWhen === 'today' ? todayStr : tomorrowStr;
        return p.follow_up_date === target;
      })
      .sort((a, b) => (a.project_name || '').localeCompare(b.project_name || ''))
      .slice(0, 7);
    setFollowUpsToday(followList);
  }, [projects, dueWindowDays, followUpWhen]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetchWithAuth('/api/projects');
      if (response.ok) {
        const projects: Project[] = await response.json();
        setProjects(projects);
        
        // Filter high priority projects
        const highPriority = (projects as Project[]).filter((p) => {
          const name = p.priority_name?.toLowerCase();
          return name === 'high' || name === 'overdue';
        });
        setHighPriorityProjects(highPriority);
        
        // Calculate most used builder
        const builderCounts: { [key: string]: number } = {};
        const estimatorCounts: { [key: string]: number } = {};
        const pipelineCounts: { [key: string]: number } = {};
        let open = 0, awarded = 0, lost = 0, awardedValue = 0;

        const todayStr = new Date().toISOString().slice(0, 10);
        const now = new Date();
        const in7 = new Date(now);
        in7.setDate(now.getDate() + 7);

        projects.forEach((project: Project) => {
          // Builder counts
          if (project.builder_name && project.builder_name !== 'N/A') {
            builderCounts[project.builder_name] = (builderCounts[project.builder_name] || 0) + 1;
          }

          // Estimator counts (ignore unset values)
          const est = (project.estimator_name || '').trim();
          if (est && est.toLowerCase() !== 'n/a' && est.toLowerCase() !== 'not set') {
            estimatorCounts[est] = (estimatorCounts[est] || 0) + 1;
          }

          // KPIs
          const statusLc = (project.status_name || '').toLowerCase();
          if (statusLc === 'awarded') {
            awarded += 1;
            if (typeof project.contract_value === 'number') {
              awardedValue += project.contract_value || 0;
            }
          } else if (statusLc === 'lost') {
            lost += 1;
          } else {
            open += 1;
          }
        });

        setPipeline(pipelineCounts);
        setKpis({ open, awarded, awardedValue, lost });

        const topBuilderEntry = Object.entries(builderCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (topBuilderEntry) {
          setTopBuilder({
            builder: topBuilderEntry[0],
            project_count: topBuilderEntry[1]
          });
        }

        const topEstimatorEntry = Object.entries(estimatorCounts)
          .sort(([,a], [,b]) => b - a)[0];
        if (topEstimatorEntry) {
          setTopEstimator({
            estimator: topEstimatorEntry[0],
            project_count: topEstimatorEntry[1]
          });
        }

        // Due soon (next 7 days), exclude Lost/Awarded
        const dueSoonList = projects
          .filter((p) => {
            if (!p.due_date) return false;
            const statusLc = (p.status_name || '').toLowerCase();
            if (statusLc === 'lost' || statusLc === 'awarded') return false;
            const d = new Date(p.due_date);
            return d >= now && d <= in7;
          })
          .sort((a, b) => (new Date(a.due_date || '').getTime()) - (new Date(b.due_date || '').getTime()))
          .slice(0, 7);
        setDueSoon(dueSoonList);

        // Follow-ups today
        const followUps = projects
          .filter((p) => {
            const statusLc = (p.status_name || '').toLowerCase();
            if (statusLc === 'lost' || statusLc === 'awarded') return false;
            return p.follow_up_date === todayStr;
          })
          .sort((a, b) => (a.project_name || '').localeCompare(b.project_name || ''))
          .slice(0, 7);
        setFollowUpsToday(followUps);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Commercial Dashboard" icon={<HiOutlineViewGrid />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* High Priority Projects Slideshow - Left */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineExclamation className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">High Priority Projects</h3>
                <p className="text-sm text-gray-500">Projects requiring immediate attention</p>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              </div>
            ) : highPriorityProjects.length > 0 ? (
              <div className="relative">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-xl font-bold text-gray-900">
                    {highPriorityProjects[currentSlide]?.project_name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {highPriorityProjects[currentSlide]?.builder_name}
                  </div>
                </div>
                
                {highPriorityProjects.length > 1 && (
                  <div className="flex justify-center mt-3 space-x-2">
                    {highPriorityProjects.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {currentSlide + 1} of {highPriorityProjects.length}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineExclamation className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No high priority projects</p>
              </div>
            )}
          </div>

          {/* Most Used Builder - Right */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineOfficeBuilding className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Top Builder</h3>
                <p className="text-sm text-gray-500">Most frequently used builder</p>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : topBuilder ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {topBuilder.builder}
                </div>
                <div className="text-lg text-blue-600 font-semibold">
                  {topBuilder.project_count} projects
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Most active builder
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineOfficeBuilding className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No builder data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Due Soon and Follow-ups Today */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineClipboardList className="h-6 w-6 text-yellow-500" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Due in {dueWindowDays} Days</h3>
            </div>
            <div className="flex justify-end mb-3">
              <div className="inline-flex rounded-md overflow-hidden border border-yellow-200">
                <button
                  onClick={() => setDueWindowDays(7)}
                  className={`px-3 py-1 text-xs font-medium ${dueWindowDays === 7 ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-yellow-50'}`}
                >
                  7d
                </button>
                <button
                  onClick={() => setDueWindowDays(14)}
                  className={`px-3 py-1 text-xs font-medium border-l border-yellow-200 ${dueWindowDays === 14 ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-yellow-50'}`}
                >
                  14d
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mx-auto"></div>
              </div>
            ) : dueSoon.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {dueSoon.map((p) => (
                  <li key={p.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.project_name}</div>
                      <div className="text-xs text-gray-500">{p.builder_name}</div>
                    </div>
                    <div className="text-xs text-gray-600">{p.due_date ? formatDateToCharlotte(p.due_date) : '—'}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">Nothing due in the next {dueWindowDays} days</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineClipboardList className="h-6 w-6 text-blue-500" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Follow-ups {followUpWhen === 'today' ? 'Today' : 'Tomorrow'}</h3>
            </div>
            <div className="flex justify-end mb-3">
              <div className="inline-flex rounded-md overflow-hidden border border-blue-200">
                <button
                  onClick={() => setFollowUpWhen('today')}
                  className={`px-3 py-1 text-xs font-medium ${followUpWhen === 'today' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setFollowUpWhen('tomorrow')}
                  className={`px-3 py-1 text-xs font-medium border-l border-blue-200 ${followUpWhen === 'tomorrow' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
                >
                  Tomorrow
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : followUpsToday.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {followUpsToday.map((p) => (
                  <li key={p.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.project_name}</div>
                      {p.estimator_name && !['not set','n/a'].includes(p.estimator_name.toLowerCase()) && (
                        <div className="text-xs text-gray-500">Estimator: {p.estimator_name}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">{p.follow_up_date ? formatDateToCharlotte(p.follow_up_date) : '—'}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">No follow-ups scheduled for {followUpWhen === 'today' ? 'today' : 'tomorrow'}</div>
            )}
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Open Proposals</div>
                <div className="text-2xl font-bold text-gray-900">{kpis.open}</div>
              </div>
              <HiOutlineClipboardList className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Awarded</div>
                <div className="text-2xl font-bold text-gray-900">{kpis.awarded}</div>
              </div>
              <HiOutlineTrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Confidential Metric</div>
                <div className="text-2xl font-bold text-gray-900">Hidden</div>
                <div className="text-xs text-gray-400 mt-1">This KPI is private</div>
              </div>
              <HiOutlineChartBar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Lost</div>
                <div className="text-2xl font-bold text-gray-900">{kpis.lost}</div>
              </div>
              <HiOutlineExclamation className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Submissions this month and Top Estimator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineChartBar className="h-6 w-6 text-purple-500" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Proposals submitted this month - {monthName}</h3>
            </div>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : submittedThisMonth.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {submittedThisMonth.map((p) => (
                  <li key={p.id} className="py-2">
                    <div className="text-sm font-medium text-gray-900">{p.project_name}</div>
                    <div className="text-xs text-gray-600">
                      Priority: {p.priority_name || 'Not Set'} · Status: {p.status_name || 'N/A'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">No proposals submitted this month</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineOfficeBuilding className="h-6 w-6 text-green-500" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Top Estimator</h3>
            </div>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : topEstimator ? (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {topEstimator.estimator}
                </div>
                <div className="text-lg text-green-700 font-semibold">
                  {topEstimator.project_count} projects
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Most active estimator
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineOfficeBuilding className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No estimator data available</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommercialPage;
