/**
 * Valid lifecycle status values for a bounty.
 */
export type BountyStatus = 'open' | 'in_review' | 'completed' | 'cancelled' | 'funded';

/**
 * Bounty tier classification affecting reward size and contributor eligibility.
 * T1: small/quick fixes, open to all
 * T2: medium complexity, requires T1 track record
 * T3: complex/features, requires significant track record
 */
export type BountyTier = 'T1' | 'T2' | 'T3';

/**
 * Supported reward token types.
 */
export type RewardToken = 'USDC' | 'FNDRY';

/**
 * Full bounty object as returned by the API.
 */
export interface Bounty {
  id: string;
  title: string;
  description: string;
  status: BountyStatus;
  tier: BountyTier;
  reward_amount: number;
  reward_token: RewardToken;
  github_issue_url?: string | null;
  github_repo_url?: string | null;
  org_name?: string | null;
  repo_name?: string | null;
  org_avatar_url?: string | null;
  issue_number?: number | null;
  category?: string | null;
  skills: string[];
  deadline?: string | null;
  submission_count: number;
  created_at: string;
  creator_id?: string | null;
  creator_username?: string | null;
  has_repo?: boolean;
}

/**
 * Represents a contributor's submission to a bounty.
 */
export interface Submission {
  id: string;
  bounty_id: string;
  contributor_id: string;
  contributor_username?: string | null;
  contributor_avatar?: string | null;
  repo_url?: string | null;
  pr_url?: string | null;
  description?: string | null;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  review_score?: number | null;
  earned?: number | null;
  created_at: string;
}

/**
 * Payload for creating a new bounty. Sent to the POST /api/bounties endpoint.
 */
export interface BountyCreatePayload {
  title: string;
  description: string;
  reward_amount: number;
  reward_token: RewardToken;
  deadline?: string | null;
  github_repo_url?: string | null;
  github_issue_url?: string | null;
  tier?: BountyTier | null;
  skills?: string[];
}

/**
 * Treasury deposit details returned after bounty creation.
 * Used by the bounty creator to fund the escrow via on-chain transfer.
 */
export interface TreasuryDepositInfo {
  bounty_id: string;
  treasury_address: string;
  amount_usdc: number;
  platform_fee: number;
  total_to_fund: number;
}

/**
 * Payload for verifying a USDC escrow deposit on-chain.
 */
export interface EscrowVerifyPayload {
  bounty_id: string;
  tx_signature: string;
}

/**
 * Result of an escrow deposit verification API call.
 */
export interface EscrowVerifyResult {
  verified: boolean;
  bounty_id: string;
  amount_verified?: number;
  error?: string;
}
