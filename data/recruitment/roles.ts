export type RoleId = "instructor" | "technical" | "ops-pr" | "hr" | "marketing" | "design-dev";

export interface CommitteeHandbook {
  vision: { en: string; ar: string };
  rolesDistribution: { title: { en: string; ar: string }; desc: { en: string; ar: string } }[];
  responsibilities: { title: { en: string; ar: string }; desc: { en: string; ar: string } }[];
  dosAndDonts: {
    avoid: { en: string; ar: string }[];
    prefer: { en: string; ar: string }[];
  };
  faq: { q: { en: string; ar: string }; a: { en: string; ar: string } }[];
  subRoles: string[];
}

export interface RoleData {
  roleId: string;
  roleTitle: string;
  arabicTitle: string;
  levelBadge: string;
  version: string;
  issued: string;
  location: string;
  description: string;
  sellingPoints: string[];
  owns: string[];
  metrics: { value: string; label: string }[];
  antiGoals: string[];
  antiGoalColor?: string;
  themeColor: string;
  themeText: string;
  applyUrl: string;
  problemsSolved: {
    title: { en: string; ar: string };
    desc: { en: string; ar: string };
  }[];
  impact: {
    title: { en: string; ar: string };
    desc: { en: string; ar: string };
  }[];
  handbook: CommitteeHandbook;
}

export const universalRules = [
  {
    id: "ego",
    titleEn: "Ego is the Enemy",
    titleAr: "العقلية الخالية من الغرور",
    ruleEn: "Detach your emotions during debates to maximize critical thinking. Criticize ideas, not people.",
    ruleAr: "فصل المشاعر أثناء النقاشات لتعزيز التفكير النقدي. انقد الأفكار لا الأشخاص."
  },
  {
    id: "meetings",
    titleEn: "The Golden Rule of Meetings",
    titleAr: "قاعدة الاجتماعات الذهبية",
    ruleEn: "Never leave a meeting without a clear understanding of what each member is supposed to do next with documented tasks.",
    ruleAr: "عدم مغادرة أي اجتماع دون فهم واضح ومحدد لما يجب على كل عضو تنفيذه تالياً وبمهام موثقة."
  },
  {
    id: "conflict",
    titleEn: "Conflict Resolution & 24h Cool-Down",
    titleAr: "حل النزاعات وفترة التهدئة",
    ruleEn: "Address problems immediately and constructively. If you have an issue with a person, tell them directly, not everyone else. Follow the 24-hour cool-down protocol and strike system.",
    ruleAr: "مواجهة المشكلات فوراً وبشكل بنّاء. واجه الشخص المعني مباشرة وليس الآخرين. تفعيل بروتوكول التهدئة (24 ساعة) ونظام الإنذارات."
  },
  {
    id: "accountability",
    titleEn: "Accountability & Reliability",
    titleAr: "المسؤولية والالتزام بالوقت",
    ruleEn: "Do your share of the work and produce it by the agreed-upon time. If you cannot fulfill your role, communicate it immediately via 48-hour delay notices.",
    ruleAr: "أداء المهام وتسليمها في الوقت المتفق عليه. في حال تعذر ذلك، يجب إخطار الفريق فوراً (إشعار 48 ساعة)."
  },
  {
    id: "division-of-labor",
    titleEn: "Zero Martyrdom & Strict Division of Labor",
    titleAr: "عدم التضحية بالنفس وتقسيم العمل الصارم",
    ruleEn: "You have a specific lane. Do not burn yourself out doing other people's jobs. Stick to the absolute, non-negotiable division of labor.",
    ruleAr: "لكل عضو مساره الخاص. تجنب الاحتراق الوظيفي بأداء مهام الآخرين. الالتزام الصارم بتقسيم العمل دون مساومة."
  }
];

