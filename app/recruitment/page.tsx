import Link from 'next/link';
import { PuaNavbar } from '@/components/pua-navbar';
import { Marquee } from '@/components/pua-marquee';
import { Footer } from '@/components/footer';
import { EcosystemGraph } from '@/components/EcosystemGraph';
import { Role3DCanvas } from '@/components/recruitment/Role3DCanvas';

export default function RecruitmentLandingPage() {
    return (
        <div className="bg-[#FFF4E0] text-[#0F0F0F] min-h-screen flex flex-col justify-between selection:bg-[#00E5FF] selection:text-[#0F0F0F]">
            {/* Unified Site Navbar */}
            <PuaNavbar />

            {/* Quick Context Sub-Bar */}
            <div className="w-full bg-white border-b-[3px] border-[#0F0F0F] px-6 py-2.5 shadow-[4px_4px_0px_#0F0F0F]">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-[#FF0055] inline-block animate-pulse" />
                        <span className="text-[#0F0F0F]">RECRUITMENT.CORPS // 2026-2027</span>
                    </div>
                    <div className="hidden sm:flex gap-6 items-center">
                        <Link href="/recruitment" className="hover:text-[#7B2CBF] underline decoration-2">MANIFESTO</Link>
                        <Link href="#roles" className="hover:text-[#7B2CBF]">ROLES</Link>
                        <Link href="/referrals" className="hover:text-[#7B2CBF]">BOUNTIES</Link>
                    </div>
                    <Link href="#roles" className="bg-[#00E5FF] text-[#0F0F0F] px-3 py-1 border-2 border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFD500]">
                        VIEW ROLES ↓
                    </Link>
                </div>
            </div>

            <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 relative">
                {/* Hero Section */}
                <section className="mb-24 flex flex-col md:flex-row gap-12 items-start justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-block bg-[#0F0F0F] text-[#FFF4E0] px-3 py-1 font-mono text-xs uppercase mb-6 tracking-widest border border-[#0F0F0F]">
                            // SYSTEM ALERT: INTAKE ACTIVE
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tighter mb-8" style={{fontFamily: 'Fredoka One, sans-serif'}}>
                            SELECT YOUR <br />
                            <span className="text-[#FF0055] underline decoration-[#00E5FF] decoration-[8px]">SPECIALIZATION.</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-bold max-w-xl border-l-[4px] border-[#0F0F0F] pl-4 mb-8 leading-tight" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                            We do not offer standard student leadership roles. Every position is an isolated component with strict parameters, absolute ownership, and brutalist performance metrics.
                        </p>
                    </div>
                    
                    <div className="border-[3px] border-[#0F0F0F] bg-white p-6 shadow-[8px_8px_0px_0px_#0F0F0F] max-w-sm w-full font-mono text-sm space-y-4">
                        <div className="flex justify-between border-b-2 border-[#0F0F0F] pb-2">
                            <span>CYCLE</span>
                            <span className="font-bold">2026.01-PROD</span>
                        </div>
                        <div className="flex justify-between border-b-2 border-[#0F0F0F] pb-2">
                            <span>VETTING</span>
                            <span className="font-bold text-[#FF0055]">ZERO-TOLERANCE</span>
                        </div>
                        <div className="flex justify-between">
                            <span>ACTIVE NODES</span>
                            <span className="font-bold">05 SPECIALIZATIONS</span>
                        </div>
                    </div>
                </section>

                {/* Ecosystem Graph Section */}
                <div className="mb-24">
                  <EcosystemGraph />
                </div>

                {/* Roles Grid */}
                <section id="roles" className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Card 1: The Instructor */}
                    <div className="group relative bg-[#FFD500] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F]">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>The Instructor</h2>
                            <span className="bg-[#0F0F0F] text-white px-3 py-1 text-sm font-black">LVL_01</span>
                        </div>
                        {/* 3D Generative Tree Visual */}
                        <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#050505] relative overflow-hidden shadow-[4px_4px_0px_#0F0F0F]">
                            <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/80 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/20">
                                // 3D NODE: ALGO_BINARY_TREE
                            </div>
                            <Role3DCanvas role="instructor" height="210px" interactive={true} autoRotate={true} />
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
                        <Link href="/specs/instructor" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                            View Instructor Spec Sheet &amp; Guide
                        </Link>
                    </div>

                    {/* Card 2: Operations & PR */}
                    <div className="group relative bg-[#00E5FF] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F]">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>Operations &amp; PR</h2>
                            <span className="bg-[#0F0F0F] text-white px-3 py-1 text-sm font-black">LVL_02</span>
                        </div>
                        {/* 3D Generative Radar Visual */}
                        <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#050505] relative overflow-hidden shadow-[4px_4px_0px_#0F0F0F]">
                            <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/80 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/20">
                                // 3D NODE: RADAR_PHASED_ARRAY
                            </div>
                            <Role3DCanvas role="ops-pr" height="210px" interactive={true} autoRotate={true} />
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
                        <Link href="/specs/ops-pr" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                            View PR Spec Sheet &amp; Guide
                        </Link>
                    </div>

                    {/* Card 3: HR / Monitoring */}
                    <div className="group relative bg-[#7B2CBF] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F] text-white">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>HR / Monitoring</h2>
                            <span className="bg-white text-[#0F0F0F] px-3 py-1 text-sm font-black">LVL_03</span>
                        </div>
                        {/* 3D Generative Gyroscope Visual */}
                        <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#050505] relative overflow-hidden shadow-[4px_4px_0px_#0F0F0F]">
                            <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/80 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/20">
                                // 3D NODE: GYROSCOPIC_EQUILIBRIUM
                            </div>
                            <Role3DCanvas role="hr" height="210px" interactive={true} autoRotate={true} />
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
                        <Link href="/specs/hr" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                            View HR Spec Sheet &amp; Guide
                        </Link>
                    </div>

                    {/* Card 4: Design / Dev */}
                    <div className="group relative bg-[#FF0055] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F] text-white">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>Design / Dev</h2>
                            <span className="bg-white text-[#0F0F0F] px-3 py-1 text-sm font-black">LVL_04</span>
                        </div>
                        {/* 3D Generative Tesseract Visual */}
                        <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#050505] relative overflow-hidden shadow-[4px_4px_0px_#0F0F0F]">
                            <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/80 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/20">
                                // 3D NODE: 4D_TESSERACT_LATTICE
                            </div>
                            <Role3DCanvas role="design-dev" height="210px" interactive={true} autoRotate={true} />
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
                        <Link href="/specs/design-dev" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                            View Dev Spec Sheet &amp; Guide
                        </Link>
                    </div>

                    {/* Card 5: Specialised Marketing */}
                    <div className="group relative bg-[#FF6B00] border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F] text-white md:col-span-2">
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
                        <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-4xl font-black uppercase leading-none tracking-tight" style={{fontFamily: 'Fredoka One, sans-serif'}}>Specialised Marketing</h2>
                            <span className="bg-[#0F0F0F] text-[#FFD500] px-3 py-1 text-sm font-black">LVL_05</span>
                        </div>
                        {/* 3D Generative Funnel Vortex Visual */}
                        <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#050505] relative overflow-hidden shadow-[4px_4px_0px_#0F0F0F]">
                            <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/80 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/20">
                                // 3D NODE: GROWTH_FUNNEL_VORTEX
                            </div>
                            <Role3DCanvas role="marketing" height="230px" interactive={true} autoRotate={true} />
                        </div>
                        <div className="space-y-6 mb-8" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                            <div>
                                <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Selling Points</span>
                                <p className="font-bold border-l-[3px] border-white pl-3 leading-tight">Stop posting and praying. Omnipresent tech growth engine. Top 1% pipeline framing.</p>
                            </div>
                            <div>
                                <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Owns</span>
                                <ul className="font-bold list-none space-y-1 text-white/90">
                                    <li>&gt; The Ground Game (Campus Recruitment)</li>
                                    <li>&gt; The Broadcaster (Shorts &amp; Clips)</li>
                                    <li>&gt; The Hype Builder (Leaderboard Fame)</li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#0F0F0F] text-white w-fit px-2 mb-2 italic tracking-widest">Metrics</span>
                                    <p className="font-bold">3.5X Registration Growth</p>
                                </div>
                                <div>
                                    <span className="block font-black text-sm uppercase bg-[#7B2CBF] text-white w-fit px-2 mb-2 italic tracking-widest">Anti-goals</span>
                                    <p className="font-bold">Passive 'Post &amp; Pray'</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/specs/marketing" className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all">
                            View Marketing Spec Sheet &amp; Guide
                        </Link>
                    </div>
                </section>

            </main>

            {/* Unified Marquee & Footer */}
            <Marquee />
            <Footer />
        </div>
    );
}
