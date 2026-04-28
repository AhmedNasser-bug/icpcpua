import Link from 'next/link';
import { EcosystemGraph } from '@/components/EcosystemGraph';
import { Footer } from '@/components/footer';
import { PuaNavbar } from '@/components/pua-navbar';

export default function RecruitmentLandingPage() {
    return (
        <div className="bg-[#FFF4E0] font-sans text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F] min-h-screen">
            <PuaNavbar />

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative overflow-x-hidden">
                {/* Hero Section */}
                <section className="mb-24 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#0F0F0F_1px,transparent_1px)] [background-size:24px_24px] opacity-10 -z-10"></div>
                    <div className="border-[3px] border-[#0F0F0F] p-8 bg-white shadow-[12px_12px_0px_0px_#0F0F0F] relative">
                        {/* Corner Nodes */}
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -right-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        
                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black uppercase leading-[0.85] tracking-tighter text-[#0F0F0F] drop-shadow-[6px_6px_0px_#FF0055]" style={{fontFamily: 'Fredoka One, sans-serif'}}>
                            JOIN THE<br/>OPERATIONS
                        </h1>
                        <div className="mt-8 flex flex-col md:flex-row gap-6 items-end justify-between">
                            <p className="max-w-xl text-xl md:text-2xl font-bold uppercase leading-tight italic" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                                The ICPC PUA technical corps is expanding. We don't hire employees. We recruit systems-architects who thrive in chaos. No soft code. No weak logic.
                            </p>
                            <div className="bg-[#FF0055] text-white px-4 py-2 border-[3px] border-[#0F0F0F] font-black text-xl flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                OPEN_TRANSMISSION_04
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mb-24">
                  <h2 className="text-4xl font-black uppercase mb-6" style={{fontFamily: 'Fredoka One, sans-serif'}}>Ecosystem Intelligence</h2>
                  <EcosystemGraph />
                </div>

                {/* Roles Grid */}
                <section id="roles" className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Card 1: The Instructor */}
                    <div className="group relative bg-[#FFD500] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F]">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>The Instructor</h2>
                            <span className="bg-[#0F0F0F] text-white px-3 py-1 text-sm font-black">LVL_01</span>
                        </div>
                        <div className="space-y-6 mb-8" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                            <div>
                                <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Selling Points</span>
                                <p className="font-bold border-l-[3px] border-[#0F0F0F] pl-3 leading-tight">Mastery over data structures. Ability to debug under pressure. Command presence.</p>
                            </div>
                            <div>
                                <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Owns</span>
                                <ul className="font-bold list-none space-y-1">
                                    <li>&gt; Problem Set Architecture</li>
                                    <li>&gt; Training Simulations</li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Metrics</span>
                                    <p className="font-bold">99% Runtime Optimization</p>
                                </div>
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#FF0055] text-white w-fit px-2 mb-2 italic tracking-widest">Anti-goals</span>
                                    <p className="font-bold">Manual Grading</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/recruitment/specs/instructor" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                                View Instructor Spec Sheet
                            </Link>
                    </div>

                    {/* Card 2: Operations & PR */}
                    <div className="group relative bg-[#00E5FF] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F]">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>Operations &amp; PR</h2>
                            <span className="bg-[#0F0F0F] text-white px-3 py-1 text-sm font-black">LVL_02</span>
                        </div>
                        <div className="space-y-6 mb-8" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                            <div>
                                <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Selling Points</span>
                                <p className="font-bold border-l-[3px] border-[#0F0F0F] pl-3 leading-tight">Brand domination. Logistics surgical precision. Social engineering.</p>
                            </div>
                            <div>
                                <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Owns</span>
                                <ul className="font-bold list-none space-y-1">
                                    <li>&gt; External Comms Arrays</li>
                                    <li>&gt; Event Staging</li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Metrics</span>
                                    <p className="font-bold">Engagement Velocity</p>
                                </div>
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#FF0055] text-white w-fit px-2 mb-2 italic tracking-widest">Anti-goals</span>
                                    <p className="font-bold">Standard Templates</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/recruitment/specs/ops-pr" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                                View PR Spec Sheet
                            </Link>
                    </div>

                    {/* Card 3: HR / Monitoring */}
                    <div className="group relative bg-[#7B2CBF] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F] text-white">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>HR / Monitoring</h2>
                            <span className="bg-white text-[#0F0F0F] px-3 py-1 text-sm font-black">LVL_03</span>
                        </div>
                        <div className="space-y-6 mb-8" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                            <div>
                                <span className="block font-black text-sm uppercase bg-white text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Selling Points</span>
                                <p className="font-bold border-l-[3px] border-white pl-3 leading-tight">Human behavioral analysis. Conflict resolution protocol. Performance auditing.</p>
                            </div>
                            <div>
                                <span className="block font-black text-sm uppercase bg-white text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Owns</span>
                                <ul className="font-bold list-none space-y-1 text-white/90">
                                    <li>&gt; Member Integrity Audits</li>
                                    <li>&gt; Onboarding Pipeline</li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-black text-sm uppercase bg-white text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Metrics</span>
                                    <p className="font-bold">Retention Stability</p>
                                </div>
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#00E5FF] text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Anti-goals</span>
                                    <p className="font-bold">Paperwork Loops</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/recruitment/specs/hr" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                                View HR Spec Sheet
                            </Link>
                    </div>

                    {/* Card 4: Design / Dev */}
                    <div className="group relative bg-[#FF0055] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F] text-white">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>Design / Dev</h2>
                            <span className="bg-white text-[#0F0F0F] px-3 py-1 text-sm font-black">LVL_04</span>
                        </div>
                        <div className="space-y-6 mb-8" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                            <div>
                                <span className="block font-black text-sm uppercase bg-white text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Selling Points</span>
                                <p className="font-bold border-l-[3px] border-white pl-3 leading-tight">Visual violence. Pixel-perfect brutality. Frontend engineering at 200ms.</p>
                            </div>
                            <div>
                                <span className="block font-black text-sm uppercase bg-white text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Owns</span>
                                <ul className="font-bold list-none space-y-1 text-white/90">
                                    <li>&gt; Design System Blueprint</li>
                                    <li>&gt; Full-Stack Deployment</li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-black text-sm uppercase bg-white text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Metrics</span>
                                    <p className="font-bold">System Aesthetic Score</p>
                                </div>
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#FFD500] text-[#0F0F0F] w-fit px-2 mb-2 italic tracking-widest">Anti-goals</span>
                                    <p className="font-bold">Soft Shadows</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/recruitment/specs/design-dev" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                                View Dev Spec Sheet
                            </Link>
                    </div>
                </section>

                {/* Marquee Component */}
                <div className="mt-24 bg-[#0F0F0F] overflow-hidden whitespace-nowrap py-4 -rotate-1 border-y-[3px] border-[#FF0055]">
                    <div className="inline-block text-white text-4xl font-black uppercase tracking-widest mr-8" style={{fontFamily: 'Fredoka One, sans-serif'}}>
                        NO SOFT CODE ALLOWED // SYSTEM OVERRIDE ACTIVE // RECRUITMENT OPEN // NO SOFT CODE ALLOWED // SYSTEM OVERRIDE ACTIVE // RECRUITMENT OPEN //
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
