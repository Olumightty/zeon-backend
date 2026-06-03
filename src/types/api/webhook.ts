export interface ClerkWebhookEvent {
  object: 'event';
  instance_id: string;
  timestamp: number;
  type: 'user.created' | 'user.updated' | 'user.deleted'; // Extended to cover common user events
  data: ClerkUserData;
}

export interface ClerkUserData {
  object: 'user';
  id: string;
  external_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  birthday: string;
  gender: string;
  image_url: string;
  profile_image_url: string;
  password_enabled: boolean;
  two_factor_enabled: boolean;
  created_at: number;
  updated_at: number;
  last_sign_in_at: number | null;
  primary_email_address_id: string | null;
  primary_phone_number_id: string | null;
  primary_web3_wallet_id: string | null;
  email_addresses: ClerkEmailAddress[];
  phone_numbers: any[]; // Replace with specific interface if you use SMS auth
  web3_wallets: any[];   // Replace with specific interface if you use Web3 auth
  external_accounts: any[];
  public_metadata: Record<string, any>;
  private_metadata: Record<string, any>;
  unsafe_metadata: Record<string, any>;
}

export interface ClerkEmailAddress {
  object: 'email_address';
  id: string;
  email_address: string;
  linked_to: any[];
  verification: ClerkVerification;
}

export interface ClerkVerification {
  status: 'verified' | 'unverified' | 'pending';
  strategy: 'ticket' | 'email_code' | 'oauth_google' | string; // Accounts for various auth paths
}


export type KoraEvent = 'transfer.success' | 'transfer.failed' | 'charge.success';

export interface KoraWebhookPayload {
    event: KoraEvent;
    data: any;
}

export interface KoraChargeSuccessPayload extends KoraWebhookPayload {
    event: 'charge.success';
    data: KoraPayinWebhookData;
}


export interface KoraPayinWebhookData {
  fee: number,
  amount: number,
  status: "success" | "failed",
  currency: "NGN" | string,
  reference: string,
  payment_method: "mobile_money" | "card" | "bank_transfer" | string,
  payment_reference: string
}
