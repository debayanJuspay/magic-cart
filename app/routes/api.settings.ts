import { json, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    return json({
      cartDrawerEnabled: true,
      drawerPosition: "right",
      primaryColor: "#008060",
      showRecommendations: true,
      maxRecommendations: 3,
      enableCoupons: true,
      enableNotes: false,
    });
  }

  return json(settings);
};
