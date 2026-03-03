# 🔗 Clerk Webhook Setup Guide

## 🚨 Current Issue

Your webhook is failing because the `CLERK_WEBHOOK_SIGNING_SECRET` in your `.env` file is set to a placeholder value (`whsec_123`). You need to get the **real signing secret** from your Clerk Dashboard.

---

## 📋 Step-by-Step Setup

### 1️⃣ Get Your Webhook Signing Secret from Clerk

1. Go to **[Clerk Dashboard](https://dashboard.clerk.com)**
2. Select your application
3. Navigate to **Webhooks** in the left sidebar
4. Click **+ Add Endpoint** (or edit your existing webhook endpoint)
5. Enter your webhook URL:

   ```
   https://sn52wrkd-5000.inc1.devtunnels.ms/api/clerk-webhooks
   ```

   (Or use your actual tunnel/deployment URL)

6. **Select the events to subscribe to:**

   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

7. Click **Create** or **Save**

8. **Copy the Signing Secret**:
   - After creating the endpoint, you'll see a **Signing Secret** that looks like:
     ```
     whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```
   - Copy this entire secret

### 2️⃣ Update Your `.env` File

Replace the placeholder in your `.env` file:

```env
CLERK_WEBHOOK_SIGNING_SECRET=whsec_your_copied_secret_here
```

**Example:**

```env
CLERK_WEBHOOK_SIGNING_SECRET=whsec_123
```

### 3️⃣ Restart Your Server

After updating the `.env` file:

```bash
# Stop the current server (Ctrl + C)
# Then restart
npm run server
```

---

## 🧪 Testing Your Webhook

### Method 1: Using Clerk Dashboard

1. Go to your webhook endpoint in Clerk Dashboard
2. Click on the **"Send Example"** button
3. Select `user.created` event
4. Click **Send**

### Method 2: Trigger Real Events

1. Sign up a new user in your application
2. Update user profile
3. Delete a test user

Check your server console for logs:

```
📥 Webhook received: user.created
Creating user in database: { id: 'user_xxx', email: '...', name: '...', image: '...' }
✅ User created: user_xxx
```

---

## 🔍 Verify Database

After a successful webhook, verify the user was created:

```bash
npx prisma studio
```

Check the `User` table - you should see your new user!

---

## 🐛 Troubleshooting

### Issue: "Missing webhook verification headers"

**Solution**: Make sure you're sending the webhook to the correct endpoint with Svix headers.

### Issue: "Invalid webhook signature"

**Solution**:

1. Double-check your `CLERK_WEBHOOK_SIGNING_SECRET` in `.env`
2. Make sure there are no extra spaces or quotes
3. Restart your server after updating `.env`

### Issue: "Webhook secret not configured"

**Solution**: The `CLERK_WEBHOOK_SIGNING_SECRET` is missing from `.env`

### Issue: User still not in database

**Check:**

1. Server logs for errors
2. Prisma Studio to see if user exists
3. Database connection (check `DATABASE_URL`)
4. Make sure Prisma migrations are up to date:
   ```bash
   npx prisma migrate dev
   ```

---

## 📊 Expected Webhook Flow

```
User signs up in Clerk
         ↓
Clerk sends webhook to your server
         ↓
Server verifies Svix signature
         ↓
Server parses webhook data
         ↓
Server creates user in database
         ↓
Response sent back to Clerk
```

---

## ✅ Success Indicators

When everything is working:

1. **In Server Logs:**

   ```
   📥 Webhook received: user.created
   Creating user in database: { ... }
   ✅ User created: user_xxx
   ```

2. **In Clerk Dashboard:**

   - Webhook shows as "Delivered" (green checkmark)
   - HTTP 200 response code

3. **In Database (Prisma Studio):**
   - User appears in the `User` table

---

## 🔐 Security Note

- ✅ **Never commit** your actual webhook secret to Git
- ✅ Keep it in `.env` which is in `.gitignore`
- ✅ Use different secrets for development and production
- ✅ Rotate secrets if compromised

---

## 🚀 Next Steps After Setup

Once webhooks are working:

1. ✅ User authentication will sync with your database
2. ✅ User profiles will auto-update
3. ✅ User deletions will cascade properly
4. ✅ You can add payment webhooks later

---

## 📞 Still Having Issues?

If you're still seeing errors, share:

1. Server console output
2. Clerk Dashboard webhook attempt details
3. Any error messages from Prisma

---

**Remember:** The webhook secret starts with `whsec_` and is about 40+ characters long!
