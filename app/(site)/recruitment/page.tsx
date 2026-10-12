import Link from 'next/link';
import { RoleInspectorConsole } from '@/components/recruitment/RoleInspectorConsole';
import { RoleCard, type RoleCardData } from '@/components/recruitment/role-card';

const ROLE_CARDS: RoleCardData[] = [
    {
        role: 'instructor',
        title: 'The Instructor',
        linkLabel: 'View Instructor Spec Sheet & Guide',
        nodeLabel: '// 3D NODE: ALGO_BINARY_TREE',
        canvasHeight: '210px',
        cardClassName: 'bg-[#FFD500]',
        badgeClassName: 'bg-[#0F0F0F] text-white',
        antiGoalBadgeClassName: 'bg-[#FF0055] text-white',
        sellingPoints: 'Mastery over data structures. Ability to debug under pressure. Command presence.',
        owns: ['Problem Set Architecture', 'Training Simulations'],
        metric: '99% Runtime Optimization',
        antiGoal: 'Manual Grading',
    },
    {
        role: 'ops-pr',
        title: 'Operations & PR',
        linkLabel: 'View PR Spec Sheet & Guide',
        nodeLabel: '// 3D NODE: RADAR_PHASED_ARRAY',
        canvasHeight: '210px',
        cardClassName: 'bg-[#00E5FF]',
        badgeClassName: 'bg-[#0F0F0F] text-white',
        antiGoalBadgeClassName: 'bg-[#FF0055] text-white',
        sellingPoints: 'Brand domination. Logistics surgical precision. Social engineering.',
        owns: ['External Comms Arrays', 'Event Staging'],
        metric: 'Engagement Velocity',
        antiGoal: 'Standard Templates',
    },
    {
        role: 'hr',
        title: 'HR / Monitoring',
        linkLabel: 'View HR Spec Sheet & Guide',
        nodeLabel: '// 3D NODE: GYROSCOPIC_EQUILIBRIUM',
        canvasHeight: '210px',
        cardClassName: 'bg-[#7B2CBF] text-white',
        badgeClassName: 'bg-white text-[#0F0F0F]',
        antiGoalBadgeClassName: 'bg-[#00E5FF] text-[#0F0F0F]',
        inverted: true,
        sellingPoints: 'Human behavioral analysis. Conflict resolution protocol. Performance auditing.',
        owns: ['Member Integrity Audits', 'Onboarding Pipeline'],
        metric: 'Retention Stability',
        antiGoal: 'Paperwork Loops',
    },
    {
        role: 'design-dev',
        title: 'Design / Dev',
        linkLabel: 'View Dev Spec Sheet & Guide',
        nodeLabel: '// 3D NODE: 4D_TESSERACT_LATTICE',
        canvasHeight: '210px',
        cardClassName: 'bg-[#FF0055] text-white',
        badgeClassName: 'bg-white text-[#0F0F0F]',
        antiGoalBadgeClassName: 'bg-[#FFD500] text-[#0F0F0F]',
        inverted: true,
        sellingPoints: 'Visual violence. Pixel-perfect brutality. Frontend engineering at 200ms.',
        owns: ['Design System Blueprint', 'Full-Stack Deployment'],
        metric: 'System Aesthetic Score',
        antiGoal: 'Soft Shadows',
    },
    {
        role: 'marketing',
        title: 'Specialised Marketing',
        linkLabel: 'View Marketing Spec Sheet & Guide',
        nodeLabel: '// 3D NODE: GROWTH_FUNNEL_VORTEX',
        canvasHeight: '230px',
        cardClassName: 'bg-[#FF6B00] text-white md:col-span-2',
        badgeClassName: 'bg-[#0F0F0F] text-[#FFD500]',
        antiGoalBadgeClassName: 'bg-[#7B2CBF] text-white',
        inverted: true,
        sellingPoints: 'Stop posting and praying. Omnipresent tech growth engine. Top 1% pipeline framing.',
        owns: ['The Ground Game (Campus Recruitment)', 'The Broadcaster (Shorts & Clips)', 'The Hype Builder (Leaderboard Fame)'],
        metric: '3.5X Registration Growth',
        antiGoal: "Passive 'Post & Pray'",
    },
];

export default function RecruitmentLandingPage() {
    return (
        <div className="bg-[#FFF4E0] text-[#0F0F0F] selection:bg-[#00E5FF] selection:text-[#0F0F0F]">
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
                            {"// SYSTEM ALERT: INTAKE ACTIVE"}
                        </div>
                        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tighter mb-8">
                            SELECT YOUR <br />
                            <span className="text-[#FF0055] underline decoration-[#00E5FF] decoration-[8px]">SPECIALIZATION.</span>
                        </h1>
                        <p className="font-grotesk text-xl md:text-2xl font-bold max-w-xl border-l-[4px] border-[#0F0F0F] pl-4 mb-8 leading-tight">
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

                {/* Interactive 3D Role Console */}
                <div className="mb-24">
                  <RoleInspectorConsole />
                </div>

                {/* Roles Grid */}
                <section id="roles" className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {ROLE_CARDS.map((card) => (
                        <RoleCard key={card.role} card={card} />
                    ))}
                </section>

            </main>
        </div>
    );
}
