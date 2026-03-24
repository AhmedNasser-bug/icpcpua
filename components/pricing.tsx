"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out v0",
    features: [
      "10 generations per month",
      "Basic components",
      "Community support",
      "Export to code"
    ],
    cta: "Get Started",
    featured: false
  },
  {
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "For professional developers",
    features: [
      "Unlimited generations",
      "Advanced components",
      "Priority support",
      "Export to code",
      "Custom themes",
      "Team collaboration"
    ],
    cta: "Start Free Trial",
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option"
    ],
    cta: "Contact Sales",
    featured: false
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="relative bg-[#0a0a0a] py-24">
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
            Pricing
          </span>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              transparent
            </span>{" "}
            pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
            Start free and scale as you grow. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border p-8 ${
                plan.featured 
                  ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent" 
                  : "border-white/5 bg-white/[0.02]"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {plan.featured && (
                <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-indigo-600 to-violet-600 px-12 py-1 text-xs font-medium text-white">
                  Popular
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-white/50">{plan.period}</span>}
              </div>
              <p className="mt-2 text-sm text-white/50">{plan.description}</p>
              
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 text-indigo-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`mt-8 w-full ${
                  plan.featured 
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500" 
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
