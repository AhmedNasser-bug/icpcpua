"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const PROMPT_TEXT = "a saas dashboard with sidebar navigation, charts, and user management..."

export function CodeEditor() {
  const [displayedText, setDisplayedText] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < PROMPT_TEXT.length) {
        setDisplayedText(PROMPT_TEXT.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        setIsTypingComplete(true)
        setTimeout(() => setShowPreview(true), 500)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-lg">
      {/* Glow effect behind editor */}
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 blur-2xl" />
      
      {/* Code editor card */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl">
        {/* Window controls */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-white/30">v0 prompt</span>
        </div>
        
        {/* Editor content */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-mono text-sm text-white/80">
                {displayedText}
                <span className={`ml-0.5 inline-block h-4 w-0.5 bg-indigo-400 ${isTypingComplete ? 'animate-pulse' : 'animate-[blink_0.8s_infinite]'}`} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated UI Preview */}
      {showPreview && (
        <motion.div 
          className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          {/* Shimmer loading overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: 2, ease: "linear" }}
          />
          
          {/* Preview header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
            <span className="text-xs text-white/40">Preview</span>
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          
          {/* Mini dashboard preview */}
          <div className="flex h-48">
            {/* Sidebar */}
            <div className="w-12 shrink-0 border-r border-white/5 bg-white/[0.02] p-2">
              <div className="mb-3 h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`mb-2 h-6 w-6 rounded-lg ${i === 0 ? 'bg-white/10' : 'bg-white/5'}`} />
              ))}
            </div>
            
            {/* Main content */}
            <div className="flex-1 p-3">
              {/* Stats row */}
              <div className="mb-3 flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-1 rounded-lg bg-white/5 p-2">
                    <div className="mb-1 h-2 w-8 rounded bg-white/10" />
                    <div className="h-3 w-12 rounded bg-white/20" />
                  </div>
                ))}
              </div>
              
              {/* Chart area */}
              <div className="rounded-lg bg-white/5 p-2">
                <div className="mb-2 h-2 w-16 rounded bg-white/10" />
                <div className="flex h-16 items-end gap-1">
                  {[40, 65, 45, 80, 55, 70, 60, 85, 50].map((h, i) => (
                    <motion.div 
                      key={i} 
                      className="flex-1 rounded-t bg-gradient-to-t from-indigo-500/50 to-purple-500/50"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Generated badge */}
          <motion.div 
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <svg className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-white/60">Generated in 3s</span>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
