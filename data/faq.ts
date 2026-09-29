export interface FaqPoint {
  label: string;
  text: string;
}

export interface FaqItemData {
  id: string;
  number: number;
  badge: { en: string; ar: string };
  badgeColor?: string;
  question: {
    en: string;
    ar: string;
  };
  answer: {
    en: {
      intro: string;
      points?: FaqPoint[];
      summary?: string;
    };
    ar: {
      intro: string;
      points?: FaqPoint[];
      summary?: string;
    };
  };
  links?: {
    label: { en: string; ar: string };
    url: string;
    type: "whatsapp" | "discord" | "web";
  }[];
}

export const OFFICIAL_COMMUNITY_LINKS = {
  whatsapp: "https://chat.whatsapp.com/DYx4tz7Y2xnE8GJ1D8S6xn",
  discord: "https://discord.gg/bzjx5W5Wt",
  faq: "https://icpcpua.vercel.app/faq",
  website: "https://icpcpua.vercel.app/",
};

export const CORE_FAQ_ITEMS: FaqItemData[] = [
  {
    id: "eligibility",
    number: 1,
    badge: { en: "OPEN TO ALL MAJORS", ar: "مفتوح لكل التخصصات" },
    badgeColor: "#00E5FF",
    question: {
      en: "Who is eligible to join the community and training?",
      ar: "مين يقدر ينضم للمجتمع ويشترك في التدريب؟",
    },
    answer: {
      en: {
        intro:
          "Open to all university students without exception from any academic year (Freshmen to Seniors) and any major or faculty (Computer Science, Artificial Intelligence, Cybersecurity, Networks, Information Systems, or any department interested in programming).",
      },
      ar: {
        intro:
          "التدريب مفتوح لكل طلبة الجامعة بدون استثناء؛ أي فرقة دراسية (من سنة أولى لحد سنة رابعة) ومن أي تخصص أو قسم (حاسبات، ذكاء اصطناعي، شبكات، اتصالات، نظم، أو أي كلية تانية مهتمة بالبرمجة).",
      },
    },
  },
  {
    id: "beginners",
    number: 2,
    badge: { en: "ZERO PREREQUISITES", ar: "من الصفر تماماً" },
    badgeColor: "#FFD500",
    question: {
      en: "I am an absolute beginner with zero problem-solving experience. Can I join?",
      ar: "أنا لسه مبتدئ ومعنديش أي خبرة سابقة في حل المسائل، هل أقدر أبدأ معاكم؟",
    },
    answer: {
      en: {
        intro:
          "Absolutely! The Level 1 Track is specifically built from scratch to establish logical reasoning, programming syntax, and basic algorithmic thinking step-by-step.",
      },
      ar: {
        intro:
          "طبعاً وبكل تأكيد! مسار Level 1 معمول ومصمم خصيصاً للبداية من تحت الصفر، لتأسيس التفكير المنطقي وتعلم الأساسيات خطوة بخطوة.",
      },
    },
  },
  {
    id: "benefits",
    number: 3,
    badge: { en: "CAREER & ENGINEERING ROI", ar: "عائد مهني وتقني مباشر" },
    badgeColor: "#FF0055",
    question: {
      en: "What are the concrete benefits of joining the community?",
      ar: "إيه اللي هستفيده عملياً من التدريب واشتراكي في الكوميونيتي؟",
    },
    answer: {
      en: {
        intro:
          "Participation is an immediate, high-leverage investment in your engineering career—far beyond just contest trophies:",
        points: [
          {
            label: "Ace Technical Interviews",
            text: "Hands-on preparation tailored to pass complex problem-solving screenings at top tech companies.",
          },
          {
            label: "Rewire Your Mind",
            text: "Transform the way you approach complex engineering problems and design optimal solutions under constraints.",
          },
          {
            label: "Direct Domain Synergy",
            text: "Problem-solving directly complements AI (token optimization and architecture modeling), Cybersecurity (routing algorithms and reverse engineering), and Data Science.",
          },
          {
            label: "Verified Portfolio",
            text: "A proven track record of solved problems and contest performance on platforms like Codeforces and LeetCode.",
          },
          {
            label: "Recognition & Rewards",
            text: "High-performing, committed members receive recommendation letters, LinkedIn skill endorsements, and job/internship referrals.",
          },
        ],
      },
      ar: {
        intro:
          "الاستفادة مش مقتصرة بس على المسابقة، دي استثمار مباشر في مستقبلك المهني وبناء ملفك التقني:",
        points: [
          {
            label: "تخطي المقابلات التقنية (Technical Interviews)",
            text: "تدريب عملي مكثف يخليك جاهز لأصعب اختبارات التوظيف في كبرى شركات التكنولوجيا العالمية.",
          },
          {
            label: "إعادة ضبط التفكير البرمجي (Rewiring Your Mind)",
            text: "هتتعلم إزاي تفكك أي مشكلة معقدة وتوصل لأفضل حل في أسرع وقت ممكن.",
          },
          {
            label: "خدمة تخصصك الأكاديمي",
            text: "فهم الخوارزميات بيخدم مباشرة مجالات زي الـ AI (تحسين التوكينز وتصميم النماذج)، الـ Cyber Security (الـ Routing والـ Reverse Engineering)، والـ Data Science.",
          },
          {
            label: "بناء Portfolio قوي ومثبت",
            text: "ملف أعمال من حل المسائل على منصات دولية موثوقة (Codeforces و LeetCode).",
          },
          {
            label: "نظام مكافآت للملتزمين",
            text: "خطابات توصية (Recommendation Letters)، توثيقات مهارات على LinkedIn، وترشيحات لفرص تدريب وتوظيف (Referrals).",
          },
        ],
      },
    },
  },
  {
    id: "activities",
    number: 4,
    badge: { en: "CURRICULUM & ECOSYSTEM", ar: "منهج GUC وبيئة متكاملة" },
    badgeColor: "#7B2CBF",
    question: {
      en: "What activities and systems are provided inside the community?",
      ar: "إيه الأنشطة والأنظمة اللي بنقدمها جوة الكوميونيتي؟",
    },
    answer: {
      en: {
        intro:
          "We do not operate as an informal chat group; we run as a full-scale engineering incubation hub:",
        points: [
          {
            label: "Interactive Sessions",
            text: "Complete coverage of standardized GUC curriculum across Level 1 & Level 2.",
          },
          {
            label: "Upsolving Sessions",
            text: "Dedicated problem-breakdown workshops addressing sheet bottlenecks.",
          },
          {
            label: "Continuous Monitoring",
            text: "Individual performance tracking to identify weaknesses and provide targeted support.",
          },
          {
            label: "Offline Contests & Gyms",
            text: "Campus-based mock contests recreating official contest pressure and rules.",
          },
          {
            label: "Industry Guest Speakers & Workshops",
            text: "Sessions with external engineers and leaders bridging college life and industry demands.",
          },
          {
            label: "Leaderboards & Hall of Fame",
            text: "Friendly competition with public weekly performance recognition.",
          },
        ],
      },
      ar: {
        intro:
          "إحنا مش مجرد مجموعة واتساب؛ إحنا بيئة عمل وتدريب متكاملة بمعايير مؤسسية:",
        points: [
          {
            label: "سيشنات تفاعلية",
            text: "تغطية شاملة لمنهج الـ GUC المعتمد لمستويي Level 1 و Level 2.",
          },
          {
            label: "جلسات الـ Upsolving",
            text: "ورش مخصصة لتحليل وحل المسائل الصعبة اللي وقفت معاك في الشيتات.",
          },
          {
            label: "نظام متابعة مستمر (Monitoring)",
            text: "متابعة دورية لأدائك وحل مسائلك لتحديد نقط الضعف وتوجيهك فوراً.",
          },
          {
            label: "مسابقات ومحاكاة أوفلاين (Contests & Gyms)",
            text: "معسكرات وتدريبات عملية داخل الكلية تحطك تحت نفس ضغط وأجواء المسابقات الرسمية.",
          },
          {
            label: "استضافة محترفين (Guest Speakers & Workshops)",
            text: "لقاءات مع مهندسين وخبراء من سوق العمل لنقل الخبرة العملية وتوجيه الطلاب.",
          },
          {
            label: "لوحات صدارة وتكريم (Leaderboards & Hall of Fame)",
            text: "تنافس شريف وتكريم للمتميزين أسبوعياً.",
          },
        ],
      },
    },
  },
  {
    id: "scheduling",
    number: 5,
    badge: { en: "EXAM-SAFE HYBRID BALANCE", ar: "مرونة تراعي الامتحانات" },
    badgeColor: "#00E5FF",
    question: {
      en: "How do I join, and how do I balance community activities with my coursework?",
      ar: "إزاي أنضم وأرتب وقتي ومشاركتي مع دراستي والامتحانات؟",
    },
    answer: {
      en: {
        intro:
          "Getting onboarded and balancing your schedule is structured to protect your academic standing:",
        points: [
          {
            label: "How to Join",
            text: "Join our official WhatsApp announcement group and Discord server to follow the onboarding guides.",
          },
          {
            label: "Flexible Hybrid Balance",
            text: "In-person on-campus sessions combined with asynchronous online problem sets and upsolving you can complete on your own schedule.",
          },
          {
            label: "Exam-Friendly Scheduling",
            text: "Pacing slows down and pauses around midterms and finals so your GPA and academic coursework remain protected as priority number one.",
          },
          {
            label: "Leadership & Organizing Opportunities",
            text: "Trainees interested in operations, design, or mentorship can take on core-team roles to develop proven organizational leadership skills.",
          },
        ],
      },
      ar: {
        intro:
          "الانضمام والتنظيم بسيط ومصمم بحيث يضمن عدم التأثير على دراستك:",
        points: [
          {
            label: "خطوات الانضمام",
            text: "كل اللي عليك تنضم لجروب الواتساب وسيرفر الديسكورد وتتابع التعليمات الموضحة في قنوات الإعلانات.",
          },
          {
            label: "التوازن الدراسي",
            text: "بنوفر نظام هجين مرن (سيشنات أوفلاين في الكلية + متابعة وتدريبات عملية أونلاين تراجعها في وقتك المناسب).",
          },
          {
            label: "مراعاة الامتحانات",
            text: "مواعيد التدريب بتتعدل تماماً وتخفف خلال فترات الميدتيرم والفاينال عشان نضمن إن دراستك الأساسية وتراكمك الأكاديمي أولويتك الأولى.",
          },
          {
            label: "التنظيم والمشاركة الإدارية",
            text: "لو عندك شغف بالقيادة والعمل المؤسسي، بنتيح مسارات للمشاركة في تنظيم وإدارة لجان المجتمع لاكتساب خبرة قيادية حقيقية.",
          },
        ],
      },
    },
  },
  {
    id: "teams",
    number: 6,
    badge: { en: "INDIVIDUAL INTAKE", ar: "بدء فردي بدون فريق" },
    badgeColor: "#FFD500",
    question: {
      en: "Do I need a 3-person team right now to participate?",
      ar: "هل لازم يكون معايا فريق (Team) من 3 أفراد من دلوقتي عشان أقدم؟",
    },
    answer: {
      en: {
        intro:
          "No. All training starts individually for all levels. Teams are formed later within the community based on mutual compatibility, complementary skillsets, and performance in training simulations.",
      },
      ar: {
        intro:
          "لأ، التدريب بيبدأ بشكل فردي لكل المستويات. الفرق بنبدأ نكونها بعد فترة داخل المجتمع بناءً على التوافق بينكم وتقارب المستويات والأداء.",
      },
    },
  },
  {
    id: "languages",
    number: 7,
    badge: { en: "C++ / JAVA / PYTHON", ar: "لغات البرمجة المعتمدة" },
    badgeColor: "#FF0055",
    question: {
      en: "Which programming languages can I use in training and contests?",
      ar: "إيه لغات البرمجة المستخدمة في التدريب والمسابقات؟",
    },
    answer: {
      en: {
        intro:
          "C++ is our primary recommended language due to execution speed and standard library efficiency in competitive environments. However, languages like Java and Python are fully supported across all official platforms.",
      },
      ar: {
        intro:
          "التركيز الأساسي بيكون على C++ لسرعتها الفائقة وتوافقها مع بيئة المسابقات، ولكن لغات زي Java و Python مدعومة بالكامل في كل المنصات الرسمية.",
      },
    },
  },
  {
    id: "pricing",
    number: 8,
    badge: { en: "100% FREE OF CHARGE", ar: "مجاني بالكامل 100%" },
    badgeColor: "#00E5FF",
    question: {
      en: "Is there any registration or training fee?",
      ar: "هل التدريب بمقابل مادي؟",
    },
    answer: {
      en: {
        intro:
          "No. Community training and mentorship are 100% free of charge for all Pharos University students.",
      },
      ar: {
        intro:
          "لا، تدريب المجتمع مجاني بالكامل 100% لكل طلبة الكلية والجامعة.",
      },
    },
  },
  {
    id: "onboarding-links",
    number: 9,
    badge: { en: "OFFICIAL CHANNELS", ar: "انضم الآن فوراً" },
    badgeColor: "#7B2CBF",
    question: {
      en: "How do I get started right now without missing any details?",
      ar: "إزاي أبدأ دلوقتي وميفوتنيش أي تفاصيل؟",
    },
    answer: {
      en: {
        intro:
          "Join our official channels immediately and start your journey with us today:",
      },
      ar: {
        intro:
          "انضم فوراً للقنوات الرسمية وابدأ رحلتك معانا خطوة بخطوة:",
      },
    },
    links: [
      {
        label: { en: "WhatsApp Announcement Group", ar: "جروب الواتساب الأساسي" },
        url: OFFICIAL_COMMUNITY_LINKS.whatsapp,
        type: "whatsapp",
      },
      {
        label: { en: "Discord Community Server", ar: "سيرفر ديسكورد الرسمي" },
        url: OFFICIAL_COMMUNITY_LINKS.discord,
        type: "discord",
      },
      {
        label: { en: "Official FAQ Page", ar: "صفحة الأسئلة الشائعة" },
        url: OFFICIAL_COMMUNITY_LINKS.faq,
        type: "web",
      },
      {
        label: { en: "Official Website", ar: "الموقع الرسمي للمجتمع" },
        url: OFFICIAL_COMMUNITY_LINKS.website,
        type: "web",
      },
    ],
  },
];

