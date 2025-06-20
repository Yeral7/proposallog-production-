import React from 'react';
import Link from 'next/link';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineCollection, HiOutlineUsers } from 'react-icons/hi';

const linksList = [
    { title: "Proposal Log", link: "/proposal-log", icon: <HiOutlineViewGrid size={22} /> },
    { title: "Projects Ongoing", link: "/projects-ongoing", icon: <HiOutlineClipboardList size={22} /> },
    { title: "SOV", link: "/sov", icon: <HiOutlineCollection size={22} /> },
    { title: "SOV Meetings", link: "/sov-meetings", icon: <HiOutlineUsers size={22} /> },
];

const Sidebar = () => {
    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col p-4">
            <div className="text-2xl font-bold mb-10">
                <Link href="/">Cicada CR</Link>
            </div>
            <nav>
                <ul>
                    {linksList.map((item, index) => (
                        <li key={index} className="mb-4">
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
