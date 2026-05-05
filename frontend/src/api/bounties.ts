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
 * Parameters for filtering and paginating the bounty list.
 */
export interface BountiesListParams {
  status?: string;
  limit?: number;
  offset?: number;
  skill?: string;
  tier?: string;
  reward_token?: string;
  query?: string;
}

/**
 * Paginated response from the bounty list endpoint.
 */
export interface BountiesListResponse {
  items: Bounty[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Maps backend field `funding_token` to frontend field `reward_token`.
 * Falls back to 'FNDRY' if neither is present.
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
 * List bounties with optional filtering and pagination.
 *
 * @param params - Filter options: status, skill, tier, reward_token, query, limit, offset.
 * @returns Paginated list of bounties with total count.
 * @throws Error if the API request fails.
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
 * Fetch a single bounty by ID.
 *
 * @param id - The bounty UUID.
 * @returns The bounty object.
 * @throws Error if the API request fails.
 */
export async function getBounty(id: string): Promise<Bounty> {
  const raw = await apiClient<Bounty>(`/api/bounties/${id}`);
  return mapBounty(raw);
}

/**
 * Create a new bounty. Requires authentication.
 *
 * @param payload - Bounty creation fields (title, description, reward_amount, etc.).
 * @returns The created bounty object.
 * @throws Error if the API request fails or the user is unauthenticated.
 */
export async function createBounty(payload: BountyCreatePayload): Promise<Bounty> {
  return apiClient<Bounty>('/api/bounties', { method: 'POST', body: payload });
}

/**
 * List all submissions for a specific bounty.
 *
 * @param bountyId - The bounty UUID.
 * @returns Array of submission objects.
 * @throws Error if the API request fails.
 */
export async function listSubmissions(bountyId: string): Promise<Submission[]> {
  return apiClient<Submission[]>(`/api/bounties/${bountyId}/submissions`);
}

/**
 * Submit a solution to a bounty. Requires authentication.
 *
 * @param bountyId    - The bounty UUID.
 * @param payload     - Submission fields: repo_url, pr_url, description, tx_signature.
 * @returns The created submission object.
 * @throws Error if the API request fails or the user is unauthenticated.
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
 * Get treasury deposit information for funding a bounty.
 * Includes the on-chain treasury address and required funding amount.
 *
 * @param bountyId - The bounty UUID.
 * @returns Treasury deposit info including address and total amount.
 * @throws Error if the API request fails.
 */
export async function getTreasuryDepositInfo(bountyId: string): Promise<TreasuryDepositInfo> {
  return apiClient<TreasuryDepositInfo>('/api/treasury/deposit-info', {
    params: { bounty_id: bountyId },
  });
}

/**
 * Verify a USDC escrow deposit on-chain for a bounty.
 * Confirms the transaction signature matches the expected bounty and amount.
 *
 * @param payload - Contains bounty_id and tx_signature (on-chain transaction signature).
 * @returns Verification result with verified flag and optional error message.
 * @throws Error if the API request fails.
 */
export async function verifyEscrowDeposit(payload: EscrowVerifyPayload): Promise<EscrowVerifyResult> {
  return apiClient<EscrowVerifyResult>('/api/escrow/verify-deposit', {
    method: 'POST',
    body: payload,
  });
}

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
 * Get the FNDRY review fee for submitting a solution to a bounty.
 * Includes the fee amount, USD price, and exchange rate.
 *
 * @param bountyId - The bounty UUID.
 * @returns Review fee info including FNDRY amount and pricing.
 * @throws Error if the API request fails.
 */
export async function getReviewFee(bountyId: string): Promise<ReviewFeeInfo> {
  return apiClient<ReviewFeeInfo>(`/api/review-fee/${bountyId}`);
}

/**
 * Verify a FNDRY review fee payment on-chain.
 * Called after the contributor sends the FNDRY fee to the treasury.
 *
 * @param payload - Contains bounty_id, tx_signature, and optional payer_wallet.
 * @returns Verification result with verified flag, verified amount, or error message.
 * @throws Error if the API request fails.
 */
export async function verifyReviewFee(payload: {
  return apiClient('/api/review-fee/verify', { method: 'POST', body: payload });
}
