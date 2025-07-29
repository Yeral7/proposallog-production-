import React from 'react';
import Link from 'next/link';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineCollection, HiOutlineUsers, HiOutlineCog, HiOutlineChartBar, HiOutlineCash, HiOutlineHome } from 'react-icons/hi';

const linksList = [
    { title: "Proposal Log", link: "/proposal-log", icon: <HiOutlineViewGrid size={22} /> },
    { title: "Projects Ongoing", link: "/projects-ongoing", icon: <HiOutlineClipboardList size={22} />, sub: true },
    { title: "Residential Log", link: "/residential-log", icon: <HiOutlineHome size={22} /> },
    { title: "Pricing", link: "/pricing", icon: <HiOutlineCash size={22} /> },
    { title: "Analytics", link: "/analytics", icon: <HiOutlineChartBar size={22} /> },
    { title: "Admin", link: "/admin", icon: <HiOutlineCog size={22} /> },
];

const Sidebar = () => {
    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen h-full flex flex-col p-4 sticky top-0">
            <div className="flex justify-center mb-12">
                <Link href="/" className="flex justify-center items-center">
                    <img src="/logos/Viganovatech.png" alt="ViGaNovaTech Logo" className="h-40" />
                </Link>
            </div>
            <nav>
                <ul>
                    {linksList.map((item, index) => (
                        <li key={index} className={`mb-4 ${item.sub ? 'pl-4' : ''}`}>
                            <Link href={item.link}>
                                <div className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                                    {item.icon}
                                    <span className="ml-3">{item.title}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
