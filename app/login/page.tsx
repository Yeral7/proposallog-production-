"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { IoMailOutline, IoLockClosedOutline } from "react-icons/io5";
import { LuEyeClosed } from "react-icons/lu";
import { MdOutlineRemoveRedEye } from "react-icons/md";

// Input Field Component (matching reference)
const InputField = ({ 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  Icon, 
  RightIcon,
  onClick 
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  Icon: React.ComponentType<any>;
  RightIcon?: React.ComponentType<any>;
  onClick?: () => void;
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
        required
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {RightIcon && onClick && (
          <button
            type="button"
            onClick={onClick}
            className="focus:outline-none"
          >
            <RightIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to homepage
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Simple login validation
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please fill all the fields");
      setLoading(false);
      return;
    }

    try {
      const success = await login(trimmedEmail, trimmedPassword);
      if (success) {
        // Redirect to dashboard after successful login
        router.push("/");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logos/Viganovatech.png" alt="ViGaNovaTech Logo" className="h-20" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">VigaNovaTech</h1>
          <p className="text-gray-600 mt-2">Pre-Construction Management System</p>
          <p className="text-sm text-gray-500 mt-1">Login to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <InputField 
            label="Email Address" 
            type="email" 
            placeholder="you@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            Icon={IoMailOutline} 
          />

          <InputField 
            label="Password" 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            Icon={IoLockClosedOutline}
            RightIcon={showPassword ? MdOutlineRemoveRedEye : LuEyeClosed} 
            onClick={() => setShowPassword(prev => !prev)} 
          />



          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
