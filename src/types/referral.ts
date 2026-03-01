export interface ReferralCodeResponse {
  referralCode: string | null;
  createdAt?: string;
  referralsEnabled?: boolean;
}

export interface ReferralErrorResponse {
  error: string;
  error_description?: string;
}
