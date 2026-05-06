import { json, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

interface UpsellProduct {
  id: string;
  title: string;
  price: number;
  variantId: string;
  image: string;
  discountPercent: number | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productIds = url.searchParams.get("products")?.split(",") || [];
  const cartValue = parseFloat(url.searchParams.get("cartValue") || "0");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  // Fetch active upsell rules
  const rules = await prisma.upsellRule.findMany({
    where: {
      shop,
      isActive: true,
    },
    orderBy: { priority: "desc" },
  });

  // Filter rules based on conditions
  const applicableRules = rules.filter((rule) => {
    switch (rule.triggerType) {
      case "always":
        return true;
      case "product":
        if (!rule.triggerProducts) return false;
        const triggerProducts = rule.triggerProducts.split(",");
        return productIds.some((id) => triggerProducts.includes(id));
      case "collection":
        // Would need additional logic to check collections
        return true;
      case "cart_value":
        const minValue = rule.minCartValue || 0;
        return cartValue >= minValue * 100; // Convert to cents
      default:
        return false;
    }
  });

  // Get offer products from applicable rules
  const offerProductIds: string[] = [];
  const productDiscounts: Record<string, number> = {};

  for (const rule of applicableRules) {
    const offers = rule.offerProducts.split(",").filter(Boolean);
    for (const offerId of offers) {
      if (!offerProductIds.includes(offerId)) {
        offerProductIds.push(offerId);
        if (rule.discountPercent) {
          productDiscounts[offerId] = rule.discountPercent;
        }
      }
    }
  }

  // Mock product data - in production, fetch from Shopify Admin API
  // This is a simplified version - you'd want to fetch real product data
  const mockProducts: UpsellProduct[] = offerProductIds.map((id, index) => ({
    id,
    title: `Recommended Product ${index + 1}`,
    price: 2999 + index * 1000,
    variantId: id,
    image: `https://via.placeholder.com/300x300/008060/ffffff?text=Product+${index + 1}`,
    discountPercent: productDiscounts[id] || null,
  }));

  return json(mockProducts);
};
