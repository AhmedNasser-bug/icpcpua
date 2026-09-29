"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Role3DCanvas, Role3DType } from "./Role3DCanvas";

interface RoleMeta {
  id: Role3DType;
  title: string;
  lvl: string;
  color: string;
  textColor: string;
  engineName: string;
  complexity: string;
  metric: string;
  specUrl: string;
  desc: string;
}

const ROLES_META: RoleMeta[] = [
  {
    id: "instructor",
    title: "The Instructor",
    lvl: "LVL_01",
    color: "#FFD500",
    textColor: "#0F0F0F",
    engineName: "BINARY_TREE_TRAVERSAL_v4",
    complexity: "O(log N) SEARCH SPACE",
    metric: "99% RUNTIME OPTIMIZATION",
    specUrl: "/specs/instructor",
    desc: "Algorithmic problem set architecture, dynamic tree traversal, and low-latency competitive training simulations.",
  },
  {
    id: "ops-pr",
    title: "Operations & PR",
    lvl: "LVL_02",
    color: "#00E5FF",
    textColor: "#0F0F0F",
    engineName: "RADAR_PHASED_ARRAY_2.4GHZ",
    complexity: "360° SWEEP OMNICHANNEL",
    metric: "ENGAGEMENT VELOCITY",
    specUrl: "/specs/ops-pr",
    desc: "Surgical logistics, broadcast wave propagation, and campus brand domination without generic templates.",
  },
  {
    id: "hr",
    title: "HR / Monitoring",
    lvl: "LVL_03",
    color: "#7B2CBF",
    textColor: "#FFFFFF",
    engineName: "GYROSCOPIC_EQUILIBRIUM_CORE",
    complexity: "3-AXIS PSYCHOLOGICAL SHIELD",
    metric: "ZERO OPERATIONAL CRISES",
    specUrl: "/specs/hr",
    desc: "Human behavioral analysis, conflict de-escalation, and systemic equilibrium to protect student leaders from burnout.",
  },
  {
    id: "design-dev",
    title: "Design / Dev",
    lvl: "LVL_04",
    color: "#FF0055",
    textColor: "#FFFFFF",
    engineName: "4D_TESSERACT_HYPERCUBE",
    complexity: "16-VERTEX MATRIX PROJECTION",
    metric: "<200MS SSR LATENCY",
    specUrl: "/specs/design-dev",
    desc: "Brutalist geometric architecture, high-density component engineering, and total elimination of soft shadows.",
  },
  {
    id: "marketing",
    title: "Specialised Marketing",
    lvl: "LVL_05",
    color: "#FF6B00",
    textColor: "#FFFFFF",
    engineName: "HYPERBOLIC_GROWTH_VORTEX",
    complexity: "140-PARTICLE ACCELERATOR",
    metric: "3.5X REGISTRATION GROWTH",
    specUrl: "/specs/marketing",
    desc: "Ground game offensive, high-conversion short clips, and leaderboards designed to engineer omnipresent hype.",
  },
];

