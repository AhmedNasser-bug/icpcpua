import Link from "next/link"

export function FaqLinkSection() {
  return (
    <section className="w-full bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F]">
      <div className="max-w-[1440px] mx-auto px-10 py-24 text-center">
        <h2 className="font-display text-5xl text-white uppercase italic tracking-tighter mb-8">
          HAVE QUESTIONS?
        </h2>
        <p className="font-body text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
          Check out our official FAQ for all the details about training, eligibility, ECPCQ, and more.
        </p>
        <Link href="/faq" className="inline-flex items-center justify-center border-[3px] border-white shadow-solid-sm bg-[#7B2CBF] text-white text-lg font-display uppercase tracking-wider px-8 py-4 hover:bg-[#FF0055] transition-colors">
          READ THE FAQ
        </Link>
      </div>
    </section>
  )
}
