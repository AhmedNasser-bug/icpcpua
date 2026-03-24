"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Describe Your Vision",
    description: "Type what you want to build in plain English. Be as detailed or as simple as you like."
  },
  {
    number: "02",
    title: "AI Generates Code",
    description: "Our AI understands your intent and generates clean, production-ready React components."
  },
  {
    number: "03",
    title: "Iterate & Refine",
    description: "Chat with the AI to make adjustments. Refine colors, layout, and functionality instantly."
  },
  {
    number: "04",
    title: "Export & Deploy",
    description: "Copy the code to your project or deploy directly to Vercel with one click."
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[#0a0a0a] py-24">
      {/* Gradient accent */}
      <div className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
            How It Works
          </span>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            From idea to UI in{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              four steps
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-transparent lg:left-1/2 lg:block lg:-translate-x-px" />
          
          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className={`relative flex flex-col gap-8 lg:flex-row lg:items-center ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                {/* Number marker */}
                <div className="absolute left-0 flex h-16 w-16 items-center justify-center lg:left-1/2 lg:-translate-x-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-500/30 bg-[#0a0a0a]">
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 pl-24 lg:pl-0 ${i % 2 === 0 ? "lg:pr-24 lg:text-right" : "lg:pl-24"}`}>
                  <h3 className="mb-2 text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="text-white/50">{step.description}</p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden flex-1 lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
