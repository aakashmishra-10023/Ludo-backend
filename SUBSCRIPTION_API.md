# Subscription API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Subscription Plans

**GET** `/subscription/plans`

Get all available subscription plans.

**Response:**

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
    },
    {
      "id": "monthly",
      "name": "Monthly Premium",
      "amount": 29900,
      "currency": "INR",
      "interval": "monthly",
      "period": 1,
      "description": "Monthly premium subscription for Ludo game",
      "displayAmount": "₹299.00"
    },
    {
      "id": "quarterly",
      "name": "Quarterly Premium",
      "amount": 79900,
      "currency": "INR",
      "interval": "monthly",
      "period": 3,
      "description": "Quarterly premium subscription for Ludo game",
      "displayAmount": "₹799.00"
    },
    {
      "id": "annual",
      "name": "Annual Premium",
      "amount": 299900,
      "currency": "INR",
      "interval": "yearly",
      "period": 1,
      "description": "Annual premium subscription for Ludo game",
      "displayAmount": "₹2999.00"
    }
  ]
}
```

### 2. Create Subscription

**POST** `/subscription/create`

Create a new subscription registration link for the authenticated user. This creates a registration link that the customer can use to authorize payments and activate their subscription.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "planType": "MONTHLY"
}
```

**Valid planType values:**

- `WEEKLY`
- `MONTHLY`
- `QUARTERLY`
- `ANNUAL`

**Response:**

```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "inv_ABC123",
      "entity": "invoice",
      "customer_id": "cust_ABC123",
      "status": "issued",
      "amount": 29900,
      "currency": "INR",
      "description": "Monthly Premium - John Doe",
      "short_url": "https://rzp.io/i/ABC123",
      "expire_by": 1640995200,
      "created_at": 1640908800,
      "token": {
        "method": "card",
        "max_amount": 29900,
        "expire_at": 1640995200
      }
    },
    "shortUrl": "https://rzp.io/i/ABC123"
  },
  "message": "Subscription registration link created successfully"
}
```

**Error Responses:**

```json
{
  "success": false,
  "message": "User already has an active subscription"
}
```

**Note:** The customer needs to visit the `shortUrl` to complete payment authorization. Once authorized, the subscription will be activated automatically via webhook.

### 3. Get User Subscription

**GET** `/subscription/my-subscription`

Get the authenticated user's subscription details.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "plan": "monthly",
      "status": "active",
      "razorpaySubscriptionId": "sub_ABC123",
      "currentStart": "2021-12-31T18:30:00.000Z",
      "currentEnd": "2022-01-31T18:30:00.000Z"
    },
    "razorpayDetails": {
      "id": "sub_ABC123",
      "plan_id": "plan_monthly",
      "status": "active",
      "current_start": 1640995200,
      "current_end": 1643673600
    }
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "No active subscription found"
}
```

### 4. Cancel Subscription

**POST** `/subscription/:subscriptionId/cancel`

Cancel a subscription.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "cancelAtCycleEnd": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sub_ABC123",
    "status": "cancelled"
  },
  "message": "Subscription will be cancelled at the end of current cycle"
}
```

### 5. Pause Subscription

**POST** `/subscription/:subscriptionId/pause`

Pause a subscription.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "pauseAt": "cycle"
}
```

**Valid pauseAt values:**

- `now` - Pause immediately
- `cycle` - Pause at the end of current billing cycle

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sub_ABC123",
    "status": "paused"
  },
  "message": "Subscription paused successfully"
}
```

### 6. Resume Subscription

**POST** `/subscription/:subscriptionId/resume`

Resume a paused subscription.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sub_ABC123",
    "status": "active"
  },
  "message": "Subscription resumed successfully"
}
```

### 7. Verify Payment

**POST** `/subscription/verify-payment`

Verify a subscription payment (used by frontend after payment).

**Request Body:**

```json
{
  "razorpay_payment_id": "pay_ABC123",
  "razorpay_subscription_id": "sub_ABC123",
  "razorpay_signature": "signature_hash"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pay_ABC123",
    "amount": 29900,
    "currency": "INR",
    "status": "captured"
  },
  "message": "Payment verified successfully"
}
```

## Webhook Endpoint

### Razorpay Webhook

**POST** `/webhook/razorpay`

This endpoint is called by Razorpay to notify about subscription and payment events. It's not meant to be called directly by clients.

**Headers:**

```
X-Razorpay-Signature: <webhook_signature>
Content-Type: application/json
```

## Error Codes

| Code                          | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `SUBSCRIPTION_REQUIRED`       | Active subscription required for this feature |
| `INVALID_SIGNATURE`           | Invalid webhook signature                     |
| `SUBSCRIPTION_NOT_FOUND`      | Subscription not found                        |
| `PAYMENT_VERIFICATION_FAILED` | Payment verification failed                   |

## Status Codes

| Code | Description                       |
| ---- | --------------------------------- |
| 200  | Success                           |
| 201  | Created                           |
| 400  | Bad Request                       |
| 401  | Unauthorized                      |
| 403  | Forbidden (Subscription required) |
| 404  | Not Found                         |
| 500  | Internal Server Error             |

## Example Usage

### Frontend Integration

```javascript
// Get available plans
const plans = await fetch("/subscription/plans").then((r) => r.json());

// Create subscription registration link
const subscription = await fetch("/subscription/create", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ planType: "MONTHLY" }),
}).then((r) => r.json());

// Redirect to Razorpay registration page for payment authorization
window.location.href = subscription.data.shortUrl;

// After payment authorization, verify payment (optional - webhook handles this automatically)
const verification = await fetch("/subscription/verify-payment", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: signature,
  }),
}).then((r) => r.json());

// Check subscription status
const userSubscription = await fetch("/subscription/my-subscription", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
}).then((r) => r.json());
```

### Subscription Flow

1. **Create Registration Link**: Call `/subscription/create` to get a registration link
2. **Customer Authorization**: Customer visits the `shortUrl` to authorize payments
3. **Automatic Activation**: Webhook automatically activates subscription after successful authorization
4. **Status Check**: Use `/subscription/my-subscription` to check subscription status
