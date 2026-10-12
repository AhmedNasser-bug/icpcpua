import Link from "next/link"
import { Role3DCanvas, type Role3DType } from "./Role3DCanvas"
import { rolesData } from "@/data/recruitment/roles"

export interface RoleCardData {
  role: Role3DType
  title: string
  linkLabel: string
  nodeLabel: string
  canvasHeight: string
  cardClassName: string
  badgeClassName: string
  inverted?: boolean
  sellingPoints: string
  owns: string[]
  metric: string
  antiGoal: string
  antiGoalBadgeClassName: string
}

/**
 * Presentation card for a recruitment specialization. The role registry owns
 * the level badge and spec-sheet path; the passed data only carries copy and
 * the per-card color treatment.
 */
export function RoleCard({ card }: { card: RoleCardData }) {
  const {
    role,
    title,
    linkLabel,
    nodeLabel,
    canvasHeight,
    cardClassName,
    badgeClassName,
    inverted = false,
    sellingPoints,
    owns,
    metric,
    antiGoal,
    antiGoalBadgeClassName,
  } = card

  const sectionLabelClassName = inverted ? "bg-white text-[#0F0F0F]" : "bg-[#0F0F0F] text-white"
  const sellingPointsBorderClassName = inverted ? "border-l-white" : "border-l-[#0F0F0F]"

  return (
    <div
      className={`group relative ${cardClassName} border-[3px] border-[#0F0F0F] p-8 shadow-[8px_8px_0px_0px_#0F0F0F] transition-all hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_#0F0F0F]`}
    >
      <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -top-[6px] -left-[6px]"></div>
      <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-10 -bottom-[6px] -right-[6px]"></div>
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-display text-4xl font-black uppercase leading-none tracking-tight">{title}</h2>
        <span className={`px-3 py-1 text-sm font-black ${badgeClassName}`}>{rolesData[role].levelBadge}</span>
      </div>
      {/* 3D Generative Role Visual */}
      <div className="mb-6 border-[3px] border-[#0F0F0F] bg-[#050505] relative overflow-hidden shadow-[4px_4px_0px_#0F0F0F]">
        <div className="absolute top-2 left-2 z-10 font-mono text-[10px] text-white/80 uppercase tracking-widest bg-black/80 px-2 py-0.5 border border-white/20">
          {nodeLabel}
        </div>
        <Role3DCanvas role={role} height={canvasHeight} interactive={true} autoRotate={true} />
      </div>
      <div className="font-grotesk space-y-6 mb-8">
        <div>
          <span className={`block font-black text-sm uppercase w-fit px-2 mb-2 italic tracking-widest ${sectionLabelClassName}`}>
            Selling Points
          </span>
          <p className={`font-bold border-l-[3px] pl-3 leading-tight ${sellingPointsBorderClassName}`}>{sellingPoints}</p>
        </div>
        <div>
          <span className={`block font-black text-sm uppercase w-fit px-2 mb-2 italic tracking-widest ${sectionLabelClassName}`}>
            Owns
          </span>
          <ul className={`font-bold list-none space-y-1${inverted ? " text-white/90" : ""}`}>
            {owns.map((item) => (
              <li key={item}>&gt; {item}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className={`block font-black text-sm uppercase w-fit px-2 mb-2 italic tracking-widest ${sectionLabelClassName}`}>
              Metrics
            </span>
            <p className="font-bold">{metric}</p>
          </div>
          <div>
            <span className={`block font-black text-sm uppercase w-fit px-2 mb-2 italic tracking-widest ${antiGoalBadgeClassName}`}>
              Anti-goals
            </span>
            <p className="font-bold">{antiGoal}</p>
          </div>
        </div>
      </div>
      <Link
        href={`/specs/${role}`}
        className="block text-center w-full bg-white text-[#0F0F0F] py-4 border-[3px] border-[#0F0F0F] font-black uppercase text-xl shadow-[8px_8px_0px_0px_#0F0F0F] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all"
      >
        {linkLabel}
      </Link>
    </div>
  )
}
