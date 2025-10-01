# Wirral Vans Vehicle Push Integration

This webhook allows your Wirral Vans site to automatically push vehicle data to this Mobile Tyre Van site, creating new vans in the inventory without manual data entry.

## Setup

### 1. Configure API Key

On this Mobile Tyre Van site, set the following environment variable in your Replit Secrets:

```bash
WIRRAL_VANS_API_KEY=your-secure-api-key-here
```

**Important:** Generate a secure, random API key (at least 32 characters). You'll use the same key on your Wirral Vans site.

### 2. Webhook Endpoint

**URL:** `https://your-mobile-tyre-site.replit.app/api/webhooks/wirral-vans/push-vehicle`

**Method:** `POST`

**Authentication:** Bearer token in Authorization header

**Headers:**
```
Authorization: Bearer your-secure-api-key-here
Content-Type: application/json
```

### 3. Expected Data Format

Send vehicle data in the following JSON format:

```json
{
  "title": "2022 Ford Transit Custom",
  "make": "Ford",
  "model": "Transit Custom",
  "year": 2022,
  "mileage": 45000,
  "price": 2500000,
  "vatIncluded": false,
  "specs": {
    "transmission": "Manual",
    "size": "Medium",
    "fuel": "Diesel",
    "doors": 4,
    "engine": "2.0L EcoBlue"
  },
  "images": [
    "https://your-storage.com/van-image-1.jpg",
    "https://your-storage.com/van-image-2.jpg"
  ],
  "heroImage": "https://your-storage.com/van-hero.jpg",
  "slug": "ford-transit-custom-2022"
}
```

**Field Details:**
- `title` (string, required): Full vehicle title
- `make` (string, required): Vehicle manufacturer
- `model` (string, required): Vehicle model
- `year` (number, required): Year of manufacture
- `mileage` (number, required): Odometer reading in miles
- `price` (number, required): Price in **pence** (multiply pounds by 100)
- `vatIncluded` (boolean, optional): Whether VAT is included in price (default: false)
- `specs` (object, required): Vehicle specifications
  - `transmission` (string): e.g., "Manual", "Automatic"
  - `size` (string): e.g., "Small", "Medium", "Large"
  - `fuel` (string): e.g., "Diesel", "Petrol", "Electric"
  - `doors` (number, optional): Number of doors
  - `engine` (string, optional): Engine description
- `images` (array, optional): Array of image URLs
- `heroImage` (string, optional): Main display image URL
- `slug` (string, optional): URL-friendly identifier (auto-generated if not provided)

## Implementation on Wirral Vans Site

### Option 1: Add Button to Vehicle Management Page

Add a "Push to Mobile Tyre Site" button next to each vehicle in your admin panel:

```typescript
// In your Vans.tsx admin page
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function VanRow({ van }) {
  const { toast } = useToast();
  
  const pushVanMutation = useMutation({
    mutationFn: async (vanData) => {
      const response = await fetch('https://your-mobile-tyre-site.replit.app/api/webhooks/wirral-vans/push-vehicle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WIRRAL_VANS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vanData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to push vehicle');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vehicle pushed successfully",
        description: "Vehicle added to Mobile Tyre Van site",
      });
    },
    onError: () => {
      toast({
        title: "Push failed",
        description: "Could not push vehicle to Mobile Tyre Van site",
        variant: "destructive",
      });
    },
  });

  const handlePushVan = () => {
    pushVanMutation.mutate({
      title: van.title,
      make: van.make,
      model: van.model,
      year: van.year,
      mileage: van.mileage,
      price: van.price,
      vatIncluded: van.vatIncluded,
      specs: van.specs,
      images: van.images || [],
      heroImage: van.heroImage,
      slug: van.slug,
    });
  };

  return (
    <tr>
      {/* Your existing table cells */}
      <td>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePushVan}
          disabled={pushVanMutation.isPending}
        >
          {pushVanMutation.isPending ? (
            "Pushing..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Push to Mobile Tyre
            </>
          )}
        </Button>
      </td>
    </tr>
  );
}
```

### Option 2: Backend Route (Server-Side Push)

If you prefer to push from your backend:

```typescript
// In your server/routes.ts on Wirral Vans site
app.post("/api/admin/vans/:id/push-to-mobile-tyre", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const van = await storage.getVan(req.params.id);
    
    if (!van) {
      return res.status(404).json({ error: "Van not found" });
    }

    const response = await fetch('https://your-mobile-tyre-site.replit.app/api/webhooks/wirral-vans/push-vehicle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WIRRAL_VANS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: van.title,
        make: van.make,
        model: van.model,
        year: van.year,
        mileage: van.mileage,
        price: van.price,
        vatIncluded: van.vatIncluded,
        specs: van.specs,
        images: van.images || [],
        heroImage: van.heroImage,
        slug: van.slug,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'Failed to push vehicle' });
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Error pushing vehicle:", error);
    res.status(500).json({ error: "Failed to push vehicle" });
  }
});
```

Then call this from your frontend:

```typescript
const pushVanMutation = useMutation({
  mutationFn: async (vanId: string) => {
    const response = await fetch(`/api/admin/vans/${vanId}/push-to-mobile-tyre`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to push vehicle');
    return response.json();
  },
  onSuccess: () => {
    toast({ title: "Success", description: "Vehicle pushed to Mobile Tyre Van site" });
  },
});
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "vanId": "uuid-of-created-van",
  "message": "Vehicle successfully added to inventory"
}
```

### Error Responses

**401 Unauthorized** - Invalid API key
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request** - Invalid vehicle data
```json
{
  "error": "Invalid vehicle data",
  "details": [
    {
      "path": ["price"],
      "message": "Required"
    }
  ]
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Failed to process vehicle"
}
```

## Testing

You can test the webhook using curl:

```bash
curl -X POST https://your-mobile-tyre-site.replit.app/api/webhooks/wirral-vans/push-vehicle \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2022 Ford Transit Custom",
    "make": "Ford",
    "model": "Transit Custom",
    "year": 2022,
    "mileage": 45000,
    "price": 2500000,
    "vatIncluded": false,
    "specs": {
      "transmission": "Manual",
      "size": "Medium",
      "fuel": "Diesel"
    }
  }'
```

## Important Notes

1. **Price Format**: Always send price in **pence**, not pounds. Multiply by 100.
2. **Unpublished by Default**: Pushed vehicles are created as unpublished for admin review
3. **Image URLs**: Use full URLs (https://) for all image paths
4. **Slug Uniqueness**: Ensure slugs are unique to avoid conflicts
5. **API Key Security**: Never commit the API key to your repository

## Workflow

1. Admin on Wirral Vans site finds a van suitable for mobile tyre conversion
2. Admin clicks "Push to Mobile Tyre Site" button
3. Vehicle data is sent via webhook to Mobile Tyre Van site
4. New van is created in Mobile Tyre inventory (unpublished)
5. Admin on Mobile Tyre site reviews and publishes the van
6. Van appears on Mobile Tyre website for customers

## Troubleshooting

### "Webhook not configured" error
- Check that `WIRRAL_VANS_API_KEY` is set on Mobile Tyre Van site

### "Unauthorized" error
- Verify API key matches on both sites
- Check Authorization header format: `Bearer your-key`

### "Invalid vehicle data" error
- Check all required fields are present
- Verify price is in pence (number)
- Ensure specs object has required fields

### Vehicle not appearing
- Check that vehicle was created (check server logs on Mobile Tyre site)
- Remember vehicles are created as unpublished - check admin panel
