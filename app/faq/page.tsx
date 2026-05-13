"use client"

import { useState } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Footer } from "@/components/footer"

function FaqItem({ q, a }: { q: string; a: string | React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border-[3px] border-[#0F0F0F] transition-colors ${open ? "bg-[#7B2CBF]" : "bg-white"}`}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className={`font-display text-xl uppercase tracking-wide ${open ? "text-white" : "text-[#0F0F0F]"}`}>{q}</span>
        <svg
          className={`w-6 h-6 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#FFD500]" : "text-[#0F0F0F]"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="font-body text-sm text-white px-6 pb-6 leading-relaxed whitespace-pre-line">{a}</div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#FFF4E0] font-body text-[#0F0F0F] selection:bg-[#FF0055] selection:text-white">
      <PuaNavbar />

      <main className="w-full">
        {/* ── HEADER ─── */}
        <section className="w-full border-b-[3px] border-[#0F0F0F] bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
          <div className="max-w-[1440px] mx-auto px-10 py-24 relative z-10">
            <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tighter leading-none mb-6">
              Official <span className="text-[#FF0055]">FAQ</span>
            </h1>
            <p className="font-body font-bold text-xl max-w-2xl text-zinc-600">
              ICPC PUA Community Guidelines, Rules, and Information.
            </p>
          </div>
        </section>

        {/* ── FAQ SECTIONS ─── */}
        <section className="w-full bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F]">
          <div className="max-w-[1440px] mx-auto px-10 py-24">

            <div className="space-y-16">

              {/* Section 1 */}
              <div>
                <h2 className="font-display text-4xl text-white uppercase italic tracking-tighter mb-8 border-b-[3px] border-[#7B2CBF] pb-2 inline-block">
                  1. Community Expectations & Value
                </h2>
                <div className="max-w-4xl flex flex-col gap-4">
                  <FaqItem
                    q="What is the ICPC PUA Community? | ما هو مجتمع ICPC PUA؟"
                    a={<>
                      <p className="mb-4">We are a premium tech incubator, not just a standard student club. Our objective is to build the top 1% of problem solvers at Pharos University and qualify teams for the ACPC and ECPC.</p>
                      <p dir="rtl" className="text-right">نحن بمثابة حاضنة تكنولوجية متقدمة، ولسنا مجرد نشاط طلابي تقليدي. هدفنا هو بناء وتخريج أفضل 1% من المبرمجين في جامعة فاروس، وتأهيل الفرق للمسابقات الإقليمية (ACPC و ECPC).</p>
                    </>}
                  />
                  <FaqItem
                    q="What is the training structure? | كيف يعمل نظام التدريب؟"
                    a={<>
                      <p className="mb-4">We provide structured, tiered training. Level 1 covers foundations (math, recursion, basic number theory). Level 2 covers advanced topics (graphs, dynamic programming, segment trees). Training includes module recaps, upsolving sessions, and pressure-simulation gyms.</p>
                      <p dir="rtl" className="text-right">نقدم تدريباً منظماً ومقسماً لمستويات. المستوى الأول يغطي الأساسيات (الرياضيات، الخوارزميات الأساسية)، والمستوى الثاني يغطي المواضيع المتقدمة (الرسوم البيانية، البرمجة الديناميكية). يشمل التدريب جلسات مراجعة، وتدريبات مكثفة (Upsolving)، ومحاكاة لضغط المسابقات.</p>
                    </>}
                  />
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="font-display text-4xl text-white uppercase italic tracking-tighter mb-8 border-b-[3px] border-[#7B2CBF] pb-2 inline-block">
                  2. Fresh Members: Roles & Opportunities
                </h2>
                <div className="max-w-4xl flex flex-col gap-4">
                  <FaqItem
                    q="What opportunities are available for new members? | ما هي الفرص المتاحة للأعضاء الجدد؟"
                    a={<>
                      <p className="mb-4">New members join as trainees. You will build a powerful algorithmic foundation, prepare for technical interviews at top-tier tech companies, and earn the chance to represent the university in official regional competitions.</p>
                      <p dir="rtl" className="text-right">ينضم الأعضاء الجدد كمتدربين لبناء أساس خوارزمي قوي، والاستعداد للمقابلات التقنية في كبرى شركات التكنولوجيا، والحصول على فرصة لتمثيل الجامعة في المسابقات الإقليمية الرسمية.</p>
                    </>}
                  />
                  <FaqItem
                    q="How do the committees work, and can I join one? | كيف تعمل اللجان، وهل يمكنني الانضمام؟"
                    a={<>
                      <p className="mb-4">We operate on a strict division of labor: Technical (Instructors & Tech Leads), Operations & PR (Logistics & Marketing), Design, and HR. Recruitment for committee roles happens periodically for members who exhibit a high-performance, &quot;zero-ego&quot; mindset.</p>
                      <p dir="rtl" className="text-right">نعمل بنظام تقسيم مهام صارم: اللجنة التقنية (المدربون)، العمليات والعلاقات العامة (الخدمات اللوجستية والتسويق)، التصميم، والموارد البشرية (HR). يتم فتح باب الانضمام للجان بشكل دوري للأعضاء الذين يثبتون كفاءة عالية وعقلية احترافية خالية من الأنا (Zero-ego).</p>
                    </>}
                  />
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="font-display text-4xl text-white uppercase italic tracking-tighter mb-8 border-b-[3px] border-[#7B2CBF] pb-2 inline-block">
                  3. ECPCQ Competition: Benefits & Logistics
                </h2>
                <div className="max-w-4xl flex flex-col gap-4">
                  <FaqItem
                    q="What are the benefits of competing in the ECPC? | ما هي فوائد المشاركة في مسابقة ECPC؟"
                    a={<>
                      <p className="mb-4">Beyond testing your problem-solving skills under pressure, competing gives you official certification, exposure to top tech employers, networking opportunities with elite engineers, and a prestigious addition to your resume.</p>
                      <p dir="rtl" className="text-right">إلى جانب اختبار مهاراتك تحت الضغط، تمنحك المشاركة شهادة رسمية، وتفتح لك أبواب التواصل مع كبرى الشركات التقنية ونخبة المهندسين، وتعتبر إضافة قوية جداً لسيرتك الذاتية.</p>
                    </>}
                  />
                  <FaqItem
                    q="What are the eligibility requirements? | ما هي شروط التقديم؟"
                    a={<>
                      <p className="mb-4">Contestants must be born in 2003 or later, OR have enrolled in university in 2022 or later. Proof of enrollment must be dated mid-February 2026 or later.</p>
                      <p dir="rtl" className="text-right">يجب أن يكون المتسابق من مواليد 2003 أو ما بعدها، أو التحق بالجامعة في 2022 أو ما بعدها. يجب أن يكون إثبات القيد بتاريخ منتصف فبراير 2026 أو ما بعده.</p>
                    </>}
                  />
                  <FaqItem
                    q="What are the registration costs and deadlines? | ما هي تكلفة وتاريخ انتهاء التسجيل؟"
                    a={<>
                      <p className="mb-4">Registration closes on April 30, 2026. The fee is 1500 EGP per team and is strictly non-refundable.</p>
                      <p dir="rtl" className="text-right">يغلق باب التسجيل في 30 أبريل 2026. رسوم التسجيل هي 1500 جنيه مصري للفريق الواحد، وهي غير قابلة للاسترداد تحت أي ظرف.</p>
                    </>}
                  />
                  <FaqItem
                    q="Are there rules for team names? | هل هناك شروط لأسماء الفرق؟"
                    a={<>
                      <p className="mb-4">Yes. Names must not exceed 30 characters and must be in English. The first character must be a letter or number. The only allowed special characters are underscores (_) and hyphens (-). Consecutive spaces, quotes, and brackets are prohibited.</p>
                      <p dir="rtl" className="text-right">نعم. يجب ألا يتجاوز الاسم 30 حرفاً وأن يكون باللغة الإنجليزية. يجب أن يبدأ بحرف أو رقم. الرموز المسموحة فقط هي الشرطة السفلية (_) والشرطة (-). يمنع استخدام المسافات المتتالية، الأقواس، وعلامات التنصيص.</p>
                    </>}
                  />
                  <FaqItem
                    q="What are the final deadlines for system modifications? | ما هي المواعيد النهائية لتعديل البيانات على النظام؟"
                    a={<>
                      <ul className="mb-4 list-disc list-inside">
                        <li>Cancellations & T-Shirt size changes: May 2</li>
                        <li>Team name changes: May 9</li>
                        <li>Final document submissions (IDs, enrollment proofs): May 15</li>
                        <li>Team member swaps: May 30</li>
                      </ul>
                      <ul dir="rtl" className="text-right list-disc list-inside">
                        <li>إلغاء الفرق وتعديل مقاسات التيشيرتات: 2 مايو</li>
                        <li>تغيير اسم الفريق: 9 مايو</li>
                        <li>تسليم الأوراق النهائية (البطاقات، إثبات القيد): 15 مايو</li>
                        <li>تبديل أعضاء الفريق: 30 مايو</li>
                      </ul>
                    </>}
                  />
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="font-display text-4xl text-white uppercase italic tracking-tighter mb-8 border-b-[3px] border-[#7B2CBF] pb-2 inline-block">
                  4. Community Rules & Committee Concerns
                </h2>
                <div className="max-w-4xl flex flex-col gap-4">
                  <FaqItem
                    q="What happens if there is a conflict or missed deadline? | ماذا يحدث في حال وجود خلاف أو تأخير في المهام؟"
                    a={<>
                      <p className="mb-4">Our HR committee handles all conflicts objectively. We operate on a strict &quot;Zero-Ego&quot; policy. Issues are addressed through a 24-hour cool-down protocol and a formal Strike System (Warning, Probation, Removal). Public venting is not permitted.</p>
                      <p dir="rtl" className="text-right">تتعامل لجنة الموارد البشرية (HR) مع جميع المشاكل بحيادية. نعمل بسياسة صارمة تمنع الشخصنة (Zero-Ego). تُحل المشاكل عبر بروتوكول التهدئة لمدة 24 ساعة ونظام الإنذارات الرسمي. يمنع تماماً إثارة المشاكل أو الشكوى في المجموعات العامة.</p>
                    </>}
                  />
                  <FaqItem
                    q="Who do I contact for specific issues? | بمن أتصل عند وجود مشكلة معينة؟"
                    a={<>
                      <p className="mb-4">Do not cross roles. Instructors are solely here to teach and mentor. For logistics, room bookings, or external events, contact the Operations & PR team. For community environment or dispute concerns, contact HR.</p>
                      <p dir="rtl" className="text-right">يُمنع تداخل الأدوار. المدربون مهمتهم الوحيدة هي الشرح والتوجيه. لأي أمور تخص القاعات أو التنظيم، تواصل مع فريق العمليات (Operations). ولأي مشاكل تخص بيئة المجتمع، تواصل مع لجنة الـ HR.</p>
                    </>}
                  />
                </div>
              </div>

              {/* Section 5: Official Links */}
              <div>
                <h2 className="font-display text-4xl text-white uppercase italic tracking-tighter mb-8 border-b-[3px] border-[#7B2CBF] pb-2 inline-block">
                  Official Links & Channels | الروابط والقنوات الرسمية
                </h2>
                <div className="max-w-4xl flex flex-col gap-4">
                  <div className="border-[3px] border-[#0F0F0F] bg-white p-6">
                    <ul className="flex flex-col gap-4 font-body font-bold text-sm">
                      <li className="flex flex-col md:flex-row md:items-center justify-between border-b-[2px] border-[#0F0F0F] pb-2">
                        <span className="uppercase text-[#0F0F0F]">Website</span>
                        <a href="https://icpcpua.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-[#7B2CBF] hover:underline break-all">https://icpcpua.netlify.app/</a>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center justify-between border-b-[2px] border-[#0F0F0F] pb-2">
                        <span className="uppercase text-[#0F0F0F]">Discord</span>
                        <a href="https://discord.gg/bzjx5W5Wt" target="_blank" rel="noopener noreferrer" className="text-[#7B2CBF] hover:underline break-all">https://discord.gg/bzjx5W5Wt</a>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center justify-between pb-2">
                        <span className="uppercase text-[#0F0F0F]">WhatsApp Group</span>
                        <a href="https://chat.whatsapp.com/DYx4tz7Y2xnE8GJ1D8S6xn" target="_blank" rel="noopener noreferrer" className="text-[#7B2CBF] hover:underline break-all">https://chat.whatsapp.com/DYx4tz7Y2xnE8GJ1D8S6xn</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── FOOTER ─── */}
        <Footer />

      </main>
    </div>
  )
}
