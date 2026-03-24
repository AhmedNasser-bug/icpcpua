'use client'

import { PuaNavbar } from '@/components/pua-navbar'

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

      <main className="flex-grow flex flex-col items-center w-full">
        {/* Empty container for testimonials */}
        <section className="w-full max-w-[1440px] px-10 py-24 flex items-center justify-center min-h-[600px]">
          <div className="w-full bg-white border-[3px] border-[#0F0F0F] shadow-solid p-12 relative flex items-center justify-center">
            <span className="vector-node vector-node-tl" />
            <span className="vector-node vector-node-tr" />
            <span className="vector-node vector-node-bl" />
            <span className="vector-node vector-node-br" />
            <p className="font-body text-lg text-[#0F0F0F]/60 text-center">
              Testimonials section coming soon.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