export const rolesData: Record<string, RoleData> = {
  "instructor": {
    roleId: "OPS/SPEC-01",
    roleTitle: "THE INSTRUCTOR (TECHNICAL)",
    arabicTitle: "دليل لجنة التدريب والتوجيه (التقنية)",
    levelBadge: "LVL_01",
    version: "4.0.2-STABLE",
    issued: "2026.SEASON",
    location: "CAMPUS/LAB_402_PUA",
    description: "OWN THE ABSTRACTION. TRANSFORM BEGINNERS INTO CODEFORCES MONSTERS. PRESERVE ACADEMIC RIGOR WITH ZERO SOFT CODE.",
    sellingPoints: [
      "Autonomy over the entire technical training pipeline and CP contest structures.",
      "Direct contribution to ICPC global standards for high-energy problem solving.",
      "Mastery over data structures and algorithms."
    ],
    owns: [
      "Problem Set Architecture & Gym Setups",
      "Live Contest Simulations & Code Reviews",
      "Code Auditing and Live Debugging under pressure",
      "The 'Source of Truth' algorithmic standards"
    ],
    metrics: [
      { value: "99%", label: "Runtime Optimization" },
      { value: "<100MS", label: "Core Interaction Latency" },
      { value: "0", label: "TLE Errors per Session" }
    ],
    antiGoals: [
      "NO implementation of 'soft' logic or unoptimized O(n!) routines.",
      "NO consensus-based decision making on fundamental truths.",
      "NO reliance on pure manual grading. Automate everything."
    ],
    themeColor: "#FFD500", // Yellow
    themeText: "#0F0F0F",
    antiGoalColor: "#FF0055", // Pink
    applyUrl: "#register",
        problemsSolved: [
      {
        title: {
          en: "The Freshman Drop-Off Wall",
          ar: "حائط إحباط المبتدئين والانسحاب المبكر",
        },
        desc: {
          en: "Over 70% of beginners abandon competitive programming within weeks due to cryptic compiler errors, steep learning curves, and toxic imposter syndrome. Instructors build step-by-step cognitive ladders that deliver rapid 'Green AC' breakthroughs.",
          ar: "يتخلى أكثر من 70% من المبتدئين عن البرمجة التنافسية في الأسابيع الأولى بسبب رسائل الأخطاء المعقدة وفقدان التوجيه. يقوم المدرب ببناء مسار تدريجي يمنح الطالب أولى حلوله المقبولة (Green AC) سريعاً ويكسر حاجز الرهبة.",
        },
      },
      {
        title: {
          en: "Theory vs. Contest Execution Gap",
          ar: "فجوة النظرية والتنفيذ بالمسابقات",
        },
        desc: {
          en: "College curricula teach data structures theoretically on static whiteboards. Instructors bridge the gap to high-stakes contests where asymptotic bounds, memory limits, and sub-second execution are matter-of-life-or-death.",
          ar: "تركز المناهج الأكاديمية على النظريات المجردة دون ربطها بضغط الوقت. يسد المدرب هذه الفجوة بتدريب عملي مكثف على تحليل التعقيد الزمني (Time Complexity) والتصرف تحت ضغط المسابقات الحقيقية.",
        },
      },
      {
        title: {
          en: "Unstructured Practice Chaos",
          ar: "فوضى التدريب العشوائي وتشتت المصادر",
        },
        desc: {
          en: "Students waste months solving arbitrary, mismatched problems without progressive mastery. Instructors deliver curated problem sheets and targeted upsolving clinics targeting specific algorithmic blind spots.",
          ar: "يضيع الطلاب شهوراً في حل مسائل عشوائية دون تدرج منهجي. يقدم المدرب شيتات مختارة بعناية وجلسات حل تكميلي (Upsolving) لاستهداف الثغرات البرمجية والارتقاء بالمستوى بثبات.",
        },
      },
    ],
    impact: [
      {
        title: {
          en: "Codeforces Monster Pipeline",
          ar: "صناعة وحوش منصة كودفورسيز",
        },
        desc: {
          en: "Systematically elevates unranked university cadets into Pupil, Specialist, and Expert ranks, building a persistent culture of elite problem solving.",
          ar: "تحويل الطلاب المبتدئين إلى متسابقين مصنفين (Pupil وSpecialist وExpert) على Codeforces، وصناعة نواة تنافسية قوية بالجامعة.",
        },
      },
      {
        title: {
          en: "National ECPC Qualifications & Medals",
          ar: "التأهل لنهائيات ECPC وحصد الميداليات",
        },
        desc: {
          en: "Prepares and fields high-synergy 3-person squads capable of conquering regional qualifiers and representing Pharos University on national stages.",
          ar: "تأهيل وإعداد فرق متكاملة قادرة على اجتياز التصفيات الوطنية لبطولة ECPC وتحقيق مراكز متقدمة تليق باسم الجامعة.",
        },
      },
      {
        title: {
          en: "FAANG & Tier-1 Technical Interview Dominance",
          ar: "اكتساح المقابلات التقنية لكبرى الشركات العالمية",
        },
        desc: {
          en: "Cadets internalize algorithmic fundamentals so deeply that algorithmic interview rounds at top tech multinationals become effortless reflex.",
          ar: "ترسيخ التفكير الخوارزمي الصارم لدى المتدربين، مما يجعل المقابلات البرمجية الصعبة في الشركات العالمية الكبرى أمراً بديهياً ومضموناً.",
        },
      },
    ],
handbook: {
      vision: {
        en: "Turn beginners into monsters on Codeforces. Elevate students to masters while maintaining a premium, ego-free learning environment. You are an academic machine, not an event planning club.",
        ar: "تحويل المبتدئين إلى وحوش على منصة Codeforces. الارتقاء بالطلاب إلى مستويات متقدمة مع الحفاظ على بيئة تعليمية احترافية وخالية من الغرور. أنتم آلة أكاديمية، ولستم نادياً لتنظيم الفعاليات."
      },
      rolesDistribution: [
        {
          title: { en: "Level 1 Instructor", ar: "مدرب مستوى 1 (Level 1 Instructor)" },
          desc: {
            en: "Dedicated strictly to foundations and basic problem solving (data types, loops, arrays, basic complexity, math).",
            ar: "مخصص حصرياً لتأسيس الطلاب وحل المشكلات الأساسية وتدريب المبتدئين على أوليات التفكير الخوارزمي."
          }
        },
        {
          title: { en: "Level 2 Instructor", ar: "مدرب مستوى 2 (Level 2 Instructor)" },
          desc: {
            en: "Dedicated strictly to advanced algorithmic topics (Dynamic Programming, Graph Theory, Trees, Number Theory, Range Queries).",
            ar: "مخصص حصرياً للمواضيع المتقدمة (مثل: DP، Graphs، خوارزميات الأشجار، ونظريات الأعداد)."
          }
        },
        {
          title: { en: "Competitive Programming Coach", ar: "الموجه (Coach)" },
          desc: {
            en: "Dedicated to post-session upsolving, 1-on-1 mentorship, gym telemetry monitoring, and psychological support.",
            ar: "مخصص لجلسات الحل التكميلية (Upsolving)، الإرشاد الفردي، مراقبة الأداء في الـ Gym، والدعم النفسي."
          }
        }
      ],
      responsibilities: [
        {
          title: { en: "Weekly Curriculum & Performance Audit", ar: "التدقيق الأسبوعي للمنهج والأداء" },
          desc: {
            en: "Analyze trainee solve rates on post-session gyms. If rates are low, restructure the next upsolve session to target the exact comprehension gap.",
            ar: "تحليل معدلات حل المتدربين بعد الجلسات. إذا كانت المعدلات منخفضة، يتم إعادة هيكلة جلسة الـ Upsolve لاستهداف الفجوات تحديداً."
          }
        },
        {
          title: { en: "Weekly Readiness Checks", ar: "فحوصات الجاهزية الأسبوعية" },
          desc: {
            en: "Verify that your 'Session Flow' is defined and confirm receipt of presentation slides from the Design team well before the session.",
            ar: "التأكد من وضوح تسلسل الجلسة واستلام شرائح العرض من فريق التصميم قبل الجلسة بوقت كافٍ."
          }
        },
        {
          title: { en: "Burnout Prevention & Fallback Protocol", ar: "منع الاحتراق الوظيفي وتفعيل البديل" },
          desc: {
            en: "If an instructor has midterms or an emergency, activate the designated backup instructor immediately to prevent breaking promises to trainees.",
            ar: "إذا كان لدى المدرب امتحانات أو طارئ، يتم تفعيل المدرب البديل فوراً لعدم الإخلال بالوعود المقدمة للمتدربين."
          }
        }
      ],
      dosAndDonts: {
        avoid: [
          {
            en: "The 'Prep Bottleneck': Attempting to teach, make slides, and book rooms all at once.",
            ar: "'عنق زجاجة التحضير': محاولة التدريس، تصميم الشرائح، وحجز القاعات في نفس الوقت."
          },
          {
            en: "Showing frustration, impatience, or ego toward slow learners.",
            ar: "إظهار الإحباط أو الغرور أو قلة الصبر تجاه الطلاب بطيئي التعلم."
          }
        ],
        prefer: [
          {
            en: "Strictly protect your calendar for teaching and high-yield mentoring only.",
            ar: "الحماية الصارمة لوقتك للتدريس والتوجيه الأكاديمي فقط."
          },
          {
            en: "Break complex algorithmic topics down patiently with crystal-clear intuition.",
            ar: "تبسيط المواضيع المعقدة بصبر وتوضيح الفكرة الحدسية قبل كتابة الكود."
          }
        ]
      },
      faq: [
        {
          q: {
            en: "What if I don't have presentation slides ready for my session?",
            ar: "ماذا لو لم تكن شرائح العرض جاهزة قبل الجلسة؟"
          },
          a: {
            en: "You should not be scrambling to make them the night before. Confirm slide delivery with the Design Team during your Weekly Readiness Check.",
            ar: "لا ينبغي عليك الارتجال لتصميمها في الليلة السابقة. تأكد من استلامها من فريق التصميم خلال فحص الجاهزية الأسبوعي."
          }
        },
        {
          q: {
            en: "A student is really struggling and slowing down the main session. What do we do?",
            ar: "طالب يواجه صعوبة كبيرة ويبطئ سير الجلسة الرئيسية. ماذا نفعل؟"
          },
          a: {
            en: "Direct them to the dedicated Coach for 1-on-1 mentorship and upsolving support so the main instructor can maintain the session's pace.",
            ar: "وجه الطالب إلى الموجه (Coach) للحصول على دعم فردي وجلسات Upsolve حتى يتمكن المدرب الرئيسي من الحفاظ على وتيرة الجلسة."
          }
        }
      ],
      subRoles: [
        "Level 1 Foundations Instructor",
        "Level 2 Advanced Instructor (DP / Graphs)",
        "Competitive Programming Coach (Upsolving & Mentorship)"
      ]
    }
  },

  "technical": {
    // Alias to instructor
    roleId: "OPS/SPEC-01",
    roleTitle: "THE INSTRUCTOR (TECHNICAL)",
    arabicTitle: "دليل لجنة التدريب والتوجيه (التقنية)",
    levelBadge: "LVL_01",
    version: "4.0.2-STABLE",
    issued: "2026.SEASON",
    location: "CAMPUS/LAB_402_PUA",
    description: "OWN THE ABSTRACTION. TRANSFORM BEGINNERS INTO CODEFORCES MONSTERS. PRESERVE ACADEMIC RIGOR WITH ZERO SOFT CODE.",
    sellingPoints: [
      "Autonomy over the entire technical training pipeline and CP contest structures.",
      "Direct contribution to ICPC global standards for high-energy problem solving.",
      "Mastery over data structures and algorithms."
    ],
    owns: [
      "Problem Set Architecture & Gym Setups",
      "Live Contest Simulations & Code Reviews",
      "Code Auditing and Live Debugging under pressure",
      "The 'Source of Truth' algorithmic standards"
    ],
    metrics: [
      { value: "99%", label: "Runtime Optimization" },
      { value: "<100MS", label: "Core Interaction Latency" },
      { value: "0", label: "TLE Errors per Session" }
    ],
    antiGoals: [
      "NO implementation of 'soft' logic or unoptimized O(n!) routines.",
      "NO consensus-based decision making on fundamental truths.",
      "NO reliance on pure manual grading. Automate everything."
    ],
    themeColor: "#FFD500",
    themeText: "#0F0F0F",
    antiGoalColor: "#FF0055",
    applyUrl: "#register",
        problemsSolved: [
      {
        title: {
          en: "Weak Testcases & Sloppy Problem Integrity",
          ar: "ضعف حالات الاختبار وحلول الالتفاف غير الدقيقة",
        },
        desc: {
          en: "Contests turn into jokes when weak test suites allow brute-force O(N²) solutions to pass optimal O(N log N) limits. Technical specialists build industrial-strength Polygon validators and edge-case generators.",
          ar: "تفقد المسابقات قيمتها عندما تسمح حالات الاختبار الضعيفة بمرور الحلول غير الفعالة. يتولى الفريق التقني هندسة مدخلات اختبار قوية وشاملة باستخدام Polygon وtestlib لمنع أي تجاوزات.",
        },
      },
      {
        title: {
          en: "Contest-Day Platform Latency & System Crashes",
          ar: "أعطال المنصات وبطء التحكيم يوم المسابقة",
        },
        desc: {
          en: "Local judge servers crash under concurrent submission floods, corrupting live scoreboards. Technical architects deploy stress-tested, resilient contest environments with automated telemetry.",
          ar: "انهيار خوادم التحكيم أثناء تسليم الحلول الجماعي يدمر حماس المسابقة. يصمم الفريق التقني بيئات اختبار وسيرفرات ذات موثوقية عالية لمنع أي تأخير أو فقدان للبيانات.",
        },
      },
      {
        title: {
          en: "Missing Post-Contest Analytics & Editorial Vacuum",
          ar: "غياب الشروحات الرسمية والتحليلات البيانية",
        },
        desc: {
          en: "Contests without mathematical proofs, clean model solutions, and failure analytics leave participants confused. Technical specialists publish rigorous editorials and problem telemetry.",
          ar: "انتهاء المسابقة دون تحليل الأخطاء والشروحات الرياضية للحلول يضيع فرصة التعلم. يوثق الفريق حلولاً نموذجية ويحلل أداء المشاركين لتطوير جولات التدريب القادمة.",
        },
      },
    ],
    impact: [
      {
        title: {
          en: "World-Class Contest Engineering",
          ar: "هندسة مسابقات بمعايير ICPC العالمية",
        },
        desc: {
          en: "Ensures every official university contest runs with mathematical perfection, zero leaked solutions, and authentic ICPC-standard judge configurations.",
          ar: "ضمان خروج جميع مسابقات الجامعة بأعلى درجات الانضباط والنزاهة، مع مطابقة شروط ومعايير التحكيم في المسابقات الدولية.",
        },
      },
      {
        title: {
          en: "Real-Time Telemetry & Data-Driven Coaching",
          ar: "تحليلات الأداء اللحظية لتوجيه التدريب",
        },
        desc: {
          en: "Delivers granular submission data and failure classifications to instructors, enabling micro-targeted pedagogical adjustments.",
          ar: "تزويد المدربين ببيانات دقيقة حول نقاط ضعف الطلاب في المسابقات (مثل التردد في DP أو Graph)، لإعادة تصحيح خطة التدريب فوراً.",
        },
      },
      {
        title: {
          en: "Autonomous Gym & Contest Infrastructure",
          ar: "بنية تحتية ذاتية التشغيل للمسابقات والـ Gyms",
        },
        desc: {
          en: "Automates problem uploads, leaderboard freezes, and rating updates, allowing scalable contest hosting with minimal manual overhead.",
          ar: "أتمتة رفع المسائل، تجميد لوحة المتصدرين، وتحديث التقييمات، مما يتيح إقامة مسابقات دورية ضخمة بأقل جهد يدوي ممكن.",
        },
      },
    ],
handbook: {
      vision: {
        en: "Turn beginners into monsters on Codeforces. Elevate students to masters while maintaining a premium, ego-free learning environment. You are an academic machine, not an event planning club.",
        ar: "تحويل المبتدئين إلى وحوش على منصة Codeforces. الارتقاء بالطلاب إلى مستويات متقدمة مع الحفاظ على بيئة تعليمية احترافية وخالية من الغرور. أنتم آلة أكاديمية، ولستم نادياً لتنظيم الفعاليات."
      },
      rolesDistribution: [
        {
          title: { en: "Level 1 Instructor", ar: "مدرب مستوى 1 (Level 1 Instructor)" },
          desc: {
            en: "Dedicated strictly to foundations and basic problem solving (data types, loops, arrays, basic complexity, math).",
            ar: "مخصص حصرياً لتأسيس الطلاب وحل المشكلات الأساسية وتدريب المبتدئين على أوليات التفكير الخوارزمي."
          }
        },
        {
          title: { en: "Level 2 Instructor", ar: "مدرب مستوى 2 (Level 2 Instructor)" },
          desc: {
            en: "Dedicated strictly to advanced algorithmic topics (Dynamic Programming, Graph Theory, Trees, Number Theory, Range Queries).",
            ar: "مخصص حصرياً للمواضيع المتقدمة (مثل: DP، Graphs، خوارزميات الأشجار، ونظريات الأعداد)."
          }
        },
        {
          title: { en: "Competitive Programming Coach", ar: "الموجه (Coach)" },
          desc: {
            en: "Dedicated to post-session upsolving, 1-on-1 mentorship, gym telemetry monitoring, and psychological support.",
            ar: "مخصص لجلسات الحل التكميلية (Upsolving)، الإرشاد الفردي، مراقبة الأداء في الـ Gym، والدعم النفسي."
          }
        }
      ],
      responsibilities: [
        {
          title: { en: "Weekly Curriculum & Performance Audit", ar: "التدقيق الأسبوعي للمنهج والأداء" },
          desc: {
            en: "Analyze trainee solve rates on post-session gyms. If rates are low, restructure the next upsolve session to target the exact comprehension gap.",
            ar: "تحليل معدلات حل المتدربين بعد الجلسات. إذا كانت المعدلات منخفضة، يتم إعادة هيكلة جلسة الـ Upsolve لاستهداف الفجوات تحديداً."
          }
        },
        {
          title: { en: "Weekly Readiness Checks", ar: "فحوصات الجاهزية الأسبوعية" },
          desc: {
            en: "Verify that your 'Session Flow' is defined and confirm receipt of presentation slides from the Design team well before the session.",
            ar: "التأكد من وضوح تسلسل الجلسة واستلام شرائح العرض من فريق التصميم قبل الجلسة بوقت كافٍ."
          }
        },
        {
          title: { en: "Burnout Prevention & Fallback Protocol", ar: "منع الاحتراق الوظيفي وتفعيل البديل" },
          desc: {
            en: "If an instructor has midterms or an emergency, activate the designated backup instructor immediately to prevent breaking promises to trainees.",
            ar: "إذا كان لدى المدرب امتحانات أو طارئ، يتم تفعيل المدرب البديل فوراً لعدم الإخلال بالوعود المقدمة للمتدربين."
          }
        }
      ],
      dosAndDonts: {
        avoid: [
          {
            en: "The 'Prep Bottleneck': Attempting to teach, make slides, and book rooms all at once.",
            ar: "'عنق زجاجة التحضير': محاولة التدريس، تصميم الشرائح، وحجز القاعات في نفس الوقت."
          },
          {
            en: "Showing frustration, impatience, or ego toward slow learners.",
            ar: "إظهار الإحباط أو الغرور أو قلة الصبر تجاه الطلاب بطيئي التعلم."
          }
        ],
        prefer: [
          {
            en: "Strictly protect your calendar for teaching and high-yield mentoring only.",
            ar: "الحماية الصارمة لوقتك للتدريس والتوجيه الأكاديمي فقط."
          },
          {
            en: "Break complex algorithmic topics down patiently with crystal-clear intuition.",
            ar: "تبسيط المواضيع المعقدة بصبر وتوضيح الفكرة الحدسية قبل كتابة الكود."
          }
        ]
      },
      faq: [
        {
          q: {
            en: "What if I don't have presentation slides ready for my session?",
            ar: "ماذا لو لم تكن شرائح العرض جاهزة قبل الجلسة؟"
          },
          a: {
            en: "You should not be scrambling to make them the night before. Confirm slide delivery with the Design Team during your Weekly Readiness Check.",
            ar: "لا ينبغي عليك الارتجال لتصميمها في الليلة السابقة. تأكد من استلامها من فريق التصميم خلال فحص الجاهزية الأسبوعي."
          }
        },
        {
          q: {
            en: "A student is really struggling and slowing down the main session. What do we do?",
            ar: "طالب يواجه صعوبة كبيرة ويبطئ سير الجلسة الرئيسية. ماذا نفعل؟"
          },
          a: {
            en: "Direct them to the dedicated Coach for 1-on-1 mentorship and upsolving support so the main instructor can maintain the session's pace.",
            ar: "وجه الطالب إلى الموجه (Coach) للحصول على دعم فردي وجلسات Upsolve حتى يتمكن المدرب الرئيسي من الحفاظ على وتيرة الجلسة."
          }
        }
      ],
      subRoles: [
        "Level 1 Foundations Instructor",
        "Level 2 Advanced Instructor (DP / Graphs)",
        "Competitive Programming Coach (Upsolving & Mentorship)"
      ]
    }
  },

  "ops-pr": {
    roleId: "OPS/SPEC-02",
    roleTitle: "OPERATIONS & PR",
    arabicTitle: "دليل لجنة العمليات والعلاقات العامة (Operations & PR)",
    levelBadge: "LVL_02",
    version: "4.0.2-STABLE",
    issued: "2026.SEASON",
    location: "CAMPUS/COMMMS_DESK",
    description: "DOMINATE THE BRAND. EXECUTE WITH SURGICAL LOGISTICAL PRECISION. BUILD AND PROTECT THE PREMIUM FEEL.",
    sellingPoints: [
      "Autonomy over all external communications arrays and physical event staging.",
      "Direct control over the community's public perception and prestigious voice.",
      "The power to craft viral messaging that converts social followers into active members."
    ],
    owns: [
      "External Comms Arrays & WhatsApp Channels",
      "Campus Event Staging & Lab Logistics",
      "Social media presence and high-impact announcements",
      "Logistical operations during live on-campus contests"
    ],
    metrics: [
      { value: "95%", label: "Engagement Velocity" },
      { value: ">5K", label: "Monthly Impressions" },
      { value: "48H", label: "Min Room Booking Lock" }
    ],
    antiGoals: [
      "NO standard templates. Every post must be a statement.",
      "NO delay in PR responses to internal crises.",
      "NO 'student activity' vibes. Maintain tech incubator professionalism."
    ],
    themeColor: "#00E5FF", // Cyan
    themeText: "#0F0F0F",
    antiGoalColor: "#7B2CBF", // Purple
    applyUrl: "#register",
        problemsSolved: [
      {
        title: {
          en: "Campus Bureaucracy & Lab Booking Bottlenecks",
          ar: "بيروقراطية الموافقات وحجز المعامل الجامعية",
        },
        desc: {
          en: "Workshops and live mock contests face sudden cancellations when facility permissions stall. Ops-PR builds rock-solid diplomatic ties with university leadership, IT, and facility administration.",
          ar: "تتعرض الفعاليات للإلغاء المفاجئ بسبب تأخر تصاريح القاعات والمعامل. يتولى فريق العلاقات العامة التنسيق الدبلوماسي مع إدارة الجامعة والعمادة لتأمين كافة التراخيص مسبقاً.",
        },
      },
      {
        title: {
          en: "Chaotic Offline Event Logistics & Hardware Fails",
          ar: "فوضى التنظيم الميداني وأعطال الأجهزة والشبكة",
        },
        desc: {
          en: "Power fluctuations, missing network cables, and unallocated seats turn 100-student contests into mayhem. Ops-PR enforces strict site-inspection checklists and backup power protocols.",
          ar: "انقطاع الإنترنت أو نقص الكابلات وسوء توزيع المقاعد قد يفشل أي مسابقة حضورية. يضع الفريق خطط طوارئ صارمة تضمن جاهزية كل جهاز ومقعد قبل بدء الحدث بساعات.",
        },
      },
      {
        title: {
          en: "Industry Isolation & Sponsorship Deficits",
          ar: "عزلة الكيان عن مجتمع التكنولوجيا والشركات الراعية",
        },
        desc: {
          en: "Student communities starve for lack of resources, prize pools, and professional mentorship. Ops-PR pitches corporate sponsors and invites senior industry engineers to campus.",
          ar: "تعاني الأنشطة الطلابية من غياب الميزانيات والجوائز المادية. يفتح الفريق قنوات اتصال مع كبرى شركات البرمجيات لرعاية المسابقات وتوفير فرص تدريب ومكافآت للمتميزين.",
        },
      },
    ],
    impact: [
      {
        title: {
          en: "Zero-Latency Event Orchestration",
          ar: "تنفيذ الفعاليات بانسيابية ودقة تشغيلية مطلقة",
        },
        desc: {
          en: "100% on-schedule contest kickoffs, seamless participant check-in, and flawless crowd logistics across all university facilities.",
          ar: "بدء الفعاليات في الموعد المحدد بنسبة 100%، وتسهيل دخول المتسابقين وتوفير بيئة هادئة ومثالية للتركيز الذهني.",
        },
      },
      {
        title: {
          en: "Academic & Engineering Time Insulation",
          ar: "عزل المدربين والمتسابقين عن المشتتات الإدارية",
        },
        desc: {
          en: "Shields technical leads and problem setters from logistical friction, preserving their cognitive energy entirely for algorithms.",
          ar: "تفريغ المدربين والمتسابقين تماماً من أي عناء تنظيمي أو أوراق رسمية، ليتفرغوا بنسبة 100% للتدريب والحل والإبداع.",
        },
      },
      {
        title: {
          en: "Institutional Clout & Official University Backing",
          ar: "ترسيخ المكانة الرسمية للمجتمع كواجهة مشرفة للجامعة",
        },
        desc: {
          en: "Establishes ICPC PUA as the gold-standard student organization, commanding premier halls, administrative fast-tracks, and regional recognition.",
          ar: "جعل مجتمع ICPC الكيان الطلابي الأكثر تقديراً واعتماداً لدى رئاسة الجامعة وعمداء الكليات بفضل الاحترافية والمصداقية.",
        },
      },
    ],
handbook: {
      vision: {
        en: "Build and protect the corporate-level 'Premium Feel' of the ICPC PUA community to the outside world. You own the logistics, the external image, and the conversion funnel.",
        ar: "بناء وحماية 'الطابع الاحترافي' الفاخر لمجتمع ICPC PUA أمام العالم الخارجي. أنتم تديرون اللوجستيات، الصورة الخارجية، ومسار تحويل المتابعين إلى مشاركين."
      },
      rolesDistribution: [
        {
          title: { en: "Social Media & Content Officer", ar: "مسؤول المحتوى والسوشيال ميديا" },
          desc: {
            en: "Manages social media posts, session reels, contest shorts, and scheduled brand messaging.",
            ar: "إدارة المنشورات، مقاطع الجلسات، والفيديوهات القصيرة، وجدولة خطة النشر."
          }
        },
        {
          title: { en: "Logistics & OC Officer", ar: "مسؤول اللوجستيات والتنظيم (OC)" },
          desc: {
            en: "Handles university and dean paperwork, lab/hall reservations, equipment audits, and on-ground coordination.",
            ar: "التعامل مع موافقات العميد، حجز القاعات، وتجهيز الأجهزة التقنية وتنظيم الفعاليات الفعلية."
          }
        },
        {
          title: { en: "External Relations Officer", ar: "مسؤول العلاقات الخارجية" },
          desc: {
            en: "Maintains outreach with industry professionals, tech influencers, alumni, and other university CP communities.",
            ar: "التواصل مع المهنيين، المؤثرين، الخريجين، ومجتمعات الجامعات الأخرى لتعزيز الشراكات."
          }
        }
      ],
      responsibilities: [
        {
          title: { en: "Weekly Campaign & Logistics Audit", ar: "التدقيق الأسبوعي للحملات واللوجستيات" },
          desc: {
            en: "Ensure all visual assets from Design are pre-scheduled. Confirm all university paperwork, room bookings, and IT equipment are 100% secured at least 48 hours before any offline session.",
            ar: "التأكد من جدولة كافة التصاميم. تأكيد استخراج الأوراق الجامعية وحجز القاعات والأجهزة التقنية بنسبة 100% قبل 48 ساعة على الأقل من أي فعالية."
          }
        },
        {
          title: { en: "Metrics & Conversion Review", ar: "مراجعة المقاييس ومسار التحويل" },
          desc: {
            en: "Analyze social media reach, event turnout, and application numbers. Adjust strategies immediately to fix any engagement drops.",
            ar: "تحليل مدى الوصول على الشبكات الاجتماعية، نسبة الحضور، وأعداد المتقدمين. تعديل الاستراتيجيات لحل أي انخفاض في التفاعل."
          }
        },
        {
          title: { en: "Communication Quality Control", ar: "مراقبة جودة التواصل والصوت المؤسسي" },
          desc: {
            en: "Audit all outgoing public messages (WhatsApp, emails, social posts) to ensure they match the elite brand identity.",
            ar: "التدقيق في جميع الرسائل العامة الصادرة (واتساب، رسائل بريد، منشورات) لضمان توافقها مع الهوية النخبوية للعلامة التجارية."
          }
        }
      ],
      dosAndDonts: {
        avoid: [
          {
            en: "'Zero Marketing' dead zones and radio silence between events.",
            ar: "فترات 'انقطاع التسويق' والغياب الطويل عن السوشيال ميديا."
          },
          {
            en: "Unverified room bookings or chaotic, unprofessional student-club formatting in public groups.",
            ar: "حجوزات القاعات غير المؤكدة، والتنسيق الفوضوي للمنشورات كأندية الطلاب التقليدية."
          }
        ],
        prefer: [
          {
            en: "Maintain a consistent, hyped, and highly professional online presence.",
            ar: "الحفاظ على حضور احترافي، مستمر، وحماسي على الإنترنت."
          },
          {
            en: "Convert passive social media likes into active Discord members and actual physical contest attendance.",
            ar: "تحويل الإعجابات والمتابعين إلى أعضاء فاعلين على Discord وحضور حقيقي في المعامل."
          }
        ]
      },
      faq: [
        {
          q: {
            en: "When is the absolute latest we can secure a room booking?",
            ar: "ما هو الموعد النهائي لتأكيد حجز القاعة؟"
          },
          a: {
            en: "All university paperwork and room bookings must be 100% secured at least 48 hours prior to any offline session.",
            ar: "يجب استكمال جميع الأوراق الجامعية وتأكيد الحجز بنسبة 100% قبل 48 ساعة على الأقل من أي جلسة فعلية."
          }
        },
        {
          q: {
            en: "Can an instructor post an update in the public WhatsApp group?",
            ar: "هل يمكن لأحد المدربين نشر تحديث في مجموعة الواتساب العامة؟"
          },
          a: {
            en: "No. All outgoing public messages must pass through Operations/PR for quality control to ensure formatting matches our premium brand identity.",
            ar: "لا. يجب أن تمر جميع الرسائل العامة عبر لجنة العمليات/العلاقات العامة لمراقبة الجودة وتنسيقها بما يطابق هويتنا الاحترافية."
          }
        }
      ],
      subRoles: [
        "Social Media & Content Officer",
        "Logistics & OC Officer (Paperwork & Room Lock)",
        "External Relations & Alumni Liaison"
      ]
    }
  },

  "hr": {
    roleId: "OPS/SPEC-03",
    roleTitle: "HR / MONITORING",
    arabicTitle: "دليل لجنة الموارد البشرية (HR)",
    levelBadge: "LVL_03",
    version: "4.0.2-STABLE",
    issued: "2026.SEASON",
    location: "CONFIDENTIAL/CORE_NODE",
    description: "GUARDIANS OF PSYCHOLOGICAL SAFETY. SYSTEM INTEGRITY ENFORCERS. RESOLVE CONFLICTS QUIETLY AND OBJECTIVELY.",
    sellingPoints: [
      "Authority over conflict resolution protocols and system-wide integrity audits.",
      "Direct oversight over member well-being and psychological safety in high-stress contest environments.",
      "Design the onboarding and evaluation pipelines utilized across all committees."
    ],
    owns: [
      "Dedicated Committee Monitoring & Conflict Log",
      "Trainee Well-Being & Stress Insulation",
      "Weekly Regulatory Audits & 48h Delay Tracker",
      "Quiet 3-Strike Offboarding & Access Revocation"
    ],
    metrics: [
      { value: "98%", label: "Retention Stability" },
      { value: "<24H", label: "Conflict Resolution Time" },
      { value: "100%", label: "Meeting Task Documentation" }
    ],
    antiGoals: [
      "NO endless paperwork loops. Ensure processes are lean and Brutalist.",
      "NO arbitrary evaluation metrics. Rely strictly on quantitative, documented data.",
      "NO public drama or venting in open communication channels."
    ],
    themeColor: "#7B2CBF", // Purple
    themeText: "#FFFFFF",
    antiGoalColor: "#FFD500", // Yellow
    applyUrl: "#register",
        problemsSolved: [
      {
        title: {
          en: "Mid-Season Ghosting & Volunteer Burnout",
          ar: "الاحتراق النفسي واختفاء الأعضاء منتصف الموسم",
        },
        desc: {
          en: "Student teams collapse when key members disappear during midterms. HR implements strict 48-hour delay notices, healthy shift rotations, and early burnout intervention.",
          ar: "انهيار العديد من الأنشطة بسبب انسحاب الأعضاء فجأة وقت الامتحانات. يطبق فريق الموارد البشرية بروتوكول إشعار الـ 48 ساعة المسبق، مع توزيع الأحمال بالتساوي.",
        },
      },
      {
        title: {
          en: "The Martyrdom Trap & Single-Point-of-Failure",
          ar: "فخ التضحية الفردية واحتكار المهام",
        },
        desc: {
          en: "A single overloaded leader doing everyone's job bottlenecks the community. HR enforces role boundaries, clear deliverables, and mandatory peer shadow training.",
          ar: "محاولة شخص واحد حمل كل المسؤوليات تخلق عنق زجاجة وتهدد استقرار الكيان. يضمن الـ HR وجود نواب مدربين وتوثيقاً كاملاً لكل مهمة لمنع الاعتماد على الفرد.",
        },
      },
      {
        title: {
          en: "Destructive Ego Clashes & Communication Breakdowns",
          ar: "صراعات الغرور وتصدع التواصل الداخلي",
        },
        desc: {
          en: "Passionate debates turn into personal feuds, fracturing committees. HR executes the 'Ego is the Enemy' protocol and mandatory 24-hour cool-down mediation.",
          ar: "تحول النقاشات الحادة إلى خلافات شخصية يفسد بيئة العمل. يدير الـ HR بروتوكول فض النزاعات وفترة التهدئة الإلزامية (24h Cool-down) باحترافية وتجرد تام.",
        },
      },
    ],
    impact: [
      {
        title: {
          en: "Unbreakable Season-Long Operational Continuity",
          ar: "استمرارية مؤسسية صلبة طوال أشهر الموسم",
        },
        desc: {
          en: "Zero orphaned tasks, zero stalled committees, and complete operational readiness across all 7 months of intensive training.",
          ar: "انعدام المهام المعلقة أو اللجان المتعطلة، وضمان استمرار العمل التدريبي واللوجستي بنفس القوة من أول يوم وحتى ختام الموسم.",
        },
      },
      {
        title: {
          en: "Psychological Safety & High-Retention Culture",
          ar: "بيئة محفزة وآمنة نفسياً تضمن ولاء واستمرار الفريق",
        },
        desc: {
          en: "Members feel heard, supported, and recognized, fostering deep mutual trust and the highest volunteer retention rate on campus.",
          ar: "بناء مناخ يشعر فيه كل فرد بالتقدير والملاحظة الإيجابية، مما يخلق رابطة ولاء حقيقية ويقضي على ظاهرة التسرب الطلابي.",
        },
      },
      {
        title: {
          en: "Next-Generation Leadership Pipeline",
          ar: "إعداد وتأهيل قادة المستقبل لإدارة المجتمع",
        },
        desc: {
          en: "Mentors high-potential junior coordinators into battle-tested future board leaders, ensuring long-term institutional succession.",
          ar: "اكتشاف الكفاءات الشابة مبكراً وتدريبهم عملياً على مهارات القيادة، ليقودوا مجتمع ICPC PUA في المواسم القادمة بسلاسة.",
        },
      },
    ],
handbook: {
      vision: {
        en: "You are the guardians of the community's psychological safety and operational systems. Your goal is to protect the 'Premium Feel' of the community, manage conflicts quietly, and ensure zero operational fires.",
        ar: "أنتم حراس الأمان النفسي والنظام التشغيلي للمجتمع. هدفكم هو الحفاظ على 'الطابع الاحترافي' (Premium Feel) للمجتمع، إدارة النزاعات بهدوء، ومنع حدوث أي أزمات تشغيلية."
      },
      rolesDistribution: [
        {
          title: { en: "Dedicated HR Committee Officer", ar: "مسؤول موارد بشرية مخصص لكل لجنة" },
          desc: {
            en: "At least one HR officer must be assigned specifically to monitor each core committee (Technical, Operations/PR, Marketing, Design/Dev).",
            ar: "يجب تعيين مسؤول موارد بشرية واحد على الأقل لمراقبة كل لجنة أساسية (مثل: التقنية، العلاقات العامة، التسويق، التصميم/التطوير)."
          }
        },
        {
          title: { en: "Onboarding & Culture Gatekeeper", ar: "مسؤول الاستقطاب والثقافة المؤسسية" },
          desc: {
            en: "Vets recruits for zero ego, enforces the Universal Rules, and executes quiet offboarding protocols.",
            ar: "فحص الأعضاء الجدد لضمان عقلية 'خالية من الغرور' وتطبيق قواعد المجتمع وإدارة الخروج الهادئ."
          }
        }
      ],
      responsibilities: [
        {
          title: { en: "The Weekly Regulatory Audit", ar: "التدقيق الرقابي الأسبوعي" },
          desc: {
            en: "Check the calendar against 48-hour delay notices to spot bottlenecks, ensure all meetings end with documented action items, and maintain the private conflict log.",
            ar: "مراجعة الجدول الزمني ومطابقته مع إشعارات التأخير (48 ساعة) لاكتشاف العقبات، التأكد من خروج كافة الاجتماعات بمهام موثقة، وإدارة سجل النزاعات السري."
          }
        },
        {
          title: { en: "Trainee Protection & Stress Shielding", ar: "حماية المتدربين من ضغوط الفريق الداخلي" },
          desc: {
            en: "Randomly audit how Instructors handle slow learners to ensure internal team stress is never passed on to trainees.",
            ar: "التدقيق العشوائي في كيفية تعامل المدربين مع الطلاب بطيئي التعلم لضمان عدم انتقال ضغط الفريق الداخلي إلى المتدربين."
          }
        },
        {
          title: { en: "Gatekeeping & Strike System Enforcement", ar: "إدارة الدخول والخروج ونظام الإنذارات" },
          desc: {
            en: "Enforce the 24-hour cool-down protocol on disputes. Handle the quiet, drama-free offboarding of members reaching Strike 3.",
            ar: "فحص الأعضاء لضمان عقلية خالية من الغرور، وتفعيل بروتوكول التهدئة، واستبعاد الأعضاء الذين يصلون للإنذار الثالث بهدوء وبدون دراما."
          }
        }
      ],
      dosAndDonts: {
        avoid: [
          {
            en: "Public drama, venting in open group chats, or allowing toxic finger-pointing to breed.",
            ar: "الدراما العلنية، التذمر في المجموعات العامة، أو السماح بنمو ثقافة سامة وتبادل اللوم."
          },
          {
            en: "Stepping outside your lane to perform event logistics or tech prep.",
            ar: "الخروج عن مسارك ومحاولة تنظيم الفعاليات لوجستياً بدلاً من حماية النظام."
          }
        ],
        prefer: [
          {
            en: "Objective, quiet enforcement of the Strike System and documentation in the private HR Ledger.",
            ar: "التطبيق الموضوعي والهادئ لنظام الإنذارات وتوثيق الوقائع في السجل الخاص."
          },
          {
            en: "Proactively de-escalating interpersonal tensions before they turn into operational bottlenecks.",
            ar: "حل المشكلات استباقياً وتهدئة التوترات الفردية بهدوء قبل أن تتفاقم وتعطل العمل."
          }
        ]
      },
      faq: [
        {
          q: {
            en: "How do we handle a team member who constantly misses deadlines?",
            ar: "كيف نتعامل مع عضو يتأخر دائماً في تسليم مهامه؟"
          },
          a: {
            en: "Address the issue directly with the person. If it continues, log it in the HR Ledger, issue a strike, and initiate the 24-hour cool-down protocol. If they hit Strike 3, execute a quiet offboarding.",
            ar: "واجه الشخص مباشرة بالمشكلة. إذا استمر التأخير، قم بتسجيل ذلك في سجل الموارد البشرية، وجه إنذاراً، وقم بتفعيل بروتوكول التهدئة لمدة 24 ساعة. إذا وصل للإنذار الثالث، يتم استبعاده بهدوء."
          }
        },
        {
          q: {
            en: "Should HR help with organizing events if the OC team is short-handed?",
            ar: "هل يجب على الموارد البشرية المساعدة في تنظيم الفعاليات إذا كان فريق العمليات يعاني من نقص العدد؟"
          },
          a: {
            en: "No. Stick to the division of labor. HR's job is to monitor and protect the system, not to execute logistics.",
            ar: "لا. التزم بتقسيم العمل الصارم. دور الموارد البشرية هو حماية النظام ومراقبته، وليس تنفيذ المهام اللوجستية."
          }
        }
      ],
      subRoles: [
        "Dedicated Technical HR Officer",
        "Operations & PR HR Monitor",
        "Design & Dev HR Monitor",
        "Culture & Onboarding Gatekeeper"
      ]
    }
  },

  "marketing": {
    roleId: "OPS/SPEC-05",
    roleTitle: "SPECIALISED MARKETING",
    arabicTitle: "دليل التسويق المتخصص (Specialised Marketing)",
    levelBadge: "LVL_05",
    version: "4.0.2-STABLE",
    issued: "2026.SEASON",
    location: "REMOTE/CAMPUS_OMNIPRESENCE",
    description: "STOP POSTING AND PRAYING. BUILD AN OMNIPRESENT GROWTH ENGINE. POSITION ICPC PUA AS THE ELITE PIPELINE TO BIG TECH.",
    sellingPoints: [
      "Autonomy over recruitment campaigns reaching thousands of university engineering students.",
      "Collaborate with top software alumni at Meta, Google, and Amazon for external credibility.",
      "Drive high-voltage gamification and hype around campus leaderboard rockstars."
    ],
    owns: [
      "On-Campus Ground Recruitment & Lecture Infiltration",
      "Digital Broadcaster & Short-Form Video Pipeline",
      "Hall of Fame & Leaderboard Gamified Hype Engine",
      "Conversion Funnel Telemetry (Impressions to Solvers)"
    ],
    metrics: [
      { value: "3.5X", label: "Registration Conversion Multiplier" },
      { value: "100%", label: "Weekly Leaderboard Hype Coverage" },
      { value: "0", label: "Zero Passive 'Post & Pray' Posts" }
    ],
    antiGoals: [
      "NO passive 'come learn coding' announcements.",
      "NO staying in the university bubble; pull in tech industry validation.",
      "NO counting vanity likes over actual form signups and Discord joins."
    ],
    themeColor: "#FF6B00", // Orange
    themeText: "#FFFFFF",
    antiGoalColor: "#7B2CBF", // Purple
    applyUrl: "#register",
        problemsSolved: [
      {
        title: {
          en: "The 'Only for Geniuses' Intimidation Myth",
          ar: "خرافة أن حل المشكلات والـ ICPC مخصص للعباقرة فقط",
        },
        desc: {
          en: "Ambitious students shy away from competitive programming because they believe it requires mathematical genius. Marketing reframes problem solving as a systematic skill accessible to all.",
          ar: "يعزف آلاف الطلاب عن المسابقات ظناً منهم أنها حكر على نوابغ الرياضيات. يفكك فريق التسويق هذا الوهم، ويوضح أن التفكير الخوارزمي مهارة تُكتسب بالتدريب المنظم.",
        },
      },
      {
        title: {
          en: "Freshmen Informational Vacuum",
          ar: "الفجوة المعرفية لدى طلاب السنوات الأولى",
        },
        desc: {
          en: "New students discover ICPC in their senior year when it is too late. Marketing deploys aggressive, targeted orientation campaigns reaching freshmen in their first 14 days on campus.",
          ar: "يكتشف أغلب الطلاب أهمية الـ Problem Solving متأخرين في سنوات التخرج. يستهدف التسويق الطلاب الجدد في أسابيعهم الأولى لتوجيه مسارهم الجامعي مبكراً.",
        },
      },
      {
        title: {
          en: "Uncelebrated Victories & Vanishing Momentum",
          ar: "ضياع الإنجازات في صمت وخفوت الحماس",
        },
        desc: {
          en: "When student rating jumps and contest milestones go unrecognized, community morale wanes. Marketing spotlight campaigns turn every breakthrough into campus-wide inspiration.",
          ar: "عدم تسليط الضوء على إنجازات الطلاب وتطور تصنيفاتهم يقلل من حماس البقية. يوثق الفريق قصص النجاح ويحول الأبطال إلى قدوة ملهمة داخل الجامعة وخارجها.",
        },
      },
    ],
    impact: [
      {
        title: {
          en: "Record-Breaking Training Cohort Intake",
          ar: "أكبر معدل تسجيل وتفاعل في تاريخ مجتمع الجامعة",
        },
        desc: {
          en: "Funnels hundreds of high-intent, passionate students into training cohorts, maximizing applicant quality and long-term retention.",
          ar: "جذب مئات الطلاب ذوي الشغف العالي لصفوف التدريب، مما يرفع من جودة التنافس داخل القاعات ويضمن استمرار أعداد كبيرة حتى النهاية.",
        },
      },
      {
        title: {
          en: "Campus Cultural Movement",
          ar: "تحويل ثقافة الـ Problem Solving إلى أسلوب حياة بالكلية",
        },
        desc: {
          en: "Transforms competitive programming from a niche club into the single most prestigious, aspirational extracurricular community at Pharos University.",
          ar: "جعل البرمجة التنافسية النشاط الأبرز والأكثر هيبة بين جميع الأنشطة الطلابية بالكلية، ومحط فخر أعضاء هيئة التدريس والطلاب.",
        },
      },
      {
        title: {
          en: "Alumni Network & Tech Industry Magnet",
          ar: "جذب أنظار الخريجين ومسؤولي التوظيف في كبرى الشركات",
        },
        desc: {
          en: "Amplifies community milestones on LinkedIn and professional media, attracting tech recruiters, hiring managers, and proud alumni sponsors.",
          ar: "نشر قصص تفوق الطلاب ومشاريعهم على المنصات المهنية، مما يربط طلاب مجتمع ICPC PUA بفرص عمل وتدريب حصرية في كبرى الشركات.",
        },
      },
    ],
handbook: {
      vision: {
        en: "Stop relying on 'post and pray' messaging. Build an active, omnipresent growth engine. Position ICPC PUA as an elite tech incubator and the ultimate pipeline to top-tier tech companies.",
        ar: "التوقف عن سياسة 'النشر والانتظار'. بناء محرك نمو نشط يتواجد في كل مكان. تقديم ICPC PUA كحاضنة نخبوية تقنية وأفضل مسار للوصول إلى كبرى شركات التكنولوجيا."
      },
      rolesDistribution: [
        {
          title: { en: "On-Campus Officer (The Ground Game)", ar: "مسؤول التواجد داخل الحرم الجامعي (The Ground Game)" },
          desc: {
            en: "Dedicated to physical recruitment, in-person lecture shout-outs, interactive campus booths, and face-to-face peer recruitment inside PUA.",
            ar: "مخصص للتجنيد الميداني، إعلانات المحاضرات، والأكشاك الفعلية والتواصل المباشر مع الطلاب داخل PUA."
          }
        },
        {
          title: { en: "Digital & Off-Campus Officer (The Broadcaster)", ar: "مسؤول التسويق الرقمي والخارجي (The Broadcaster)" },
          desc: {
            en: "Manages the multi-channel content calendar, viral short-form clips, and relationship building with tech influencers and alumni.",
            ar: "يدير جدول السوشيال ميديا، توزيع المقاطع القصيرة الفيروسية، والتواصل مع المؤثرين التقنيين والخريجين."
          }
        },
        {
          title: { en: "Engagement Officer (The Hype Builder)", ar: "مسؤول التفاعل وصناعة الحماس (The Hype Builder)" },
          desc: {
            en: "Focuses on the psychology of student belonging, celebrating trainee contest wins, and building celebrity status around top leaderboard coders.",
            ar: "يركز على سيكولوجية الانتماء الطلابي، الاحتفاء بانتصارات المتدربين، وتسويق لوحات الصدارة (Leaderboards) كنجوم للحرم الجامعي."
          }
        }
      ],
      responsibilities: [
        {
          title: { en: "Weekly Campaign & Outreach Audit", ar: "التدقيق الأسبوعي للحملات والتواصل" },
          desc: {
            en: "Verify that all flyers and reels are received from Design and scheduled. Analyze the conversion funnel (likes vs. actual registrations).",
            ar: "التأكد من استلام وجدولة المنشورات من فريق التصميم. تحليل مسار التحويل (الإعجابات مقابل التسجيلات الفعلية)."
          }
        },
        {
          title: { en: "Storytelling & Positive Framing", ar: "سرد القصص والإطار الإيجابي المرموق" },
          desc: {
            en: "Dictate the narrative. Frame the community as 'building the top 1% of engineers' and highlight the prestige of the ECPC rather than emphasizing difficulty.",
            ar: "التحكم في الرواية. الترويج للمجتمع بأنه 'يصنع أعلى 1% من المهندسين' وإبراز هيبة الـ ECPC بدلاً من التركيز على صعوبة البرمجة."
          }
        },
        {
          title: { en: "Gamified Hype Coordination", ar: "خلق الحماس المُلعب بالتنسيق مع فريق التطوير" },
          desc: {
            en: "Work with the Dev team to market the 'Hall of Fame' and weekly trainee leaderboards, making top trainees feel like campus rockstars.",
            ar: "التعاون مع فريق التطوير (Dev) للترويج لـ 'قاعة المشاهير' ولوحات الصدارة الأسبوعية، لجعل المتدربين المتفوقين يشعرون كنجوم الحرم الجامعي."
          }
        }
      ],
      dosAndDonts: {
        avoid: [
          {
            en: "Staying in an isolated university bubble without external industry validation.",
            ar: "الانعزال داخل فقاعة الجامعة دون إبراز قصص نجاح الخريجين والشركات الكبرى."
          },
          {
            en: "Using negative or intimidating framing in announcements ('competitive coding is brutally hard').",
            ar: "استخدام الإطارات السلبية أو المنفّرة في الرسائل ('البرمجة التنافسية بالغة الصعوبة ولا تنام')."
          }
        ],
        prefer: [
          {
            en: "Build relationships with alumni software engineers to give external credibility to training tracks.",
            ar: "بناء شبكة علاقات مع الخريجين الذين أصبحوا مهندسي برمجيات لإضافة مصداقية خارجية واستقطاب متدربين."
          },
          {
            en: "Focus actively on the psychology of student belonging and friendly competitive prestige.",
            ar: "التركيز بنشاط على سيكولوجية الانتماء والمنافسة الشريفة بين الطلاب."
          }
        ]
      },
      faq: [
        {
          q: {
            en: "How do we measure the success of a marketing campaign?",
            ar: "كيف نقيس نجاح أي حملة تسويقية؟"
          },
          a: {
            en: "Do not just count 'likes' or 'views.' Analyze the funnel to see how many interactions actually converted into form registrations or Discord joins.",
            ar: "لا تكتفِ بعدد 'الإعجابات' أو 'المشاهدات'. قم بتحليل مسار التحويل لترى كم عدد التفاعلات التي تحولت فعلياً إلى تسجيلات في النماذج أو انضمام على Discord."
          }
        },
        {
          q: {
            en: "How should we advertise our training sessions?",
            ar: "كيف يجب أن نعلن عن جلسات التدريب الخاصة بنا؟"
          },
          a: {
            en: "Use positive framing. Instead of 'come learn programming,' use messaging like 'Come claim your spot on the leaderboard' and emphasize the prestige of becoming a top 1% engineer.",
            ar: "استخدم الإطار الإيجابي. بدلاً من 'تعال لتعلم البرمجة'، استخدم رسائل مثل 'تعال لحجز مكانك في لوحة الصدارة' وركز على مكانة وهيبة أن تصبح مهندساً من صفوة الـ 1%."
          }
        }
      ],
      subRoles: [
        "The Ground Game (On-Campus Recruitment Lead)",
        "The Broadcaster (Digital Content & Shorts Director)",
        "The Hype Builder (Student Belonging & Gamification)"
      ]
    }
  },

  "design-dev": {
    roleId: "OPS/SPEC-04",
    roleTitle: "DESIGN / DEV",
    arabicTitle: "دليل لجنة التصميم والتطوير (Design & Dev)",
    levelBadge: "LVL_04",
    version: "4.0.2-STABLE",
    issued: "2026.SEASON",
    location: "REMOTE/FRONTEND_CORE",
    description: "CREATIVE MAXIMALISM. MAKE ICPC PUA LOOK LIKE AN ELITE TECH STARTUP. AUTOMATE BUSYWORK TO ELIMINATE BURNOUT.",
    sellingPoints: [
      "Autonomy over the Electric Blueprint UI/UX and core web platform.",
      "Build robust, high-performance web components utilizing bleeding-edge frameworks.",
      "Zero boundaries on creative maximalist expression."
    ],
    owns: [
      "Design System Blueprint & Creative Maximalism Assets",
      "Full-Stack Next.js Deployment & Performance",
      "Discord Automation Bots & Process Scripts",
      "Presentation Deck Pipeline for Technical Instructors"
    ],
    metrics: [
      { value: "100", label: "System Aesthetic Score" },
      { value: "<200MS", label: "Time-to-Interactive" },
      { value: "0", label: "Soft Shadows Allowed" }
    ],
    antiGoals: [
      "NO implementation of 'soft' UI. No curved border radius.",
      "NO reliance on generic out-of-the-box templates.",
      "NO late delivery of slide decks to technical instructors."
    ],
    themeColor: "#FF0055", // Pink
    themeText: "#FFFFFF",
    antiGoalColor: "#00E5FF", // Cyan
    applyUrl: "#register",
        problemsSolved: [
      {
        title: {
          en: "Amateur Design Slop & Generic Student Aesthetics",
          ar: "عشوائية التصاميم والملصقات الطلابية التقليدية",
        },
        desc: {
          en: "Generic Canva templates and sloppy graphics signal a low-quality community. Design-Dev crafts an unmistakable Neobrutalist design system with high-voltage visual authority.",
          ar: "التصاميم الرديئة والقوالب المستهلكة تعطي انطباعاً بعدم الاحترافية. يبني فريق التصميم هوية بصرية متمردة وقوية (Neobrutalism) تفرض هيبتها وتخطف الأنظار فوراً.",
        },
      },
      {
        title: {
          en: "Manual Form Chaos & Data Fragmentation",
          ar: "فوضى النماذج اليدوية وتشتت بيانات المسجلين",
        },
        desc: {
          en: "Relying on clunky Google Forms causes missing entries, slow response times, and broken pipelines. Design-Dev builds custom, ultra-fast web platforms with zero downtime.",
          ar: "الاعتماد على نماذج بدائية يسبب ضياع بيانات الطلاب وبطء المتابعة. يطور الفريق منصات ويب مخصصة وسريعة تليق بمجتمع متخصص في علوم الحاسب.",
        },
      },
      {
        title: {
          en: "Incomprehensible Algorithmic Visuals & Slide Scramble",
          ar: "صعوبة تصور الخوارزميات وتشتت الشرائح التعليمية",
        },
        desc: {
          en: "Complex data structures (trees, graphs, DP tables) fall flat when explained on ugly, wall-of-text slides. Design-Dev builds modular, beautiful visual assets that clarify abstract code.",
          ar: "المفاهيم الخوارزمية المعقدة تفقد وضوحها بدون رسوم توضيحية متقنة. يصمم الفريق شرائح تعليمية ورسوماً بصرية ديناميكية تجعل أصعب المفاهيم بدهية وسهلة الهضم.",
        },
      },
    ],
    impact: [
      {
        title: {
          en: "Unmistakable Engineering Identity & Visual Clout",
          ar: "هوية بصرية هندسية فريدة ذات طابع عالمي",
        },
        desc: {
          en: "Establishes a high-contrast, technical visual benchmark that sets ICPC PUA miles apart from standard campus clubs.",
          ar: "صناعة بصمة بصرية مميزة لا تُخطئها العين، تجمع بين الجرأة الفنية والصرامة الهندسية، لتكون علامة الجودة الأولى في الجامعة.",
        },
      },
      {
        title: {
          en: "High-Performance Interactive Digital Infrastructure",
          ar: "منظومة برمجية تفاعلية فائقة السرعة والاستقرار",
        },
        desc: {
          en: "Engineers responsive Next.js web applications, spec sheets, and live scoreboards optimized for 100% lighthouse performance.",
          ar: "بناء بوابات إلكترونية ومواصفات تفاعلية باستخدام أحدث تقنيات الويب، تتميز بالسرعة اللحظية والتوافق التام مع كافة الشاشات.",
        },
      },
      {
        title: {
          en: "Pedagogical Clarity & Cognitive Acceleration",
          ar: "تسريع الفهم الذهني ومضاعفة استيعاب المحتوى",
        },
        desc: {
          en: "Standardizes curriculum presentation slide decks, visual cheatsheets, and vector diagrams that supercharge student retention by 3x.",
          ar: "توحيد قوالب المحاضرات وتصميم ملخصات بصرية مكثفة للخوارزميات تسهم في مضاعفة سرعة استيعاب الطلاب وتركيزهم أثناء الشرح.",
        },
      },
    ],
handbook: {
      vision: {
        en: "You make the community look like an elite startup, not a college club. You own the visual standard, the digital infrastructure, and the automation of busywork.",
        ar: "أنتم تجعلون المجتمع يبدو كشركة ناشئة نخبوية وليس مجرد نادٍ جامعي. أنتم تديرون المعيار البصري، البنية التحتية الرقمية، وتختصرون المهام الإدارية عن طريق الأتمتة."
      },
      rolesDistribution: [
        {
          title: { en: "UI/UX & Graphic Designers", ar: "مصممو UI/UX والجرافيك" },
          desc: {
            en: "Design high-impact visual assets (posters, lecture presentation decks, social announcement art) following Creative Maximalism.",
            ar: "تصميم الأصول البصرية عالية التأثير (ملصقات، عروض تقديمية، منشورات) وفق هوية Creative Maximalism."
          }
        },
        {
          title: { en: "Developers & Automators", ar: "المطورون ومبرمجو الأتمتة" },
          desc: {
            en: "Build and deploy the Next.js web portal, maintain real-time leaderboards, automate Discord role assignments, and build process bots.",
            ar: "تطوير الصفحة المقصودة (Landing Page)، إدارة البنية الرقمية، أتمتة إدارة خادم الـ Discord، وتنفيذ أتمتة العمليات التقنية."
          }
        }
      ],
      responsibilities: [
        {
          title: { en: "Uphold the ICPC Design System", ar: "دعم نظام تصميم ICPC PUA الصارم" },
          desc: {
            en: "Execute the 'Creative Maximalism' aesthetic: bold vector graphics, thick 3px black borders, stippled shading, and signature purple accents.",
            ar: "تنفيذ النمط البصري 'Creative Maximalism'. استخدام رسوميات الفيكتور الجريئة، الحدود السوداء السميكة، والتظليل النقطي (Stippled)، مع الاعتماد على اللون البنفسجي كلون مميز للمجتمع."
          }
        },
        {
          title: { en: "Asset Delivery Before Pipelines", ar: "تسليم الأصول الفنية قبل مواعيد الفحص" },
          desc: {
            en: "Deliver all required presentation slides to Instructors and marketing assets to PR/Marketing before their weekly pipeline checks.",
            ar: "تسليم جميع الشرائح المطلوبة للمدربين، والمواد التسويقية لفرق العلاقات العامة والتسويق قبل مواعيد الفحوصات الأسبوعية الخاصة بهم."
          }
        },
        {
          title: { en: "Gamification & Community Tech", ar: "تقنيات التحفيز والمكافآت (Gamification)" },
          desc: {
            en: "Maintain dynamic leaderboard ranking tables, the 'Hall of Fame', and web portals to supercharge student engagement.",
            ar: "الحفاظ على تحديث جداول التصنيف (Leaderboards)، و'قاعة المشاهير' (Hall of Fame)، لزيادة التفاعل المجتمعي."
          }
        }
      ],
      dosAndDonts: {
        avoid: [
          {
            en: "Missing delivery deadlines which causes Instructors or PR to scramble.",
            ar: "تفويت المواعيد النهائية للتسليم مما يتسبب في إرباك المدربين أو مسؤولي العلاقات العامة."
          },
          {
            en: "Bland, standard corporate designs or soft feathered drop shadows.",
            ar: "التصميمات المؤسسية المملة أو التقليدية، واستخدام الظلال الناعمة (استخدم فقط الحدود والظلال الهندسية الصلبة)."
          }
        ],
        prefer: [
          {
            en: "High-energy aesthetics (using Fredoka One, Space Mono, and Neobrutalist grids).",
            ar: "الجماليات عالية الطاقة (باستخدام خطوط مثل Fredoka One و Space Mono)، والشبكات الفنية الجريئة (Neobrutalist)."
          },
          {
            en: "Automate administrative workflows so other committees never burn out on manual busywork.",
            ar: "أتمتة مسارات العمل البرمجية لكي لا تحترق الفرق الأخرى في الإجراءات الروتينية."
          }
        ]
      },
      faq: [
        {
          q: {
            en: "What is our primary aesthetic?",
            ar: "ما هو أسلوبنا الجمالي والبصري الأساسي؟"
          },
          a: {
            en: "'Creative Maximalism'. Think Figma's brand campaigns or Neobrutalist web portfolios. Use heavy black borders (3px), stippled drop shadows, and vibrant colors anchored by a purple accent.",
            ar: "'Creative Maximalism'. تخيل حملات منصة Figma أو المواقع ذات الطابع النيوبورتالي (Neobrutalist). استخدم حدوداً سوداء سميكة (3px)، وظلالاً نقطية، وألواناً حيوية يبرزها اللون البنفسجي الأساسي."
          }
        },
        {
          q: {
            en: "An instructor asked me to change the presentation format an hour before the session. What do I do?",
            ar: "طلب مني أحد المدربين تغيير تنسيق العرض التقديمي قبل الجلسة بساعة. ماذا أفعل؟"
          },
          a: {
            en: "Decline and refer them to the workflow rules. Assets must be finalized during the Weekly Readiness Check. Last-minute scrambling violates the division of labor.",
            ar: "ارفض الطلب ووجهه لقواعد مسار العمل. يجب الانتهاء من جميع الأصول الفنية خلال الفحص الأسبوعي للجاهزية. محاولات اللحظة الأخيرة تخرق مبدأ تقسيم العمل."
          }
        }
      ],
      subRoles: [
        "Creative Maximalist UI/UX Designer",
        "Frontend Software Engineer (Next.js/Tailwind)",
        "Discord Bot & Infrastructure Automator"
      ]
    }
  }
};
