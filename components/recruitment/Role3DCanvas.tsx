"use client";

import { useEffect, useRef, useState } from "react";
import type { Role3DType } from "./role-scenes";
import { mountRoleScene } from "./role-canvas-scene";

export type { Role3DType } from "./role-scenes";

interface Role3DCanvasProps {
  role: Role3DType | string;
  wireframeOnly?: boolean;
  autoRotate?: boolean;
  className?: string;
  interactive?: boolean;
  height?: string;
}

export function Role3DCanvas({
  role,
  wireframeOnly = false,
  autoRotate = true,
  className = "",
  interactive = true,
  height = "260px",
}: Role3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    return mountRoleScene(container, {
      role,
      wireframeOnly,
      autoRotate,
      interactive,
      onDraggingChange: setIsDragging,
    });
  }, [role, wireframeOnly, autoRotate, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Helper Cue */}
      {interactive && (
        <div
          className={`absolute bottom-2 right-2 pointer-events-none transition-opacity duration-300 font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#0F0F0F] bg-white text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] z-10 ${
            isHovered || isDragging ? "opacity-100" : "opacity-40"
          }`}
        >
          {isDragging ? "DRAGGING 3D" : "DRAG TO ROTATE"}
        </div>
      )}
    </div>
  );
}
