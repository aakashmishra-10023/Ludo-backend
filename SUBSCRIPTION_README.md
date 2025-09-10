# Razorpay Subscription Implementation

This document describes the Razorpay subscription implementation for the Ludo Backend.

## Features

- **Subscription Plans**: Weekly, Monthly, Quarterly, and Annual plans
- **Payment Gateway**: Integrated with Razorpay using registration links
- **Customer Association**: Automatic customer creation and association with subscriptions
- **Webhook Handling**: Automatic subscription status updates
- **User Management**: Subscription status tracking per user
- **API Endpoints**: Complete CRUD operations for subscriptions
- **Registration Links**: Secure payment authorization flow

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

## Subscription Plans

| Plan      | Amount   | Duration | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| Weekly    | ₹99.00   | 1 week   | Weekly premium subscription    |
| Monthly   | ₹299.00  | 1 month  | Monthly premium subscription   |
| Quarterly | ₹799.00  | 3 months | Quarterly premium subscription |
| Annual    | ₹2999.00 | 1 year   | Annual premium subscription    |

## API Endpoints

### Public Endpoints

#### Get Subscription Plans

```
GET /subscription/plans
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "weekly",
      "name": "Weekly Premium",
      "amount": 9900,
      "currency": "INR",
      "interval": "weekly",
      "period": 1,
      "description": "Weekly premium subscription for Ludo game",
      "displayAmount": "₹99.00"
    }
  ]
}
```

### Protected Endpoints (Require Authentication)

#### Create Subscription

```
POST /subscription/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "planType": "MONTHLY"
}
```

**Response:** Returns a registration link that customers use to authorize payments and activate their subscription.

#### Get User Subscription

```
GET /subscription/my-subscription
Authorization: Bearer <token>
```

#### Cancel Subscription

```
POST /subscription/:subscriptionId/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancelAtCycleEnd": true
}
```

#### Pause Subscription

```
POST /subscription/:subscriptionId/pause
Authorization: Bearer <token>
Content-Type: application/json

{
  "pauseAt": "cycle"
}
```

#### Resume Subscription

```
POST /subscription/:subscriptionId/resume
Authorization: Bearer <token>
```

### Webhook Endpoint

#### Razorpay Webhook

```
POST /webhook/razorpay
```

This endpoint handles all Razorpay webhook events automatically.

## Database Models

### User Model Updates

The user model now includes subscription information:

```typescript
subscription: {
  isActive: boolean;
  plan?: string;
  startDate?: Date;
  endDate?: Date;
  razorpayCustomerId?: string;
}
```

### Subscription Model

Tracks subscription details:

- User ID
- Plan type
- Status (active, inactive, cancelled, expired, paused)
- Razorpay subscription ID
- Start and end dates
- Customer details

### Payment Model

Tracks payment transactions:

- User ID
- Subscription ID
- Razorpay payment ID
- Amount and currency
- Payment status
- Payment method

## Webhook Events Handled

- `subscription.activated` - Subscription becomes active after customer authorization
- `subscription.charged` - Successful payment for subscription
- `subscription.completed` - Subscription reaches end of billing cycles
- `subscription.cancelled` - Subscription is cancelled
- `subscription.paused` - Subscription is paused
- `subscription.resumed` - Subscription is resumed
- `subscription.halted` - Subscription is halted due to payment failure
- `payment.captured` - Payment is successfully captured
- `payment.failed` - Payment fails
- `invoice.paid` - Registration link payment completed (triggers subscription activation)

## Usage Examples

### Check if User Has Active Subscription

```typescript
import { SubscriptionUtils } from "../utils/subscription.utils";

const hasActiveSubscription = await SubscriptionUtils.hasActiveSubscription(
  userId
);
```

### Require Subscription Middleware

```typescript
import { requireSubscription } from "../middlewares/subscription.middleware";

router.get("/premium-feature", requireSubscription, (req, res) => {
  // This route requires active subscription
});
```

### Optional Subscription Middleware

```typescript
import { optionalSubscription } from "../middlewares/subscription.middleware";

router.get("/feature", optionalSubscription, (req, res) => {
  const hasActiveSubscription = (req as any).hasActiveSubscription;
  // Handle based on subscription status
});
```

## Setup Instructions

1. **Install Dependencies**

   ```bash
   npm install razorpay @types/razorpay
   ```

2. **Configure Environment Variables**
   Add Razorpay credentials to your `.env` file

3. **Set up Razorpay Webhook**

   - Go to Razorpay Dashboard
   - Navigate to Settings > Webhooks
   - Add webhook URL: `https://yourdomain.com/webhook/razorpay`
   - Select events: All subscription, payment, and invoice events
   - Copy the webhook secret to your environment variables

4. **Create Razorpay Plans**
   The system will automatically create plans when needed, or you can create them manually in the Razorpay dashboard.

## Subscription Flow

1. **User selects a plan** and calls `/subscription/create`
2. **System creates a registration link** with customer details embedded
3. **Customer visits the registration link** to authorize payments
4. **Razorpay processes the authorization** and sends webhook events
5. **System automatically activates subscription** when authorization is complete
6. **Recurring payments begin** according to the selected plan

## Security Considerations

- Webhook signature verification is implemented
- All subscription endpoints require authentication
- Payment verification includes signature validation
- Raw body parsing for webhook verification

## Error Handling

The system includes comprehensive error handling:

- Invalid webhook signatures are rejected
- Failed payments are logged and tracked
- Subscription status changes are properly handled
- User subscription status is kept in sync

## Testing

Use the provided API endpoints to test the subscription flow:

1. **Get available plans** - Call `/subscription/plans`
2. **Create a subscription** - Call `/subscription/create` to get registration link
3. **Authorize payment** - Visit the registration link to complete authorization
4. **Check subscription status** - Call `/subscription/my-subscription` to verify activation
5. **Test management features** - Test cancellation, pause, and resume functionality

### Testing with Razorpay Test Mode

1. Use Razorpay test API keys in your environment
2. Create test customers and subscriptions
3. Use test card numbers for payment authorization
4. Monitor webhook events in Razorpay dashboard
