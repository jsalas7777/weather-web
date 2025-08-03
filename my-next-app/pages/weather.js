// src/app/page.js (or page.tsx if using TypeScript)
'use client';
import Region from '@/app/component/region';
import '../src/app/globals.css'; // ✅ correct





export default function Weather() {
  return (
    <div className="w-full h-screen">
      
     <Region></Region> 
    </div>
  );
}
