import { apiClient } from '../services/apiClient';
import type {
  Bounty,
  BountyCreatePayload,
  Submission,
  TreasuryDepositInfo,
  EscrowVerifyPayload,
  EscrowVerifyResult,
} from '../types/bounty';

/**
 * Query parameters for listing bounties.
 */
export interface BountiesListParams {
  status?: string;
  limit?: number;
  offset?: number;
  skill?: string;
  tier?: string;
  reward_token?: string;
  /** Server-side search query (filtered on the backend). */
  query?: string;
}

/**
 * Paginated response from the bounties list endpoint.
 */
export interface BountiesListResponse {
  items: Bounty[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Normalizes backend bounty shape to frontend types.
 * Handles legacy `funding_token` field → `reward_token` mapping.
 * @param b - Raw bounty from the API
 */
function mapBounty(b: Bounty): Bounty {
  const raw = b as Bounty & { funding_token?: string };
  if (!raw.reward_token && raw.funding_token) {
    raw.reward_token = raw.funding_token as Bounty['reward_token'];
  }
  if (!raw.reward_token) raw.reward_token = 'FNDRY';
  return raw;
}

/**
 * Fetches a paginated list of bounties with optional filters and search.
 * @param params - Filter params (status, skill, tier, limit, offset, query)
 */
export async function listBounties(params?: BountiesListParams): Promise<BountiesListResponse> {
  const response = await apiClient<BountiesListResponse | Bounty[]>('/api/bounties', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  // Handle both array and paginated response shapes
  if (Array.isArray(response)) {
    return { items: response.map(mapBounty), total: response.length, limit: params?.limit ?? 20, offset: params?.offset ?? 0 };
  }
  return { ...response, items: response.items.map(mapBounty) };
}

/**
 * Fetches a single bounty by its UUID.
 * @param id - Bounty UUID
 */
export async function getBounty(id: string): Promise<Bounty> {
  const raw = await apiClient<Bounty>(`/api/bounties/${id}`);
  return mapBounty(raw);
}

/**
 * Creates a new bounty.
 * @param payload - Bounty creation payload (title, description, reward, etc.)
 */
export async function createBounty(payload: BountyCreatePayload): Promise<Bounty> {
  return apiClient<Bounty>('/api/bounties', { method: 'POST', body: payload });
}

/**
 * Lists all submissions for a given bounty.
 * @param bountyId - Bounty UUID
 */
export async function listSubmissions(bountyId: string): Promise<Submission[]> {
  return apiClient<Submission[]>(`/api/bounties/${bountyId}/submissions`);
}

/**
 * Creates a submission for a bounty.
 * @param bountyId - Bounty UUID
 * @param payload - Submission details (repo URL, PR URL, description, tx signature)
 */
export async function createSubmission(
  bountyId: string,
  payload: { repo_url?: string; pr_url?: string; description?: string; tx_signature?: string }
): Promise<Submission> {
  return apiClient<Submission>(`/api/bounties/${bountyId}/submissions`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Fetches treasury deposit info for funding a bounty.
 * @param bountyId - Bounty UUID
 */
export async function getTreasuryDepositInfo(bountyId: string): Promise<TreasuryDepositInfo> {
  return apiClient<TreasuryDepositInfo>('/api/treasury/deposit-info', {
    params: { bounty_id: bountyId },
  });
}

/**
 * Verifies an escrow deposit for a bounty using a Solana transaction signature.
 * @param payload - Escrow verification payload including tx signature
 */
export async function verifyEscrowDeposit(payload: EscrowVerifyPayload): Promise<EscrowVerifyResult> {
  return apiClient<EscrowVerifyResult>('/api/escrow/verify-deposit', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Fee information for AI review of a bounty submission.
 */
export interface ReviewFeeInfo {
  bounty_id: string;
  required: boolean;
  fndry_amount: number;
  fndry_price_usd: number;
  usdc_bounty_value: number;
  fee_percentage: number;
  exchange_rate: number;
  price_source: string;
}

/**
 * Fetches the AI review fee for a bounty.
 * @param bountyId - Bounty UUID
 */
export async function getReviewFee(bountyId: string): Promise<ReviewFeeInfo> {
  return apiClient<ReviewFeeInfo>(`/api/review-fee/${bountyId}`);
}

/**
 * Verifies a review fee payment via on-chain transaction.
 * @param payload - Verification payload including bounty ID, tx signature, and optional payer wallet
 */
export async function verifyReviewFee(payload: {
  bounty_id: string;
  tx_signature: string;
  payer_wallet?: string;
}): Promise<{ verified: boolean; bounty_id: string; fndry_amount_verified?: number; error?: string }> {
  return apiClient('/api/review-fee/verify', { method: 'POST', body: payload });
}
