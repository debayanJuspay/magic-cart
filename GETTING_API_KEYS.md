# Getting Shopify API Keys

Follow these steps to obtain your API credentials:

## Step 1: Create a Shopify Partner Account

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Click **Join now** and sign up (free)
3. Complete your partner profile

## Step 2: Create a New App

1. In Partner Dashboard, click **Apps** in the left sidebar
2. Click **Create app** → **Create app manually**
3. Enter app name: `Cart Drawer App`
4. Click **Create**

## Step 3: Get API Credentials

After creating the app, you'll see the **Overview** page:

### Client ID (API Key)
1. Look for **Client ID** near the top
2. Copy this value → that's your `SHOPIFY_API_KEY`

### Client Secret (API Secret)
1. Click **Reveal token** next to **Client secret**
2. Copy this value → that's your `SHOPIFY_API_SECRET`

## Step 4: Configure App URLs

In the same page, scroll to **App setup**:

### App URL
```
https://your-ngrok-url.ngrok.app
```
(You'll get this when running `npm run dev`)

### Allowed redirection URL(s)
Add these URLs:
```
https://your-ngrok-url.ngrok.app/auth/callback
https://your-ngrok-url.ngrok.app/auth/shopify/callback
https://your-ngrok-url.ngrok.app/api/auth/callback
```

Click **Save**

## Step 5: Configure Scopes

1. Go to **Configuration** tab
2. Under **App setup** → click **Configure**
3. Under **Admin API access scopes**, add:
   - `read_products`
   - `write_products`
   - `read_orders`
   - `write_discounts`
   - `read_inventory`
4. Click **Save**

## Step 6: Update Your .env File

```env
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.app
```

## Alternative: Using Shopify CLI (Automatic)

Instead of manual setup, you can let the CLI handle it:

```bash
npm run dev
```

The CLI will:
1. Create the app automatically in your Partner account
2. Generate the ngrok tunnel
3. Configure all URLs
4. Give you a link to install

Just follow the interactive prompts.

## Development Store

You'll also need a store to test on:

1. In Partner Dashboard, click **Stores**
2. Click **Add store** → **Create development store**
3. Fill in store name and password
4. Click **Create development store**

Now you can install your app on this store for testing.
