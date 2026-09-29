import { supabase } from "./supabase"

export interface ScoutProfile {
  id: string
  full_name: string
  uni_id: string
  referral_code: string
  recruits_count: number
  claimed_tiers: string[]
  created_at: string
  updated_at: string
}

export interface BountyClaim {
  id: string
  scout_id: string
  tier_id: string
  tier_title: string
  status: "pending" | "approved" | "dispatched"
  created_at: string
}

/**
 * Generate a deterministic or clean referral code from name and uniId
 */
export function generateReferralCode(name: string, uniId: string): string {
  const cleanUni = uniId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
  const cleanName = name
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()

  const prefix = cleanName ? cleanName.slice(0, 8) : "SCOUT"
  const suffix = cleanUni ? cleanUni.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString()

  return `${prefix}-${suffix}`
}

/**
 * Register a new scout or fetch existing scout by University ID
 */
export async function registerOrGetScout(
  fullName: string,
  uniId: string
): Promise<{ scout: ScoutProfile | null; error: string | null; isNew: boolean }> {
  const trimmedName = fullName.trim()
  const trimmedUniId = uniId.trim()

  if (!trimmedName || trimmedName.length < 2) {
    return { scout: null, error: "Please provide a valid full name.", isNew: false }
  }

  if (!trimmedUniId || trimmedUniId.length < 3) {
    return { scout: null, error: "Please provide a valid University ID.", isNew: false }
  }

  try {
    // 1. Check if scout already exists by uni_id
    const { data: existing, error: fetchError } = await supabase
      .from("bounty_scouts")
      .select("*")
      .eq("uni_id", trimmedUniId)
      .maybeSingle()

    if (fetchError) {
      console.error("Error fetching scout:", fetchError)
      return { scout: null, error: fetchError.message, isNew: false }
    }

    if (existing) {
      // If name was provided and different, update it
      if (existing.full_name !== trimmedName) {
        await supabase
          .from("bounty_scouts")
          .update({ full_name: trimmedName, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
        existing.full_name = trimmedName
      }
      return { scout: existing as ScoutProfile, error: null, isNew: false }
    }

    // 2. Generate referral code
    let refCode = generateReferralCode(trimmedName, trimmedUniId)

    // Check if referral code collision exists
    const { data: codeConflict } = await supabase
      .from("bounty_scouts")
      .select("id")
      .eq("referral_code", refCode)
      .maybeSingle()

    if (codeConflict) {
      refCode = `${refCode}-${Math.floor(10 + Math.random() * 90)}`
    }

    // 3. Insert new scout
    const { data: newScout, error: insertError } = await supabase
      .from("bounty_scouts")
      .insert([
        {
          full_name: trimmedName,
          uni_id: trimmedUniId,
          referral_code: refCode,
          recruits_count: 0,
          claimed_tiers: [],
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Error creating scout:", insertError)
      return { scout: null, error: insertError.message, isNew: false }
    }

    return { scout: newScout as ScoutProfile, error: null, isNew: true }
  } catch (err: any) {
    console.error("Unexpected error in registerOrGetScout:", err)
    return { scout: null, error: err?.message || "Failed to register scout profile.", isNew: false }
  }
}

/**
 * Fetch a scout by University ID
 */
export async function getScoutByUniId(
  uniId: string
): Promise<{ scout: ScoutProfile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("bounty_scouts")
      .select("*")
      .eq("uni_id", uniId.trim())
      .maybeSingle()

    if (error) {
      return { scout: null, error: error.message }
    }

    return { scout: data as ScoutProfile, error: null }
  } catch (err: any) {
    return { scout: null, error: err?.message || "Failed to lookup scout profile." }
  }
}

/**
 * Record a referral when a cadet signs up with a scout's referral code
 */
export async function recordBountyReferral(
  referralCode: string,
  referredName: string,
  referredUniId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const cleanCode = referralCode.trim().toUpperCase()

    // 1. Find scout by referral code
    const { data: scout, error: scoutError } = await supabase
      .from("bounty_scouts")
      .select("id, recruits_count")
      .eq("referral_code", cleanCode)
      .maybeSingle()

    if (scoutError || !scout) {
      return { success: false, error: "Referral code not found." }
    }

    // 2. Check for duplicate referral by uni_id if provided
    if (referredUniId) {
      const { data: duplicate } = await supabase
        .from("bounty_referrals")
        .select("id")
        .eq("scout_id", scout.id)
        .eq("referred_uni_id", referredUniId.trim())
        .maybeSingle()

      if (duplicate) {
        return { success: true, error: null } // Already credited
      }
    }

    // 3. Insert referral record (Postgres trigger increments scout's recruits_count)
    const { error: insertError } = await supabase.from("bounty_referrals").insert([
      {
        scout_id: scout.id,
        referred_name: referredName.trim(),
        referred_uni_id: referredUniId ? referredUniId.trim() : null,
      },
    ])

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to record referral." }
  }
}

/**
 * Claim an unlocked tier reward
 */
export async function claimBountyReward(
  scoutId: string,
  tierId: string,
  tierTitle: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // 1. Insert claim record
    const { error: claimError } = await supabase.from("bounty_claims").insert([
      {
        scout_id: scoutId,
        tier_id: tierId,
        tier_title: tierTitle,
        status: "pending",
      },
    ])

    if (claimError) {
      return { success: false, error: claimError.message }
    }

    // 2. Fetch current claimed_tiers
    const { data: scout } = await supabase
      .from("bounty_scouts")
      .select("claimed_tiers")
      .eq("id", scoutId)
      .single()

    const currentClaimed = scout?.claimed_tiers || []
    if (!currentClaimed.includes(tierId)) {
      await supabase
        .from("bounty_scouts")
        .update({
          claimed_tiers: [...currentClaimed, tierId],
          updated_at: new Date().toISOString(),
        })
        .eq("id", scoutId)
    }

    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to submit claim." }
  }
}

/**
 * Fetch top scouts sorted by recruits / points count
 */
export async function getTopScouts(limit = 5): Promise<ScoutProfile[]> {
  try {
    const { data, error } = await supabase
      .from("bounty_scouts")
      .select("*")
      .order("recruits_count", { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data as ScoutProfile[]
  } catch {
    return []
  }
}
