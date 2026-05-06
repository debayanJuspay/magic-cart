import { json, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const banners = await prisma.banner.findMany({
    where: {
      shop,
      isActive: true,
    },
    orderBy: { priority: "desc" },
  });

  return json(banners);
};
