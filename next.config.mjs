/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Keep AGENTS.md hand-maintained instead of letting `next dev` upsert into it.
  agentRules: false,
}

export default nextConfig
