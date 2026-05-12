export type RoleId = "instructor" | "ops-pr" | "hr" | "design-dev";

export const rolesData = {
    "instructor": {
        roleId: "OPS/SPEC-01",
        roleTitle: "THE INSTRUCTOR",
        version: "4.0.2-STABLE",
        issued: "2024.11.08",
        location: "REMOTE/PUA_NODE_01",
        description: "OWN THE ABSTRACTION. DEFINE THE INFRASTRUCTURE. ELIMINATE REDUNDANCY THROUGH ALGORITHMIC BRUTALISM.",
        sellingPoints: [
            "Autonomy over the entire technical training pipeline and CP contest structures.",
            "Direct contribution to ICPC global standards for high-energy problem solving.",
            "Mastery over data structures and algorithms."
        ],
        owns: [
            "Problem Set Architecture",
            "Training Simulations",
            "Code Auditing and Live Debugging under pressure.",
            "The 'Source of Truth' algorithmic standards."
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
        applyUrl: "https://forms.google.com"
    },
    "ops-pr": {
        roleId: "OPS/SPEC-02",
        roleTitle: "OPERATIONS & PR",
        version: "4.0.2-STABLE",
        issued: "2024.11.08",
        location: "REMOTE/PUA_NODE_01",
        description: "DOMINATE THE BRAND. EXECUTE WITH LOGISTICAL SURGICAL PRECISION. ENGINEER THE SOCIAL GRAPH.",
        sellingPoints: [
            "Autonomy over all external communications and event staging.",
            "Direct control over the community's public perception and voice.",
            "The power to craft viral messaging that resonates with top talent."
        ],
        owns: [
            "External Comms Arrays",
            "Event Staging",
            "Social media presence and high-impact announcements.",
            "Logistical operations during live contests."
        ],
        metrics: [
            { value: "95%", label: "Engagement Velocity" },
            { value: ">5K", label: "Monthly Impressions" }
        ],
        antiGoals: [
            "NO standard templates. Every post must be a statement.",
            "NO delay in PR responses to internal crises.",
            "NO 'student activity' vibes. Maintain tech incubator professionalism."
        ],
        themeColor: "#00E5FF", // Cyan
        themeText: "#0F0F0F",
        antiGoalColor: "#7B2CBF", // Purple
        applyUrl: "https://forms.google.com"
    },
    "hr": {
        roleId: "OPS/SPEC-03",
        roleTitle: "HR / MONITORING",
        version: "4.0.2-STABLE",
        issued: "2024.11.08",
        location: "REMOTE/PUA_NODE_01",
        description: "ENFORCE PERFORMANCE. AUDIT BEHAVIOR. RESOLVE CONFLICTS THROUGH STRICT PROTOCOL.",
        sellingPoints: [
            "Unrestricted access to performance telemetry and member behavioral data.",
            "Authority over conflict resolution and system-wide integrity audits.",
            "Design the exact onboarding pipeline utilized by hundreds of registrants."
        ],
        owns: [
            "Member Integrity Audits",
            "Onboarding Pipeline",
            "Performance Tracking Systems",
            "Conflict Resolution Protocol"
        ],
        metrics: [
            { value: "98%", label: "Retention Stability" },
            { value: "<24H", label: "Conflict Resolution Time" }
        ],
        antiGoals: [
            "NO endless paperwork loops. Ensure processes are lean and Brutalist.",
            "NO arbitrary evaluation metrics. Rely strictly on quantitative data.",
            "NO failure to monitor low-activity nodes."
        ],
        themeColor: "#7B2CBF", // Purple
        themeText: "#FFFFFF",
        antiGoalColor: "#FFD500", // Yellow
        applyUrl: "https://forms.google.com"
    },
    "design-dev": {
        roleId: "OPS/SPEC-04",
        roleTitle: "DESIGN / DEV",
        version: "4.0.2-STABLE",
        issued: "2024.11.08",
        location: "REMOTE/PUA_NODE_01",
        description: "VISUAL VIOLENCE. PIXEL-PERFECT BRUTALITY. FRONTEND ENGINEERING AT 200MS.",
        sellingPoints: [
            "Autonomy over the Electric Blueprint UI/UX and core web platform.",
            "Build robust, high-performance web components utilizing bleeding-edge frameworks.",
            "Zero boundaries on creative maximalist expression."
        ],
        owns: [
            "Design System Blueprint",
            "Full-Stack Deployment",
            "Next.js Portal Architecture",
            "High-impact graphic generation protocols."
        ],
        metrics: [
            { value: "100", label: "System Aesthetic Score" },
            { value: "<200MS", label: "Time-to-Interactive" }
        ],
        antiGoals: [
            "NO implementation of 'soft' UI. No border radius.",
            "NO reliance on out-of-the-box styling components.",
            "NO soft feathered shadows. Use solid structural offsets only."
        ],
        themeColor: "#FF0055", // Pink
        themeText: "#FFFFFF",
        antiGoalColor: "#00E5FF", // Cyan
        applyUrl: "https://forms.google.com"
    }
};
