import { razorpayWebhook } from "./webhooks/razorpay.webhook.js";

app.post("/webhooks/razorpay", express.json(), razorpayWebhook);