export const CONTEST_LOGISTICS_FAQ = [
  {
    id: "ecpc-benefits",
    badge: "ECPC QUALIFICATION",
    qEn: "What are the benefits of competing in the official ECPC?",
    qAr: "ما هي فوائد المشاركة في مسابقة ECPC الرسمية؟",
    aEn: "Beyond testing your problem-solving skills under pressure, competing gives you official certification, exposure to top tech employers, networking opportunities with elite engineers, and a prestigious addition to your resume.",
    aAr: "إلى جانب اختبار مهاراتك تحت الضغط، تمنحك المشاركة شهادة رسمية، وتفتح لك أبواب التواصل مع كبرى الشركات التقنية ونخبة المهندسين، وتعتبر إضافة قوية جداً لسيرتك الذاتية.",
  },
  {
    id: "ecpc-eligibility",
    badge: "COLLEGIATE ELIGIBILITY",
    qEn: "What are the official regional eligibility requirements?",
    qAr: "ما هي شروط التقديم للمسابقات الرسمية؟",
    aEn: "Contestants must be born in 2003 or later, OR have enrolled in university in 2022 or later. Proof of enrollment must be dated mid-February 2026 or later.",
    aAr: "يجب أن يكون المتسابق من مواليد 2003 أو ما بعدها، أو التحق بالجامعة في 2022 أو ما بعدها. يجب أن يكون إثبات القيد بتاريخ منتصف فبراير 2026 أو ما بعده.",
  },
  {
    id: "ecpc-teams",
    badge: "TEAM RULES",
    qEn: "What are the rules for team names and registration?",
    qAr: "ما هي شروط أسماء الفرق والتسجيل؟",
    aEn: "Names must not exceed 30 characters and must be in English. The first character must be a letter or number. The only allowed special characters are underscores (_) and hyphens (-). Consecutive spaces, quotes, and brackets are prohibited.",
    aAr: "يجب ألا يتجاوز الاسم 30 حرفاً وأن يكون باللغة الإنجليزية. يجب أن يبدأ بحرف أو رقم. الرموز المسموحة فقط هي الشرطة السفلية (_) والشرطة (-). يمنع استخدام المسافات المتتالية، الأقواس، وعلامات التنصيص.",
  },
];
