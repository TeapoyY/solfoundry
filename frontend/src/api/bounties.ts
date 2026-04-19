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
 * Query parameters for the bounties list endpoint.
 */
export interface BountiesListParams {
  /** Filter by bounty status (e.g. 'open', 'in_review', 'completed'). */
  status?: string;
  /** Maximum number of results to return per page. */
  limit?: number;
  /** Pagination offset (number of items to skip). */
  offset?: number;
  /** Filter by required skill/language (e.g. 'TypeScript', 'Rust'). */
  skill?: string;
  /** Filter by bounty tier (T1, T2, T3). */
  tier?: string;
  /** Filter by reward token (e.g. 'USDC', 'FNDRY'). */
  reward_token?: string;
  /** Free-text search across title, description, and repo name. */
  search?: string;
}

/**
 * Paginated response from the bounties list endpoint.
 */
export interface BountiesListResponse {
  /** Array of bounty objects for the current page. */
  items: Bounty[];
  /** Total number of bounties matching the query across all pages. */
  total: number;
  /** Number of items returned per page. */
  limit: number;
  /** Current offset used for this page. */
  offset: number;
}

/**
 * Normalizes a raw bounty object from the backend, mapping legacy field names
 * to their current equivalents (e.g. funding_token → reward_token).
 *
 * @param b - Raw bounty object from the API
 * @returns Normalized bounty with all fields in their canonical form
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
 * Fetches a paginated list of bounties with optional filters.
 *
 * @param params - Optional query parameters (status, skill, search, pagination, etc.)
 * @returns Promise resolving to a paginated bounty list response
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
 *
 * @param id - The bounty UUID
 * @returns Promise resolving to the full bounty object
 */
export async function getBounty(id: string): Promise<Bounty> {
  const raw = await apiClient<Bounty>(`/api/bounties/${id}`);
  return mapBounty(raw);
}

/**
 * Creates a new bounty via the API.
 *
 * @param payload - Bounty creation fields (title, description, reward, deadline, etc.)
 * @returns Promise resolving to the newly created bounty object
 */
export async function createBounty(payload: BountyCreatePayload): Promise<Bounty> {
  return apiClient<Bounty>('/api/bounties', { method: 'POST', body: payload });
}

/**
 * Fetches all submissions for a specific bounty.
 *
 * @param bountyId - UUID of the bounty
 * @returns Promise resolving to an array of submission objects
 */
export async function listSubmissions(bountyId: string): Promise<Submission[]> {
  return apiClient<Submission[]>(`/api/bounties/${bountyId}/submissions`);
}

/**
 * Submits a new PR/m contribution to a bounty.
 *
 * @param bountyId - UUID of the bounty being submitted to
 * @param payload - Submission fields (repo URL, PR URL, description, tx signature)
 * @returns Promise resolving to the created submission object
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
 * Fetches on-chain treasury deposit instructions for funding a bounty.
 *
 * @param bountyId - UUID of the bounty to fund
 * @returns Promise resolving to treasury deposit info including address and amounts
 */
export async function getTreasuryDepositInfo(bountyId: string): Promise<TreasuryDepositInfo> {
  return apiClient<TreasuryDepositInfo>('/api/treasury/deposit-info', {
    params: { bounty_id: bountyId },
  });
}

/**
 * Verifies an on-chain escrow deposit for a bounty.
 *
 * @param payload - Contains bounty_id and the blockchain transaction signature
 * @returns Promise resolving to verification result (verified boolean, amount, error)
 */
export async function verifyEscrowDeposit(payload: EscrowVerifyPayload): Promise<EscrowVerifyResult> {
  return apiClient<EscrowVerifyResult>('/api/escrow/verify-deposit', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Metadata about the review fee for a bounty, including FNDDRY token cost
 * and its USD equivalent based on current oracle price.
 */
export interface ReviewFeeInfo {
  /** UUID of the bounty this fee applies to. */
  bounty_id: string;
  /** Whether a review fee is required before submission. */
  required: boolean;
  /** Amount of FNDRY tokens required as the review fee. */
  fndry_amount: number;
  /** USD price of FNDRY used for the conversion. */
  fndry_price_usd: number;
  /** USDC value of the bounty at current prices. */
  usdc_bounty_value: number;
  /** Review fee as a percentage of the bounty reward. */
  fee_percentage: number;
  /** FNDRY/USD exchange rate at time of calculation. */
  exchange_rate: number;
  /** Source of the price oracle (e.g. 'pyth'). */
  price_source: string;
}

/**
 * Fetches the review fee details for a specific bounty.
 *
 * @param bountyId - UUID of the bounty
 * @returns Promise resolving to review fee metadata including FNDRY cost and USD conversion
 */
export async function getReviewFee(bountyId: string): Promise<ReviewFeeInfo> {
  return apiClient<ReviewFeeInfo>(`/api/review-fee/${bountyId}`);
}

/**
 * Verifies that a review fee has been paid on-chain for a bounty.
 *
 * @param payload - Contains bounty_id, blockchain tx signature, and optionally payer wallet
 * @returns Promise resolving to verification result with verified flag and optional FNDRY amount
 */
export async function verifyReviewFee(payload: {
  bounty_id: string;
  tx_signature: string;
  payer_wallet?: string;
}): Promise<{ verified: boolean; bounty_id: string; fndry_amount_verified?: number; error?: string }> {
  return apiClient('/api/review-fee/verify', { method: 'POST', body: payload });
}
