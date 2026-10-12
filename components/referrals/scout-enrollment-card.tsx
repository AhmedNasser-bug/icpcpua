import { AlertCircle, CheckCircle2, Sparkles, UserCheck } from "lucide-react"

export function ScoutEnrollmentCard({
  fullNameInput,
  uniIdInput,
  onFullNameInputChange,
  onUniIdInputChange,
  formError,
  statusMessage,
  formLoading,
  onSubmit,
}: {
  fullNameInput: string
  uniIdInput: string
  onFullNameInputChange: (value: string) => void
  onUniIdInputChange: (value: string) => void
  formError: string | null
  statusMessage: string | null
  formLoading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-7 space-y-4">
        <div className="inline-block bg-[#FFD500] text-[#0F0F0F] px-2.5 py-1 font-mono text-xs font-black border-2 border-[#0F0F0F] uppercase">
          STEP 01 // GENERATE YOUR CODE
        </div>

        <h2
          className="font-display text-3xl md:text-4xl font-black uppercase text-[#0F0F0F] leading-tight"
        >
          GET YOUR REFERRAL LINK
        </h2>

        <p className="font-grotesk font-bold text-sm text-gray-700 leading-normal">
          Enter your <strong>Full Name</strong> and <strong>University ID</strong>. If you previously enrolled, your profile and points will be loaded immediately.
        </p>

        {formError && (
          <div className="bg-[#FF0055] text-white p-3 font-mono text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {statusMessage && (
          <div className="bg-[#25D366] text-[#0F0F0F] p-3 font-mono text-xs font-bold border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 pt-1">
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F0F0F] block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullNameInput}
              onChange={(e) => onFullNameInputChange(e.target.value)}
              placeholder="e.g. Ahmed Nasser"
              className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3 font-bold text-sm text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F0F0F] block mb-1">
              University ID (Uni ID)
            </label>
            <input
              type="text"
              required
              value={uniIdInput}
              onChange={(e) => onUniIdInputChange(e.target.value)}
              placeholder="e.g. 202300481"
              className="w-full border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-3 font-bold text-sm text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full bg-[#7B2CBF] text-white border-[3px] border-[#0F0F0F] py-3.5 px-6 font-black uppercase text-base tracking-wider shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FF0055] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserCheck className="w-5 h-5" />
            <span>{formLoading ? "CONNECTING..." : "GET MY REFERRAL LINK →"}</span>
          </button>
        </form>
      </div>

      {/* Right: How It Works Summary */}
      <div className="lg:col-span-5 bg-[#FFF4E0] border-[3px] border-[#0F0F0F] p-6 shadow-[5px_5px_0px_#7B2CBF] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#0F0F0F] pb-2 font-mono text-xs font-black uppercase">
          <Sparkles className="w-4 h-4 text-[#7B2CBF]" />
          <span>HOW POINT COLLECTION WORKS</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="border-2 border-[#0F0F0F] bg-white p-3 shadow-[2px_2px_0px_#0F0F0F]">
            <span className="font-black text-[#FF0055] block mb-1">01 // YOUR CODE</span>
            <p className="font-bold text-gray-700">Enter your name &amp; ID to generate a personal tracked dispatch link.</p>
          </div>

          <div className="border-2 border-[#0F0F0F] bg-white p-3 shadow-[2px_2px_0px_#0F0F0F]">
            <span className="font-black text-[#00E5FF] block mb-1">02 // SHARE IT</span>
            <p className="font-bold text-gray-700">Send your link or referral code to friends interested in programming.</p>
          </div>

          <div className="border-2 border-[#0F0F0F] bg-white p-3 shadow-[2px_2px_0px_#0F0F0F]">
            <span className="font-black text-[#25D366] block mb-1">03 // COLLECT POINTS</span>
            <p className="font-bold text-gray-700">Earn 1 Point for every peer who completes registration with your code.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
