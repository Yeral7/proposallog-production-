'use client';

import React from 'react';
import Link from 'next/link';
import { 
    HiOutlineViewGrid, 
    HiOutlineClipboardList, 
    HiOutlineUsers, 
    HiOutlineCog, 
    HiOutlineChartBar, 
    HiOutlineHome 
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const { canAccessAdmin, canAccessDataManagement } = useAuth();

    const navLinks = [
        { title: "Commercial", link: "/commercial", icon: <HiOutlineViewGrid size={22} /> },
        { title: "Proposal Log", link: "/proposal-log", icon: <HiOutlineViewGrid size={22} />, sub: true },
        { title: "Projects Ongoing", link: "/projects-ongoing", icon: <HiOutlineClipboardList size={22} />, sub: true },
        { title: "Residential", link: "/residential-log", icon: <HiOutlineHome size={22} /> },
        { title: "Analytics", link: "/analytics", icon: <HiOutlineChartBar size={22} /> },
        { title: "Data Management", link: "/datamanagement", icon: <HiOutlineCog size={22} />, admin: true },
        { title: "Admin", link: "/admin", icon: <HiOutlineUsers size={22} />, admin: true },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen h-full flex flex-col p-4 sticky top-0">
            <div className="flex justify-center mb-12">
                <Link href="/" className="flex justify-center items-center">
                    <img src="/logos/Viganovatech.png" alt="ViGaNovaTech Logo" className="h-40" />
                </Link>
            </div>
            <nav>
                <ul>
                    {navLinks.map((item, index) => {
                                                const isDataManagement = item.title === 'Data Management';
                        const isAdmin = item.title === 'Admin';

                        let hasAccess = true;
                        if (isDataManagement) {
                            hasAccess = canAccessDataManagement();
                        } else if (isAdmin) {
                            hasAccess = canAccessAdmin();
                        }

                        const linkContent = (
                            <div className={`flex items-center p-2 rounded-lg ${
                                hasAccess 
                                    ? 'hover:bg-gray-700 cursor-pointer'
                                    : 'text-gray-500 cursor-not-allowed'
                            }`}>
                                {item.icon}
                                <span className="ml-3">{item.title}</span>
                            </div>
                        );

                        return (
                            <li key={index} className={`mb-2 ${item.sub ? 'pl-4' : ''}`}>
                                {hasAccess ? (
                                    <Link href={item.link}>
                                        {linkContent}
                                    </Link>
                                ) : (
                                    <div title="Admin Access Required">
                                        {linkContent}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
            {/* Version Only */}
            <div className="mt-auto pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-500 text-center">
                    Beta v 1.05
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
