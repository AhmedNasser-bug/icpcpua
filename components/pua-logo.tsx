import React from "react";

export function PuaLogo({ className = "", size = 400 }: { className?: string, size?: number }) {
  const scale = size / 400;

  return (
    <div 
      className={`relative isolate ${className}`} 
      style={{ width: size, height: size }}
    >
      <div 
        style={{ 
          width: 400, 
          height: 400, 
          transform: `scale(${scale})`, 
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        className="bg-[#FFF4E0] border-[4px] border-black rounded-xl relative overflow-hidden flex items-center justify-center aspect-square"
      >
        {/* Comic Book / Vector Art Style Lighthouse Logo Construction */}
        <div className="relative w-full h-full max-w-md max-h-md flex items-center justify-center">
          {/* Background Rays */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 400">
              {/* Cyan Rays */}
              <path className="opacity-80" d="M 200 200 L -50 50 Z" fill="none" stroke="#00FFFF" strokeLinecap="round" strokeWidth="24"></path>
              <path className="opacity-80" d="M 200 200 L 450 50 Z" fill="none" stroke="#00FFFF" strokeLinecap="round" strokeWidth="24"></path>
              
              {/* Yellow Rays */}
              <path className="opacity-90" d="M 200 200 L 0 200 Z" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="20"></path>
              <path className="opacity-90" d="M 200 200 L 400 200 Z" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="20"></path>
              <path className="opacity-90" d="M 200 200 L 100 -50 Z" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="28"></path>
              <path className="opacity-90" d="M 200 200 L 300 -50 Z" fill="none" stroke="#FFD500" strokeLinecap="round" strokeWidth="28"></path>
              
              {/* Black outline for rays to match comic style */}
              <path d="M 200 200 L -50 50" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M 200 200 L 450 50" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M 200 200 L 0 200" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M 200 200 L 400 200" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M 200 200 L 100 -50" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M 200 200 L 300 -50" fill="none" stroke="#000" strokeLinecap="round" strokeWidth="4"></path>
            </svg>
          </div>
          
          {/* The Lighthouse (Pharos) */}
          <div className="absolute z-10 w-48 h-80 flex flex-col items-center justify-end scale-90">
            {/* Light Source / Lantern Room */}
            <div className="w-24 h-24 bg-[#FFD500] border-[4px] border-black rounded-full absolute top-0 z-20 flex items-center justify-center relative shadow-[-6px_6px_0px_rgba(0,0,0,0.2)]">
              <div className="w-12 h-12 bg-white rounded-full opacity-60 mix-blend-overlay"></div>
              <div className="w-4 h-4 bg-white rounded-full absolute top-4 left-4"></div>
            </div>
            {/* Gallery Deck */}
            <div className="w-32 h-6 bg-[#7B2CBF] border-[4px] border-black absolute top-20 z-10 rounded-sm"></div>
            {/* Tower Body */}
            <div className="w-32 h-56 bg-[#7B2CBF] border-[4px] border-black border-t-0 flex flex-col relative overflow-hidden" style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)" }}>
              {/* Stippled Shading / Pattern (Simulated with SVG) */}
              <svg className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" height="100%" width="100%">
                <defs>
                  <pattern height="8" id="stipple" patternUnits="userSpaceOnUse" width="8">
                    <circle cx="2" cy="2" fill="#000" r="1.5"></circle>
                    <circle cx="6" cy="6" fill="#000" r="1"></circle>
                  </pattern>
                </defs>
                {/* Shade left side */}
                <rect fill="url(#stipple)" height="100%" width="50%" x="0" y="0"></rect>
              </svg>
              {/* Tower Stripes / Details */}
              <div className="w-full h-8 bg-[#FFF4E0] border-y-[4px] border-black mt-8"></div>
              <div className="w-full h-8 bg-[#FFF4E0] border-y-[4px] border-black mt-12"></div>
              {/* Door */}
              <div className="w-10 h-16 bg-black border-[4px] border-black absolute bottom-0 left-1/2 transform -translate-x-1/2 rounded-t-full"></div>
            </div>
            {/* Base */}
            <div className="w-40 h-8 bg-[#7B2CBF] border-[4px] border-black rounded-md relative shadow-[-4px_4px_0px_rgba(0,0,0,0.5)]"></div>
          </div>
          
          {/* Decorative Algorithmic Elements */}
          {/* Purple Vector Nodes */}
          <div className="absolute top-[20%] left-[15%] w-6 h-6 bg-[#7B2CBF] border-[3px] border-black transform rotate-12 shadow-[2px_2px_0px_#000]"></div>
          <div className="absolute bottom-[25%] right-[15%] w-8 h-8 bg-[#7B2CBF] border-[3px] border-black transform -rotate-6 shadow-[3px_3px_0px_#000]"></div>
          <div className="absolute top-[40%] right-[10%] w-5 h-5 bg-[#7B2CBF] border-[3px] border-black transform rotate-45 shadow-[2px_2px_0px_#000]"></div>
          <div className="absolute bottom-[10%] left-[25%] w-7 h-7 bg-[#7B2CBF] border-[3px] border-black transform rotate-3 shadow-[3px_3px_0px_#000]"></div>
          {/* Algorithmic Brackets { } */}
          <div className="absolute top-[25%] right-[20%] text-black text-6xl font-bold opacity-80" style={{ fontFamily: "'Courier New', Courier, monospace", textShadow: "2px 2px 0px #00FFFF" }}>{`}`}</div>
          <div className="absolute bottom-[30%] left-[10%] text-black text-7xl font-bold opacity-80" style={{ fontFamily: "'Courier New', Courier, monospace", textShadow: "-2px 2px 0px #FFD500" }}>{`{`}</div>
          <div className="absolute top-[60%] left-[20%] text-black text-4xl font-bold opacity-80 transform -rotate-12" style={{ fontFamily: "'Courier New', Courier, monospace", textShadow: "2px 2px 0px #00FFFF" }}>;</div>
        </div>
      </div>
    </div>
  );
}
