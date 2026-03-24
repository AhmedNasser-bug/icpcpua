"use client"

import { motion } from "framer-motion"
import { Zap, Code2, Palette, Blocks, Sparkles, Globe } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate complete UI components in seconds, not hours. Ship faster than ever before."
  },
  {
    icon: Code2,
    title: "Production Ready",
    description: "Clean, semantic React code with TypeScript. Copy, paste, and deploy immediately."
  },
  {
    icon: Palette,
    title: "Tailwind CSS",
    description: "Beautifully styled with Tailwind. Fully customizable to match your brand."
  },
  {
    icon: Blocks,
    title: "Component Library",
    description: "Built on shadcn/ui. Accessible, composable, and battle-tested components."
  },
  {
    icon: Sparkles,
    title: "AI Powered",
    description: "Natural language understanding. Describe what you need in plain English."
  },
  {
    icon: Globe,
    title: "Deploy Anywhere",
    description: "Works with Next.js, Vite, and more. One-click deploy to Vercel."
  }
]

export function Features() {
  return (
    <section id="features" className="relative bg-[#0a0a0a] py-24">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
            Features
          </span>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              build faster
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
            Stop wrestling with UI code. Focus on what matters while v0 handles the heavy lifting.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-indigo-500/30 hover:bg-white/[0.04]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
              </div>
              
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
