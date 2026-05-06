# Shopify Cart Drawer App

A complete Shopify app that replaces the native cart drawer with a customizable version featuring upsells, free gifts, coupon support, and promotional banners.

## Features

- **Custom Cart Drawer**: Fully branded, slide-out cart drawer that replaces Shopify's native cart
- **Upsell Recommendations**: Show relevant product suggestions based on cart contents
- **Free Gift Automation**: Auto-add gifts when customers meet specific conditions
- **Promotional Banners**: Customizable banners with progress bars for free shipping thresholds
- **Coupon Support**: In-cart discount code application
- **Order Notes**: Allow customers to add special instructions

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin App     │────▶│   Database       │◀────│  Storefront     │
│  (Remix/React)  │     │  (Upsells, Rules)│     │  (Cart Drawer)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                               │
         │          ┌──────────────────┐                │
         └─────────▶│ Theme App Ext    │◀───────────────┘
                    │ (app embed)      │
                    └──────────────────┘
```

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- [Shopify Partner account](https://partners.shopify.com)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed globally

## Quick Start

### 1. Clone and Setup

```bash
cd shopify-cart-drawer-app
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Fill in your `.env` file:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.app
```

### 3. Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Development Server

```bash
npm run dev
```

This will:
- Start the Remix dev server
- Create an ngrok tunnel for public URL
- Connect to your Shopify Partner account

## Connecting to Shopify Stores

### Option 1: Development Store (Testing)

1. Create a [development store](https://help.shopify.com/en/partners/dashboard/development-stores) in your Partner account

2. When the dev server starts, it will prompt:
   ```
   Let's connect your app to Shopify
   ? Connect to which Partner account? (Use arrow keys)
   ```

3. Select your Partner account

4. Choose or create a development store

5. The app will install automatically and open in your browser

### Option 2: Manual Installation

If you need to reinstall or connect to a different store:

```bash
npm run shopify app config link
```

Then visit:
```
https://admin.shopify.com/store/YOUR_STORE_NAME/apps/YOUR_APP_HANDLE
```

### Option 3: Shopify App Store (Production)

To distribute publicly:

1. Register your app in [Partner Dashboard](https://partners.shopify.com)

2. Fill in all app details (name, description, screenshots)

3. Deploy your app to a hosting service (Heroku, Railway, Fly.io, etc.)

4. Update `shopify.app.toml` with production URLs

5. Submit for review

## Enabling the Cart Drawer

After installation, merchants must enable the cart drawer in their theme:

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Customize** on the active theme
3. Click the **Theme Settings** icon (paintbrush)
4. Navigate to **App Embeds**
5. Toggle **Cart Drawer App** to ON
6. Click **Save**

## Project Structure

```
shopify-cart-drawer-app/
├── app/
│   ├── routes/
│   │   ├── app._index.tsx         # Dashboard
│   │   ├── app.upsells.tsx        # Upsell management
│   │   ├── app.gifts.tsx          # Free gift rules
│   │   ├── app.banners.tsx        # Banner management
│   │   ├── app.settings.tsx       # App settings
│   │   └── api.*.ts               # Storefront API routes
│   ├── models/
│   │   └── schema.prisma          # Database schema
│   ├── shopify.server.ts          # Shopify auth config
│   └── db.server.ts               # Database client
├── extensions/
│   └── cart-drawer/
│       ├── assets/
│       │   ├── cart-drawer.js     # Storefront JS
│       │   └── cart-drawer.css    # Storefront styles
│       └── shopify.extension.toml # Extension config
├── prisma/
│   └── schema.prisma
└── package.json
```

## Database Schema

### Upsell Rules
- Trigger conditions (product, collection, cart value)
- Offer products with optional discounts
- Priority-based ordering

### Free Gift Rules
- Gift product configuration
- Conditions (cart value, specific products, coupon code)
- Locked/unlocked gift handling

### Banners
- Customizable content and colors
- Progress bar support for free shipping
- Position configuration

### Shop Settings
- Drawer position, colors
- Feature toggles (coupons, notes, recommendations)

## Storefront API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/banners?shop=xxx` | Get active banners |
| `/api/upsells?shop=xxx&products=...` | Get upsell recommendations |
| `/api/settings?shop=xxx` | Get drawer settings |

## Customization

### Changing Drawer Appearance

Edit `extensions/cart-drawer/assets/cart-drawer.css`:

```css
:root {
  --drawer-width: 420px;
  --drawer-bg: #ffffff;
  --primary-color: #008060;
}
```

### Adding Custom Upsell Logic

Modify `app/routes/api.upsells.ts` to integrate with your product recommendation service or Shopify's recommendation API.

### Fetching Real Product Data

The current implementation uses mock data. To fetch real products:

```typescript
// In api.upsells.ts
import { unauthenticated } from "../shopify.server";

const { admin } = await unauthenticated.rest(shop);
const products = await admin.get('/products.json', { ids: productIds.join(',') });
```

## Deployment

### Using Shopify CLI (Recommended for testing)

```bash
npm run shopify app deploy
```

### Production Deployment

1. **Choose a hosting provider** (Railway, Fly.io, Heroku, etc.)

2. **Set environment variables** on the platform:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_APP_URL`
   - `DATABASE_URL` (PostgreSQL recommended for production)
   - `SCOPES`

3. **Build and deploy**:
   ```bash
   npm run build
   ```

4. **Update app URLs** in Partner Dashboard

5. **Register webhooks** (if needed):
   ```bash
   npm run shopify app webhook trigger
   ```

## Troubleshooting

### Cart drawer not appearing

1. Check if app embed is enabled in theme settings
2. Verify `cartDrawerEnabled` in database is `true`
3. Check browser console for JavaScript errors
4. Ensure theme isn't conflicting with app embed

### API errors

1. Verify `shop` parameter is passed in API calls
2. Check CORS headers for storefront API
3. Validate Shopify session is active

### Database issues

```bash
# Reset database
rm database.sqlite
npx prisma migrate dev
```

## Next Steps / Enhancements

- [ ] Integrate Shopify's Product Recommendation API
- [ ] Add analytics for upsell conversion tracking
- [ ] Support for multiple currencies
- [ ] Bundle builder functionality
- [ ] Subscription upsells (ReCharge/Seal integration)
- [ ] AI-powered product recommendations

## License

MIT

## Support

For issues or feature requests, please open a GitHub issue.
