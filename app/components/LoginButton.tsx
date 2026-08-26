"use client";

import { useState } from "react";
import LoginModal from "./LoginModal";

export default function LoginButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        Login
      </button>
      
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