export function RoleInspectorConsole() {
  const [selectedRole, setSelectedRole] = useState<Role3DType>("instructor");
  const [wireframeOnly, setWireframeOnly] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const activeMeta = ROLES_META.find((r) => r.id === selectedRole) || ROLES_META[0];

  return (
    <section className="relative w-full border-[3px] border-[#0F0F0F] bg-white shadow-[10px_10px_0px_#0F0F0F] overflow-hidden">
      {/* Corner Vector Nodes */}
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-30 -top-[6px] -left-[6px]" />
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-30 -top-[6px] -right-[6px]" />
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-30 -bottom-[6px] -left-[6px]" />
      <span className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-30 -bottom-[6px] -right-[6px]" />

      {/* Top Console Bar */}
      <div className="bg-[#0F0F0F] text-[#FFF4E0] px-4 py-3 border-b-[3px] border-[#0F0F0F] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase font-bold">
          <span className="w-2.5 h-2.5 bg-[#00E5FF] animate-pulse inline-block" />
          <span>ICPC ROLE MATRIX // 3D PROCEDURAL TELEMETRY</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="hidden sm:inline-block text-white/60">ACTIVE SUBSYSTEM:</span>
          <span
            className="px-2 py-0.5 font-bold uppercase border border-black shadow-[2px_2px_0px_#FFF4E0]"
            style={{ backgroundColor: activeMeta.color, color: activeMeta.textColor }}
          >
            {activeMeta.lvl} // {activeMeta.title}
          </span>
        </div>
      </div>

      {/* Role Navigation Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0]">
        {ROLES_META.map((meta) => {
          const isSelected = meta.id === selectedRole;
          return (
            <button
              key={meta.id}
              onClick={() => setSelectedRole(meta.id)}
              className={`p-3 text-left font-mono text-xs uppercase font-bold border-r-[3px] last:border-r-0 border-[#0F0F0F] transition-all flex flex-col justify-between gap-1 ${
                isSelected
                  ? "bg-[#0F0F0F] text-[#FFF4E0] shadow-inner"
                  : "bg-white hover:bg-[#FFF4E0] text-[#0F0F0F]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className="w-2.5 h-2.5 inline-block border border-[#0F0F0F]"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-[10px] opacity-75">{meta.lvl}</span>
              </div>
              <span className="font-extrabold tracking-tight truncate">{meta.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main 3D Stage & Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 relative min-h-[460px] bg-[#050505]">
        {/* The 3D Interactive Viewport */}
        <div className="lg:col-span-8 relative flex items-center justify-center p-2 min-h-[380px] lg:min-h-[480px]">
          {/* Subtle Grid Matrix Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Procedural Three.js Model */}
          <Role3DCanvas
            key={selectedRole}
            role={selectedRole}
            wireframeOnly={wireframeOnly}
            autoRotate={autoRotate}
            interactive={true}
            height="460px"
          />

          {/* Floating Canvas Controls HUD */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-auto">
            <button
              onClick={() => setAutoRotate((prev) => !prev)}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase border-2 border-white shadow-[2px_2px_0px_#00E5FF] transition-all ${
                autoRotate ? "bg-[#00E5FF] text-black" : "bg-black/80 text-white hover:bg-black"
              }`}
            >
              {autoRotate ? "SPIN: ON" : "SPIN: OFF"}
            </button>

            <button
              onClick={() => setWireframeOnly((prev) => !prev)}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase border-2 border-white shadow-[2px_2px_0px_#FF0055] transition-all ${
                wireframeOnly ? "bg-[#FF0055] text-white" : "bg-black/80 text-white hover:bg-black"
              }`}
            >
              {wireframeOnly ? "WIREFRAME: ACTIVE" : "WIREFRAME: OFF"}
            </button>
          </div>

          {/* Coordinate Readout */}
          <div className="absolute bottom-4 left-4 z-20 font-mono text-[10px] text-white/50 pointer-events-none hidden sm:block">
            X: [0.00] // Y: [0.00] // Z: [8.50] // FOV: 45°
          </div>
        </div>

        {/* Right Telemetry & Role Dossier Sidebar */}
        <div className="lg:col-span-4 border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-[#0F0F0F] bg-white p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 text-xs font-mono font-black border-2 border-[#0F0F0F] uppercase"
                  style={{ backgroundColor: activeMeta.color, color: activeMeta.textColor }}
                >
                  {activeMeta.lvl}
                </span>
                <span className="font-mono text-xs text-gray-500 font-bold uppercase">
                  ACTIVE SPECIALIZATION
                </span>
              </div>
              <h3
                className="text-3xl font-black uppercase tracking-tight text-[#0F0F0F]"
                style={{ fontFamily: "Fredoka One, sans-serif" }}
              >
                {activeMeta.title}
              </h3>
            </div>

            <p className="text-sm font-bold text-gray-800 leading-snug border-l-[3px] border-[#0F0F0F] pl-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {activeMeta.desc}
            </p>

            {/* Spec Matrix Data Points */}
            <div className="border-2 border-[#0F0F0F] bg-[#FFF4E0] p-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-black/20 pb-1">
                <span className="text-gray-600">3D ENGINE</span>
                <span className="font-bold text-[#0F0F0F]">{activeMeta.engineName}</span>
              </div>
              <div className="flex justify-between border-b border-black/20 pb-1">
                <span className="text-gray-600">COMPLEXITY</span>
                <span className="font-bold text-[#FF0055]">{activeMeta.complexity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PRIMARY KPI</span>
                <span className="font-bold text-[#7B2CBF]">{activeMeta.metric}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Link
              href={activeMeta.specUrl}
              className="block w-full text-center py-3 px-4 border-[3px] border-[#0F0F0F] font-black uppercase text-sm shadow-[4px_4px_0px_#0F0F0F] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#0F0F0F] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              style={{ backgroundColor: activeMeta.color, color: activeMeta.textColor }}
            >
              INSPECT {activeMeta.title.toUpperCase()} DOSSIER ↗
            </Link>

            <Link
              href="#roles"
              className="block w-full text-center py-2 px-3 border-2 border-[#0F0F0F] bg-white text-[#0F0F0F] font-mono text-xs uppercase font-bold hover:bg-gray-100 transition-colors"
            >
              BROWSE ALL 5 CARDS IN GRID ↓
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
