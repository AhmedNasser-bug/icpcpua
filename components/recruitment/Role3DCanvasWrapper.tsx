"use client"

import dynamic from "next/dynamic"
import type { Role3DType } from "./Role3DCanvas"

interface Role3DCanvasWrapperProps {
  role: Role3DType | string
  wireframeOnly?: boolean
  autoRotate?: boolean
  className?: string
  interactive?: boolean
  height?: string
}

const Role3DCanvas = dynamic(
  () => import("./Role3DCanvas").then((mod) => mod.Role3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[210px] bg-[#050505] flex items-center justify-center font-mono text-[10px] text-white/50 tracking-widest uppercase">
        // INITIALIZING 3D MODULE...
      </div>
    ),
  }
)

export function Role3DCanvasWrapper(props: Role3DCanvasWrapperProps) {
  return <Role3DCanvas {...props} />
}
