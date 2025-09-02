export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  period: number;
  description: string;
  displayAmount: string;
}

export interface CreateSubscriptionRequest {
  planType: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
}

export interface CancelSubscriptionRequest {
  cancelAtCycleEnd?: boolean;
}

export interface PauseSubscriptionRequest {
  pauseAt?: "now" | "cycle";
}

export interface RazorpayWebhookEvent {
  event: string;
  account_id: string;
  created_at: number;
  contains: string[];
  payload: {
    subscription?: {
      entity: {
        id: string;
        plan_id: string;
        status: string;
        current_start: number;
        current_end: number;
        ended_at: number | null;
        quantity: number;
        notes: Record<string, string>;
        charge_at: number;
        start_at: number;
        end_at: number;
        auth_attempts: number;
        total_count: number;
        paid_count: number;
        customer_notify: boolean;
        created_at: number;
        expire_by: number | null;
        short_url: string;
        has_scheduled_changes: boolean;
        change_scheduled_at: number | null;
        remaining_count: number;
        customer_details: {
          email: string;
          contact: string;
          name: string;
        };
      };
    };
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        description: string;
        captured: boolean;
        email: string;
        contact: string;
        notes: Record<string, string>;
        error_code?: string;
        error_description?: string;
        error_source?: string;
        error_step?: string;
        error_reason?: string;
      };
    };
  };
}

export interface UserSubscription {
  isActive: boolean;
  plan?: string;
  startDate?: Date;
  endDate?: Date;
  razorpayCustomerId?: string;
}
