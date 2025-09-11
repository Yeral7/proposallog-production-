"use client";

import React from "react";
import Link from "next/link";
import { HiOutlineUser, HiOutlineLogout, HiOutlineBell } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-[var(--header-gray)] text-white p-4 shadow-sm">
      <div className="max-w-full mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">ViganovaTech</h1>
        
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="bg-gray-700 px-4 py-1.5 rounded-md flex items-center min-w-[150px]">
                <div className="mr-2">
                  <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-gray-800 text-xs font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">{user.name || user.email}</span>
                  <span className="text-xs text-gray-300 capitalize">{user.role}</span>
                </div>
              </div>
              <button
                className="p-2 rounded-full hover:bg-gray-700 transition-colors relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <HiOutlineBell size={20} />
                {/* Simple unread indicator dot (placeholder) */}
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                title="Logout"
              >
                <HiOutlineLogout size={20} />
              </button>
            </>
          ) : (
            <>
              <div className="bg-gray-700 px-4 py-1.5 rounded-md flex items-center min-w-[150px]">
                <div className="mr-2">
                  <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-gray-800 text-xs font-bold">
                    G
                  </div>
                </div>
                <span className="text-sm font-medium">Guest</span>
              </div>
              <Link 
                href="/login" 
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                title="Login"
              >
                <HiOutlineUser size={20} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
