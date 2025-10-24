import React from "react";

const Header = () => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md">
    <div className="container mx-auto flex items-center justify-between whitespace-nowrap px-4 py-4 lg:px-10">
      <a className="flex items-center gap-3 text-[#141414]" href="#">
        <svg className="h-8 w-8 text-indigo-600" fill="currentColor" viewBox="0 0 48 48">
          <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" />
        </svg>
        <h2 className="text-xl font-bold tracking-tighter">WorkBee</h2>
      </a>
      <nav className="hidden md:flex items-center gap-8">
        <a className="text-sm font-medium text-gray-600 hover:text-[#141414] transition-colors" href="#">Find Workers</a>
        <a className="text-sm font-medium text-gray-600 hover:text-[#141414] transition-colors" href="#">Become a Worker</a>
        <a className="text-sm font-medium text-gray-600 hover:text-[#141414] transition-colors" href="#">About Us</a>
        <a className="text-sm font-medium text-gray-600 hover:text-[#141414] transition-colors" href="#">Contact</a>
      </nav>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-md bg-gray-100 text-[#141414] text-sm font-semibold hover:bg-gray-200">User Login</button>
          <button className="h-10 px-4 rounded-md bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">User Sign Up</button>
        </div>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-md bg-gray-100 text-[#141414] text-sm font-semibold hover:bg-gray-200">Worker Login</button>
          <button className="h-10 px-4 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Worker Sign Up</button>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
