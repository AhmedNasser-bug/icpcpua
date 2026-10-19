import { OFFICIAL_COMMUNITY_LINKS } from "@/data/faq"

/**
 * Floating WhatsApp CTA component that provides quick access to the
 * official PUA ICPC community WhatsApp group from anywhere on the site.
 */
export function WhatsAppCTA() {
  return (
    <a
      href={OFFICIAL_COMMUNITY_LINKS.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join official WhatsApp group"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 bg-[#25D366] text-[#0F0F0F] font-bold px-4 py-3 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_0px_#0F0F0F] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#0F0F0F] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-150 uppercase tracking-wider text-xs sm:text-sm font-mono"
    >
      <svg
        className="w-5 h-5 shrink-0 fill-current"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12.011 1.001c-6.066 0-11 4.934-11 11 0 1.936.504 3.818 1.463 5.483L1.011 23l5.659-1.485A10.957 10.957 0 0 0 12.01 23c6.066 0 11-4.934 11-11s-4.934-10.999-10.999-10.999zm0 20.165a9.13 9.13 0 0 1-4.664-1.272l-.334-.199-3.46.908.923-3.374-.219-.348a9.123 9.123 0 0 1-1.399-4.88c0-5.052 4.11-9.162 9.163-9.162 5.052 0 9.162 4.11 9.162 9.162 0 5.053-4.11 9.165-9.176 9.165zm5.029-6.866c-.276-.138-1.631-.805-1.884-.897-.253-.092-.437-.138-.621.138-.184.276-.713.897-.874 1.081-.161.184-.322.207-.598.069a7.542 7.542 0 0 1-2.222-1.371 8.318 8.318 0 0 1-1.538-1.916c-.161-.276-.017-.425.121-.563.124-.124.276-.322.414-.483.138-.161.184-.276.276-.46.092-.184.046-.345-.023-.483-.069-.138-.621-1.495-.851-2.047-.224-.538-.452-.465-.621-.474l-.529-.01c-.184 0-.483.069-.736.345-.253.276-.966.943-.966 2.3 0 1.357.989 2.668 1.127 2.852.138.184 1.945 2.97 4.712 4.164.659.284 1.173.454 1.574.581.661.21 1.263.18 1.738.109.53-.079 1.631-.667 1.861-1.311.23-.644.23-1.196.161-1.311-.069-.115-.253-.184-.529-.322z" />
      </svg>
      <span className="font-bold">WhatsApp Community</span>
    </a>
  )
}
