// src/app/page.js (or page.tsx if using TypeScript)
'use client';
import '../src/app/globals.css'; // ✅ correct

import Globe from "@/app/component/livemap";



export default function Weather() {
  return (
    <div className="w-full h-screen">
      
     <Globe></Globe> 
    </div>
  );
}
