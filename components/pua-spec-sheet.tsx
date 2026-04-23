import React from 'react';
import Link from 'next/link';

interface PuaSpecSheetProps {
    data: {
        roleId: string;
        roleTitle: string;
        version: string;
        issued: string;
        location: string;
        description: string;
        sellingPoints: string[];
        owns: string[];
        metrics: { value: string; label: string }[];
        antiGoals: string[];
        themeColor: string;
        themeText: string;
        antiGoalColor: string;
        applyUrl: string;
    };
}

export function PuaSpecSheet({ data }: PuaSpecSheetProps) {
    return (
        <div className="min-h-screen bg-white text-[#0F0F0F] font-sans selection:bg-[#00E5FF] selection:text-[#0F0F0F] flex flex-col md:flex-row relative">

            {/* Left Side: Sticky massive typography */}
            <div className="w-full md:w-1/2 md:sticky md:top-0 md:h-screen p-8 md:p-16 flex flex-col justify-between border-b-[3px] md:border-b-0 md:border-r-[3px] border-[#0F0F0F]" style={{ backgroundColor: data.themeColor }}>
                <div className="absolute inset-0 bg-[radial-gradient(#0F0F0F_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" aria-hidden="true"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-12">
                        <Link href="/recruitment">
                            <button
                                className="border-[3px] border-[#0F0F0F] bg-white text-[#0F0F0F] px-4 py-2 font-black uppercase tracking-widest text-sm hover:bg-[#00E5FF] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0F0F0F] active:translate-y-0 active:shadow-none transition-all focus-visible:ring-4 focus-visible:ring-black focus-visible:outline-none"
                                aria-label="Go back to recruitment page"
                            >
                                &lt; Back
                            </button>
                        </Link>
                        <span className="font-bold font-mono bg-white border-[3px] border-[#0F0F0F] px-3 py-1">
                            {data.roleId}
                        </span>
                    </div>

                    <h1
                        className="text-6xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] drop-shadow-[4px_4px_0px_#00E5FF]"
                        style={{ fontFamily: 'Fredoka One, sans-serif', color: data.themeText }}
                    >
                        {data.roleTitle}
                    </h1>
                </div>

                <div className="relative z-10 mt-12 md:mt-0 space-y-4">
                    <p className="text-xl md:text-2xl font-bold font-mono bg-white border-[3px] border-[#0F0F0F] p-4 shadow-[8px_8px_0px_#0F0F0F]">
                        {data.description}
                    </p>
                    <div className="flex gap-4 font-mono text-sm bg-[#0F0F0F] text-white p-4 font-bold border-[3px] border-[#0F0F0F]">
                        <span>V:{data.version}</span>
                        <span>|</span>
                        <span>{data.issued}</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Scrollable masonry grid */}
            <main className="w-full md:w-1/2 p-8 md:p-16 bg-[#FFF4E0]">
                <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">

                    {/* Selling Points */}
                    <section
                        className="bg-white border-[3px] border-[#0F0F0F] p-8 shadow-[12px_12px_0px_#0F0F0F] relative"
                        aria-labelledby="selling-points-heading"
                    >
                        <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -top-1 -left-1" aria-hidden="true"></div>
                        <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -bottom-1 -right-1" aria-hidden="true"></div>
                        
                        <h2 id="selling-points-heading" className="text-3xl font-black uppercase mb-6 border-b-[3px] border-[#0F0F0F] pb-2" style={{ fontFamily: 'Fredoka One, sans-serif' }}>
                            Selling Points
                        </h2>
                        <ul className="space-y-4 font-mono font-bold">
                            {data.sellingPoints.map((point, idx) => (
                                <li key={idx} className="flex gap-4 items-start">
                                    <span className="shrink-0 bg-[#0F0F0F] text-white px-2 py-1 leading-none mt-1">0{idx + 1}</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Owns */}
                    <section
                        className="border-[3px] border-[#0F0F0F] p-8 shadow-[12px_12px_0px_#0F0F0F] relative"
                        style={{ backgroundColor: data.themeColor, color: data.themeText }}
                        aria-labelledby="owns-heading"
                    >
                        <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -top-1 -right-1" aria-hidden="true"></div>
                        <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -bottom-1 -left-1" aria-hidden="true"></div>
                        
                        <h2 id="owns-heading" className="text-3xl font-black uppercase mb-6 border-b-[3px] border-[#0F0F0F] pb-2" style={{ fontFamily: 'Fredoka One, sans-serif' }}>
                            Owns
                        </h2>
                        <ul className="space-y-3 font-mono font-bold">
                            {data.owns.map((item, idx) => (
                                <li key={idx} className="flex gap-2 items-start">
                                    <span className="shrink-0 font-black">&gt;</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Grid for Metrics and Anti-goals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Metrics */}
                        <section
                            className="bg-white border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_#0F0F0F]"
                            aria-labelledby="metrics-heading"
                        >
                            <h2 id="metrics-heading" className="text-2xl font-black uppercase mb-6 border-b-[3px] border-[#0F0F0F] pb-2" style={{ fontFamily: 'Fredoka One, sans-serif' }}>
                                Metrics
                            </h2>
                            <div className="space-y-6">
                                {data.metrics.map((metric, idx) => (
                                    <div key={idx}>
                                        <div className="text-4xl font-black mb-1" style={{ fontFamily: 'Fredoka One, sans-serif', color: data.themeColor }}>
                                            {metric.value}
                                        </div>
                                        <div className="font-mono text-sm font-bold uppercase">
                                            {metric.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Anti-goals */}
                        <section
                            className="border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_#0F0F0F] text-white"
                            style={{ backgroundColor: data.antiGoalColor }}
                            aria-labelledby="antigoals-heading"
                        >
                            <h2 id="antigoals-heading" className="text-2xl font-black uppercase mb-6 border-b-[3px] border-white pb-2" style={{ fontFamily: 'Fredoka One, sans-serif' }}>
                                Anti-goals
                            </h2>
                            <ul className="space-y-4 font-mono font-bold text-sm">
                                {data.antiGoals.map((antiGoal, idx) => (
                                    <li key={idx} className="flex gap-2 items-start">
                                        <span className="shrink-0 text-[#0F0F0F]">✗</span>
                                        <span>{antiGoal}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Application CTA */}
                    <section className="mt-8">
                        <a
                            href={data.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                            aria-label={`Apply for the ${data.roleTitle} position`}
                        >
                            <button
                                className="w-full bg-[#FF0055] text-white py-6 border-[3px] border-[#0F0F0F] shadow-[12px_12px_0px_#0F0F0F] text-2xl font-black uppercase tracking-widest hover:bg-[#00E5FF] hover:text-[#0F0F0F] active:translate-x-[8px] active:translate-y-[8px] active:shadow-[4px_4px_0px_#0F0F0F] transition-all focus-visible:ring-4 focus-visible:ring-black focus-visible:outline-none"
                                style={{ fontFamily: 'Fredoka One, sans-serif' }}
                                tabIndex={-1}
                            >
                                Initiate Protocol
                            </button>
                        </a>
                    </section>
                </div>
            </main>
        </div>
    );
}
