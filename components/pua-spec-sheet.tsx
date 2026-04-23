import Link from 'next/link';
import { Footer } from '@/components/footer';

export interface SpecSheetProps {
    roleId: string;
    roleTitle: string;
    version: string;
    issued: string;
    location: string;
    description: string;
    sellingPoints: string[];
    owns: string[];
    metrics: { value: string, label: string }[];
    antiGoals: string[];
    themeColor: string;
    themeText: string;
    antiGoalColor: string;
    applyUrl: string;
}

export function PuaSpecSheet({ data }: { data: SpecSheetProps }) {
    return (
        <div className="bg-[#FFF4E0] font-sans text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F] min-h-screen flex flex-col">
            {/* TopAppBar */}
            <header className="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 bg-[#FFF4E0] border-b-[3px] border-black shadow-[8px_8px_0px_0px_#0F0F0F]">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl font-variation-settings-fill-1" style={{ color: data.themeColor }}>terminal</span>
                    <h1 className="uppercase font-black tracking-tighter text-2xl text-black" style={{fontFamily: 'Space Grotesk, sans-serif'}}>{data.roleId}</h1>
                </div>
                <div className="hidden md:flex gap-8 items-center" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                    <Link className="text-sm font-bold uppercase tracking-widest text-black underline decoration-[3px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" href="/recruitment">MANIFESTO</Link>
                    <Link className="text-sm font-bold uppercase tracking-widest text-[#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" href="/recruitment#roles">ROLES</Link>
                    <Link className="text-sm font-bold uppercase tracking-widest text-[#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all" href="#">NETWORK</Link>
                </div>
                <button className="uppercase font-bold tracking-tighter px-4 py-1 border-[3px] border-black shadow-[4px_4px_0px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]" style={{ backgroundColor: data.themeColor, color: data.themeText, fontFamily: 'Space Grotesk, sans-serif' }}>
                    DOWNLOAD.PDF
                </button>
            </header>

            <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 md:py-20 relative overflow-x-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#0F0F0F_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
                
                {/* Hero Section */}
                <section className="mb-20 relative">
                    <div className="flex flex-col gap-2">
                        <div className="inline-block self-start px-3 py-1 border-[3px] border-black mb-4" style={{ backgroundColor: data.themeColor, color: data.themeText }}>
                            <span className="font-black uppercase tracking-[0.2em] text-sm" style={{fontFamily: 'Space Grotesk, sans-serif'}}>OPERATIONAL_PROTOCOL_ALPHA</span>
                        </div>
                        <h2 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter uppercase mb-6 drop-shadow-[6px_6px_0px_#0F0F0F]" style={{fontFamily: 'Fredoka One, sans-serif', color: data.themeColor}}>
                            {data.roleTitle}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                            <p className="text-xl md:text-2xl font-bold leading-tight max-w-xl">
                                {data.description}
                            </p>
                            <div className="flex flex-col md:items-end font-mono text-sm border-l-4 md:border-l-0 md:border-r-4 border-black px-4">
                                <span>VERSION: {data.version}</span>
                                <span>ISSUED: {data.issued}</span>
                                <span>LOCATION: {data.location}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The One-Page Contract Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                    {/* Selling Points */}
                    <div className="relative bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#0F0F0F]">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -right-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -right-[6px]"></div>
                        
                        <h3 className="text-3xl font-black uppercase mb-8 border-b-[3px] border-black pb-2 flex items-center gap-3">
                            <span className="material-symbols-outlined font-variation-settings-fill-1" style={{color: data.themeColor}}>star</span>
                            Selling Points
                        </h3>
                        <ul className="space-y-6">
                            {data.sellingPoints.map((point, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <span className="font-black text-2xl">0{idx + 1}</span>
                                    <p className="text-lg font-bold border-l-[3px] border-black pl-3">{point}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Owns */}
                    <div className="relative border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#0F0F0F]" style={{backgroundColor: data.themeColor, color: data.themeText}}>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -right-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -right-[6px]"></div>
                        
                        <h3 className="text-3xl font-black uppercase mb-8 border-b-[3px] border-black pb-2 flex items-center gap-3">
                            <span className="material-symbols-outlined font-variation-settings-fill-1">shield</span>
                            Owns
                        </h3>
                        <ul className="space-y-4 font-bold text-lg">
                            {data.owns.map((item, idx) => (
                                <li key={idx} className="border-b-2 border-black/20 pb-2">&gt; {item}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Metrics */}
                    <div className="relative bg-[#E0D8C8] border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#0F0F0F]">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -right-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -right-[6px]"></div>
                        
                        <h3 className="text-3xl font-black uppercase mb-8 border-b-[3px] border-black pb-2 flex items-center gap-3">
                            <span className="material-symbols-outlined font-variation-settings-fill-1">query_stats</span>
                            Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.metrics.map((metric, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-4xl font-black" style={{fontFamily: 'Fredoka One, sans-serif', color: data.themeColor}}>{metric.value}</span>
                                    <span className="uppercase text-sm font-black tracking-widest border-t-2 border-black w-fit pt-1 mt-1">{metric.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Anti-goals */}
                    <div className="relative border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#0F0F0F]" style={{backgroundColor: data.antiGoalColor, color: '#FFF'}}>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -top-[6px] -right-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-black z-10 -bottom-[6px] -right-[6px]"></div>
                        
                        <h3 className="text-3xl font-black uppercase mb-8 border-b-[3px] border-black pb-2 flex items-center gap-3">
                            <span className="material-symbols-outlined">block</span>
                            Anti-goals
                        </h3>
                        <ul className="space-y-4 font-bold text-lg">
                            {data.antiGoals.map((antiGoal, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="material-symbols-outlined shrink-0 text-white font-variation-settings-fill-1">close</span>
                                    {antiGoal}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Massive CTA */}
                <section className="flex flex-col items-center justify-center gap-8 mb-20 mt-24">
                    <p className="text-center text-xl font-black uppercase max-w-2xl border-y-[3px] border-black py-4">
                        THIS IS A DIRECTIVE. IF YOU POSSESS THE NECESSARY TECHNICAL RIGOR AND DESIGN BRUTALISM, INITIATE PROTOCOL IMMEDIATELY.
                    </p>
                    <a className="group relative w-full max-w-4xl" href={data.applyUrl} target="_blank" rel="noopener noreferrer">
                        <div className="absolute inset-0 bg-black translate-x-4 translate-y-4 border-[3px] border-black"></div>
                        <div className="relative border-[3px] border-black p-10 flex items-center justify-center gap-6 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-4 group-active:translate-y-4 transition-all" style={{backgroundColor: data.themeColor, color: data.themeText}}>
                            <span className="material-symbols-outlined text-5xl md:text-7xl font-bold font-variation-settings-fill-1">description</span>
                            <span className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter" style={{fontFamily: 'Fredoka One, sans-serif'}}>Apply via Google Forms</span>
                        </div>
                    </a>
                </section>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
