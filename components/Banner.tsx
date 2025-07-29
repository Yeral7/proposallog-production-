import React from "react";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

const Banner: React.FC<PageHeaderProps> = (props) => {
  return (
    <div
      className="relative w-full h-48 bg-cover bg-center flex items-center rounded-b-xl overflow-hidden shadow-lg"
      style={{ 
        backgroundImage: "url('/banner.jpg')",
        backgroundColor: "var(--accent-color)" 
      }}
    >
      {/* Overlay for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>

      {/* Logo inside the banner */}
      <div className="relative z-10 text-white p-6">
        <h1 className="text-5xl font-bold flex items-center gap-3">
          {props.icon}
          {props.title}
        </h1>
      </div>
    </div>
  );
};

export default Banner;
