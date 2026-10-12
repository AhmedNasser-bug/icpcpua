import { VectorNodes } from "@/components/vector-nodes"
import { RoleData } from "@/data/recruitment/roles"

export function SpecHeroSection({ data }: { data: RoleData }) {
  return (
    <section className="mb-16 relative">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span
            className="inline-block px-3 py-1 border-[3px] border-[#0F0F0F] font-body text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_#0F0F0F]"
            style={{ backgroundColor: data.themeColor, color: data.themeText }}
          >
            OPERATIONAL_PROTOCOL_{data.levelBadge}
          </span>
          <span className="bg-[#0F0F0F] text-white px-3 py-1 font-body text-xs font-bold uppercase tracking-widest border-2 border-[#0F0F0F]">
            ICPC PUA 2026 // OFFICIAL SPEC
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-display uppercase tracking-tight leading-[0.9] drop-shadow-[5px_5px_0px_#0F0F0F] mb-4"
          style={{ color: data.themeColor }}
        >
          {data.roleTitle}
        </h1>

        <h2 className="font-display text-2xl md:text-3xl text-[#0F0F0F] mb-4">
          {data.arabicTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end bg-white border-[3px] border-[#0F0F0F] p-6 shadow-[8px_8px_0px_#0F0F0F] relative">
          <VectorNodes />

          <div className="md:col-span-8">
            <span className="bg-[#FFD500] text-[#0F0F0F] px-2 py-0.5 font-body text-xs font-bold uppercase tracking-widest border border-[#0F0F0F] inline-block mb-3">
              CORE DIRECTIVE
            </span>
            <p className="font-body text-base md:text-lg font-bold leading-relaxed text-[#0F0F0F]">
              &quot;{data.description}&quot;
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col font-body text-xs border-t-2 md:border-t-0 md:border-l-2 md:border-r-0 border-[#0F0F0F] pt-4 md:pt-0 md:px-4 space-y-1 font-bold text-zinc-700">
            <span className="text-[#0F0F0F]">VERSION: {data.version}</span>
            <span>ISSUED: {data.issued}</span>
            <span>LOCATION: {data.location}</span>
            <span className="text-[#7B2CBF] pt-2">DOC_TYPE: INFORMATIONAL_BLUEPRINT</span>
          </div>
        </div>
      </div>
    </section>
  )
}
