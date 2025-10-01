# Wirral Vans Integration Setup

This document explains how to set up the integration between your Mobile Tyre Van site and the Wirral Vans site.

## Overview

The integration allows you to import van inventory from your Wirral Vans site directly into this Mobile Tyre Van site. Vans are fetched via API and imported with all their details including images, specs, and pricing.

## Setup Instructions

### Step 1: Configure Environment Variables

On this Mobile Tyre Van site, add the following environment variables in your Replit Secrets:

```bash
WIRRAL_VANS_API_URL=https://your-wirral-vans-site.replit.app
WIRRAL_VANS_API_KEY=your-secure-api-key-here
```

- `WIRRAL_VANS_API_URL`: The full URL of your Wirral Vans website
- `WIRRAL_VANS_API_KEY`: A secure API key to authenticate requests (generate a random string)

### Step 2: Add API Routes to Wirral Vans Site

On your Wirral Vans site, you need to add public API endpoints that this site can call. Add the following code to your `server/routes.ts` file:

```typescript
// Public API for van export (add this before any authentication-required routes)

// Middleware to check API key
const checkApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const validApiKey = process.env.API_KEY; // Set this in your Replit Secrets
  
  if (apiKey === validApiKey) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Get all exportable vans
app.get("/api/public/vans", checkApiKey, async (req, res) => {
  try {
    const exportable = req.query.exportable === 'true';
    const vans = await storage.getVans();
    
    // Only return published vans for export
    const filteredVans = exportable 
      ? vans.filter(van => van.published)
      : vans;
    
    // Return vans with necessary data
    const exportData = filteredVans.map(van => ({
      id: van.id,
      slug: van.slug,
      title: van.title,
      make: van.make,
      model: van.model,
      year: van.year,
      mileage: van.mileage,
      price: van.price,
      vatIncluded: van.vatIncluded,
      specs: van.specs,
      images: van.images,
      heroImage: van.heroImage
    }));
    
    res.json(exportData);
  } catch (error) {
    console.error("Error fetching vans for export:", error);
    res.status(500).json({ error: "Failed to fetch vans" });
  }
});

// Get single van details
app.get("/api/public/vans/:id", checkApiKey, async (req, res) => {
  try {
    const van = await storage.getVan(req.params.id);
    
    if (!van) {
      return res.status(404).json({ error: "Van not found" });
    }
    
    // Only allow export of published vans
    if (!van.published) {
      return res.status(403).json({ error: "Van not available for export" });
    }
    
    // Return van data
    res.json({
      id: van.id,
      slug: van.slug,
      title: van.title,
      make: van.make,
      model: van.model,
      year: van.year,
      mileage: van.mileage,
      price: van.price,
      vatIncluded: van.vatIncluded,
      specs: van.specs,
      images: van.images,
      heroImage: van.heroImage,
      description: van.description
    });
  } catch (error) {
    console.error("Error fetching van details:", error);
    res.status(500).json({ error: "Failed to fetch van" });
  }
});
```

### Step 3: Set API Key on Wirral Vans Site

On your Wirral Vans site, add this environment variable in your Replit Secrets:

```bash
API_KEY=your-secure-api-key-here
```

**Important:** Use the same API key on both sites. This key should be:
- At least 32 characters long
- Randomly generated (you can use an online UUID generator)
- Kept secure and never committed to your repository

### Step 4: Test the Connection

1. Go to the Admin Dashboard on this Mobile Tyre Van site
2. Click on "Wirral Vans Import"
3. Click "Test Connection" button
4. If successful, you should see a confirmation message

### Step 5: Import Vans

1. On the Wirral Vans Import page, click "Fetch Vans"
2. You'll see all published vans from your Wirral Vans site
3. Select the vans you want to import (click on cards to select/deselect)
4. Click "Import Selected (X)" to import the selected vans
5. Imported vans will be created as unpublished by default
6. Go to "Manage Vans" to review, edit, and publish the imported vans

## How It Works

### Data Flow

```
Wirral Vans Site                    Mobile Tyre Van Site
┌────────────────┐                  ┌────────────────────┐
│  Published     │                  │   Admin clicks     │
│  Van Inventory │                  │   "Fetch Vans"     │
└────────┬───────┘                  └─────────┬──────────┘
         │                                    │
         │                                    │
    ┌────▼─────────────┐              ┌──────▼────────────┐
    │ /api/public/vans │◄─────────────┤  API Request with │
    │  (Auth: Bearer)  │              │  API Key          │
    └────┬─────────────┘              └──────┬────────────┘
         │                                    │
         │ Returns van list                   │
         └────────────────────────────────────►
                                              │
                                    ┌─────────▼────────────┐
                                    │  Display vans,       │
                                    │  allow selection     │
                                    └─────────┬────────────┘
                                              │
                                    ┌─────────▼────────────┐
                                    │  Import selected     │
                                    │  vans to local DB    │
                                    └──────────────────────┘
```

### Security Features

- **API Key Authentication**: All requests require a valid API key
- **Published Vans Only**: Only published vans can be exported
- **Import as Unpublished**: Imported vans start as unpublished for review
- **No Automatic Updates**: Changes on Wirral Vans site don't auto-sync

## Troubleshooting

### "Connection failed" error

Check:
1. Is `WIRRAL_VANS_API_URL` correctly set?
2. Is the Wirral Vans site running and accessible?
3. Are the API routes added to the Wirral Vans site?
4. Is the `API_KEY` environment variable set on Wirral Vans site?

### "Unauthorized" error

Check:
1. Are both API keys exactly the same on both sites?
2. Is the API key being sent in the Authorization header?

### No vans appearing

Check:
1. Are there published vans on the Wirral Vans site?
2. Does the van storage method `getVans()` work correctly?

## Best Practices

1. **Regular Imports**: Import vans regularly to keep inventory up to date
2. **Review Before Publishing**: Always review imported vans before publishing
3. **Update Images**: Consider replacing images with high-quality versions
4. **Price Adjustments**: Adjust prices if needed for the mobile tyre van packages
5. **Keep API Key Secure**: Never share or commit the API key to version control

## Advanced: Automatic Sync (Optional)

If you want vans to automatically sync, you could add a scheduled job:

```typescript
// In your Mobile Tyre Van site, add to server/index.ts
import cron from 'node-cron';

// Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running automatic van sync...');
  try {
    const response = await fetch(`${process.env.WIRRAL_VANS_API_URL}/api/public/vans?exportable=true`, {
      headers: {
        'Authorization': `Bearer ${process.env.WIRRAL_VANS_API_KEY}`
      }
    });
    // Add auto-import logic here
  } catch (error) {
    console.error('Auto-sync failed:', error);
  }
});
```

Note: You'll need to install the `node-cron` package for this feature.

## Support

If you encounter any issues with the integration:
1. Check the browser console for errors
2. Check the server logs on both sites
3. Verify all environment variables are set correctly
4. Test the API endpoints directly using a tool like Postman or curl

Example curl test:
```bash
curl -H "Authorization: Bearer your-api-key" \
  https://your-wirral-vans-site.replit.app/api/public/vans?exportable=true
```
