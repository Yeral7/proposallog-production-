'use client';

/**
 * @branch feature/schedulesprototype
 * Sidebar — refactored to gate links by permission tags.
 *
 * Changes vs. main:
 *   - New "Labor Log" link, visible when canAccessLaborLog() is true.
 *   - Estimation links (Commercial / Proposal Log / Residential / Analytics /
 *     User / Projects Ongoing) auto-hide for labor-only users
 *     (`canAccessLaborLog() && !canAccessProposalLog()`).
 *   - `RoleViewSwitcher` mounted at the bottom for mock impersonation.
 */
import React from 'react';
import Link from 'next/link';
import {
    HiOutlineViewGrid,
    HiOutlineClipboardList,
    HiOutlineUsers,
    HiOutlineCog,
    HiOutlineChartBar,
    HiOutlineHome,
    HiOutlineUser,
    HiOutlineCalendar,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
// @branch feature/schedulesprototype
import RoleViewSwitcher from './labor-log/RoleViewSwitcher';

type NavItem = {
    title: string;
    link: string;
    icon: React.ReactNode;
    sub?: boolean;
    /** When false, link is filtered out entirely (not just disabled). */
    visible: boolean;
    /** When false, link renders but is disabled with a tooltip. */
    accessible?: boolean;
    accessibleTooltip?: string;
};

const Sidebar = () => {
    const {
        canAccessAdmin,
        canAccessDataManagement,
        canAccessLaborLog,
        canAccessProposalLog,
    } = useAuth();

    // @branch feature/schedulesprototype
    // A "labor only" user is one who has labor permissions but no
    // estimation:access — they should see ONLY the Labor Log link.
    const laborOnly = canAccessLaborLog() && !canAccessProposalLog();

    const navLinks: NavItem[] = [
        // Estimation/proposal-log side — hidden entirely for labor-only users.
        { title: 'Commercial',       link: '/commercial',       icon: <HiOutlineViewGrid size={22} />,    visible: !laborOnly },
        { title: 'User',             link: '/user',             icon: <HiOutlineUser size={22} />,        sub: true, visible: !laborOnly },
        { title: 'Proposal Log',     link: '/proposal-log',     icon: <HiOutlineViewGrid size={22} />,    sub: true, visible: !laborOnly && canAccessProposalLog() },
        { title: 'Projects Ongoing', link: '/projects-ongoing', icon: <HiOutlineClipboardList size={22} />, sub: true, visible: !laborOnly },
        { title: 'Residential',      link: '/residential-log',  icon: <HiOutlineHome size={22} />,        visible: !laborOnly },
        { title: 'Analytics',        link: '/analytics',        icon: <HiOutlineChartBar size={22} />,    visible: !laborOnly },

        // @branch feature/schedulesprototype
        // Labor-log — only shows for users with any labor:* permission.
        { title: 'Labor Log',        link: '/labor-log',        icon: <HiOutlineCalendar size={22} />,    visible: canAccessLaborLog() },

        // Admin tools — visible only for users with estimation admin role.
        { title: 'Data Management',  link: '/datamanagement',   icon: <HiOutlineCog size={22} />,         visible: canAccessDataManagement() },
        { title: 'Admin',            link: '/admin',            icon: <HiOutlineUsers size={22} />,       visible: canAccessAdmin() },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen h-full flex flex-col p-4 sticky top-0">
            <div className="flex justify-center mb-12">
                <Link href="/" className="flex justify-center items-center">
                    <img src="/logos/Viganovatech.png" alt="ViGaNovaTech Logo" className="h-40" />
                </Link>
            </div>
            <nav className="flex-1">
                <ul>
                    {navLinks.filter((item) => item.visible).map((item, index) => {
                        const accessible = item.accessible !== false;
                        const linkContent = (
                            <div className={`flex items-center p-2 rounded-lg ${
                                accessible
                                    ? 'hover:bg-gray-700 cursor-pointer'
                                    : 'text-gray-500 cursor-not-allowed'
                            }`}>
                                {item.icon}
                                <span className="ml-3">{item.title}</span>
                            </div>
                        );

                        return (
                            <li key={index} className={`mb-2 ${item.sub ? 'pl-4' : ''}`}>
                                {accessible ? (
                                    <Link href={item.link}>
                                        {linkContent}
                                    </Link>
                                ) : (
                                    <div title={item.accessibleTooltip || 'Access Required'}>
                                        {linkContent}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* @branch feature/schedulesprototype — Role/view switcher */}
            <div className="pt-4 border-t border-gray-700">
                <RoleViewSwitcher />
            </div>

            {/* Version */}
            <div className="mt-2">
                <div className="text-xs text-gray-500 text-center">
                    Beta v 1.13
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
