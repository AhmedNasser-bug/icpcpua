"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "./code-editor"

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Gradient orbs */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
      
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-12 px-6 pt-24 pb-20 lg:flex-row lg:gap-16">
        {/* Left side - Content */}
        <motion.div 
          className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Now in Public Beta
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Build UI in{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              seconds
            </span>
            , not days
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="mt-6 max-w-xl text-pretty text-lg text-white/50 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Describe what you want. Get production-ready React + Tailwind instantly.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Button 
              size="lg" 
              className="h-12 bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-base font-semibold text-white hover:from-indigo-500 hover:to-violet-500"
            >
              Start Building Free
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="h-12 gap-2 border border-white/10 px-6 text-base text-white/80 hover:bg-white/5 hover:text-white"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div 
            className="mt-10 flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="h-8 w-8 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-indigo-400 to-purple-500"
                  style={{
                    backgroundImage: `url(https://i.pravatar.cc/32?img=${i + 10})`,
                    backgroundSize: 'cover'
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-white/50">
              <span className="font-semibold text-white/80">10,000+</span> developers building with v0
            </span>
          </motion.div>
        </motion.div>

        {/* Right side - Code Editor */}
        <motion.div 
          className="flex flex-1 justify-center lg:justify-end"
          initial={{ opacity: 0, x: 40, rotate: 0 }}
          animate={{ opacity: 1, x: 0, rotate: -2 }}
          transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
        >
          <CodeEditor />
        </motion.div>
      </div>
    </section>
  )
}
