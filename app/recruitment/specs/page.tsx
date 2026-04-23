import Link from 'next/link';
import { rolesData } from '@/data/recruitment/roles';

// Helper to get alternating backgrounds
const bgColors = ['bg-[#FFF4E0]', 'bg-[#7B2CBF]', 'bg-[#FFD500]', 'bg-[#00E5FF]', 'bg-[#FF0055]'];

export default function ParallaxSpecsPage() {
    return (
        <main
            className="h-screen overflow-y-scroll snap-y snap-mandatory font-sans text-[#0F0F0F]"
            aria-label="Committee specifications"
        >
            {Object.entries(rolesData).map(([roleKey, data], index) => {
                const bgColorClass = bgColors[index % bgColors.length];

                return (
                    <section
                        key={roleKey}
                        className={`snap-start h-screen w-full relative overflow-hidden flex items-center justify-center ${bgColorClass}`}
                        aria-labelledby={`heading-${roleKey}`}
                    >
                        <div className="border-[3px] border-[#0F0F0F] shadow-[12px_12px_0px_#0F0F0F] bg-white p-8 md:p-16 max-w-4xl w-full mx-4 relative">
                            {/* Vector Nodes */}
                            <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -top-1 -left-1" aria-hidden="true"></div>
                            <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -top-1 -right-1" aria-hidden="true"></div>
                            <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -bottom-1 -left-1" aria-hidden="true"></div>
                            <div className="absolute w-2 h-2 bg-white border-[2px] border-[#0F0F0F] -bottom-1 -right-1" aria-hidden="true"></div>

                            <div className="flex flex-col gap-6">
                                <div>
                                    <span className="inline-block px-3 py-1 text-sm font-bold uppercase tracking-widest border-[3px] border-[#0F0F0F] mb-4" style={{ backgroundColor: data.themeColor, color: data.themeText }}>
                                        {data.roleId}
                                    </span>
                                    <h2
                                        id={`heading-${roleKey}`}
                                        className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter"
                                        style={{ fontFamily: 'Fredoka One, sans-serif' }}
                                    >
                                        {data.roleTitle}
                                    </h2>
                                </div>

                                <p className="text-xl md:text-2xl font-bold font-mono">
                                    {data.description}
                                </p>

                                <div className="mt-8 flex justify-end">
                                    <Link
                                        href={`/recruitment/specs/${roleKey}`}
                                        className="block w-full md:w-[240px]"
                                        aria-label={`View full specification for ${data.roleTitle}`}
                                    >
                                        <button
                                            className="w-full py-4 bg-[#FF0055] text-white border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] font-bold uppercase tracking-widest text-center hover:bg-[#00E5FF] hover:text-[#0F0F0F] cursor-pointer focus-visible:ring-4 focus-visible:ring-black focus-visible:outline-none active:translate-x-[8px] active:translate-y-[8px] active:shadow-[0px_0px_0px_#0F0F0F] transition-all"
                                            tabIndex={-1}
                                        >
                                            View Spec
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}
        </main>
    );
}
