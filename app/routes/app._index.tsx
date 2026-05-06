import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Icon,
  Badge,
  Button,
} from "@shopify/polaris";
import {
  ProductIcon,
  GiftCardIcon,
  ImageIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [upsellCount, giftCount, bannerCount, settings] = await Promise.all([
    prisma.upsellRule.count({ where: { shop, isActive: true } }),
    prisma.freeGiftRule.count({ where: { shop, isActive: true } }),
    prisma.banner.count({ where: { shop, isActive: true } }),
    prisma.shopSettings.findUnique({ where: { shop } }),
  ]);

  return json({ upsellCount, giftCount, bannerCount, settings });
};

export default function Index() {
  const { upsellCount, giftCount, bannerCount, settings } =
    useLoaderData<typeof loader>();

  const statCards = [
    {
      title: "Active Upsells",
      count: upsellCount,
      icon: ProductIcon,
      tone: "success" as const,
      link: "/app/upsells",
    },
    {
      title: "Free Gift Rules",
      count: giftCount,
      icon: GiftCardIcon,
      tone: "info" as const,
      link: "/app/gifts",
    },
    {
      title: "Active Banners",
      count: bannerCount,
      icon: ImageIcon,
      tone: "warning" as const,
      link: "/app/banners",
    },
  ];

  return (
    <Page title="Cart Drawer Dashboard">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Text as="h1" variant="headingXl">
              Welcome to Cart Drawer
            </Text>
            <Text tone="subdued">
              Manage your cart drawer upsells, free gifts, and promotional
              banners.
            </Text>

            <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
              {statCards.map((card) => (
                <Card key={card.title}>
                  <BlockStack gap="400">
                    <Box>
                      <Icon source={card.icon} tone={card.tone} />
                    </Box>
                    <BlockStack gap="100">
                      <Text variant="heading2xl" as="h2">
                        {card.count}
                      </Text>
                      <Text tone="subdued">{card.title}</Text>
                    </BlockStack>
                    <Button variant="plain" url={card.link}>
                      Manage
                    </Button>
                  </BlockStack>
                </Card>
              ))}
            </InlineGrid>

            <Card>
              <BlockStack gap="400">
                <Box paddingBlockEnd="200">
                  <InlineGrid columns="1fr auto" alignItems="center">
                    <BlockStack gap="200">
                      <Text variant="headingMd" as="h2">
                        Installation Status
                      </Text>
                      <Text tone="subdued">
                        The cart drawer is{" "}
                        {settings?.cartDrawerEnabled ? "enabled" : "disabled"}{" "}
                        on your store
                      </Text>
                    </BlockStack>
                    <Badge
                      tone={settings?.cartDrawerEnabled ? "success" : "warning"}
                    >
                      {settings?.cartDrawerEnabled ? "Active" : "Inactive"}
                    </Badge>
                  </InlineGrid>
                </Box>
                <Box borderColor="border" borderWidth="025" padding="400">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      How to install on your theme:
                    </Text>
                    <ol style={{ marginLeft: "1rem", lineHeight: "1.8" }}>
                      <li>Go to your Shopify Admin → Online Store → Themes</li>
                      <li>Click Customize on your active theme</li>
                      <li>
                        Go to Theme Settings → App Embeds → Enable "Cart Drawer
                        App"
                      </li>
                      <li>Save the changes</li>
                    </ol>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
