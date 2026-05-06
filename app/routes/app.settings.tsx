import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  Banner,
  BlockStack,
  Text,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let settings = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: { shop },
    });
  }

  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  const data = {
    cartDrawerEnabled: formData.get("cartDrawerEnabled") === "true",
    drawerPosition: formData.get("drawerPosition") as string,
    primaryColor: formData.get("primaryColor") as string,
    showRecommendations: formData.get("showRecommendations") === "true",
    maxRecommendations: parseInt(formData.get("maxRecommendations") as string) || 3,
    enableCoupons: formData.get("enableCoupons") === "true",
    enableNotes: formData.get("enableNotes") === "true",
  };

  await prisma.shopSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });

  return json({ success: true });
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [formData, setFormData] = useState({
    cartDrawerEnabled: settings.cartDrawerEnabled,
    drawerPosition: settings.drawerPosition,
    primaryColor: settings.primaryColor,
    showRecommendations: settings.showRecommendations,
    maxRecommendations: settings.maxRecommendations.toString(),
    enableCoupons: settings.enableCoupons,
    enableNotes: settings.enableNotes,
  });

  const handleSave = useCallback(() => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value.toString());
    });
    submit(form, { method: "POST" });
  }, [formData, submit]);

  return (
    <Page
      title="Settings"
      primaryAction={
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner title="Configure Your Cart Drawer" tone="info">
              Customize the appearance and behavior of your cart drawer.
              Changes take effect immediately on your storefront.
            </Banner>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  General Settings
                </Text>
                <FormLayout>
                  <Checkbox
                    label="Enable Cart Drawer"
                    checked={formData.cartDrawerEnabled}
                    onChange={(checked) =>
                      setFormData({ ...formData, cartDrawerEnabled: checked })
                    }
                    helpText="Turn off to disable the custom cart drawer and revert to native cart"
                  />
                  <Select
                    label="Drawer Position"
                    options={[
                      { label: "Slide from right", value: "right" },
                      { label: "Slide from left", value: "left" },
                    ]}
                    value={formData.drawerPosition}
                    onChange={(value) =>
                      setFormData({ ...formData, drawerPosition: value })
                    }
                  />
                  <TextField
                    label="Primary Color"
                    value={formData.primaryColor}
                    onChange={(value) =>
                      setFormData({ ...formData, primaryColor: value })
                    }
                    autoComplete="off"
                    helpText="Hex color for buttons and accents (e.g., #008060)"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Features
                </Text>
                <FormLayout>
                  <Checkbox
                    label="Show Product Recommendations"
                    checked={formData.showRecommendations}
                    onChange={(checked) =>
                      setFormData({ ...formData, showRecommendations: checked })
                    }
                  />
                  <TextField
                    label="Max Recommendations"
                    type="number"
                    value={formData.maxRecommendations}
                    onChange={(value) =>
                      setFormData({ ...formData, maxRecommendations: value })
                    }
                    autoComplete="off"
                    disabled={!formData.showRecommendations}
                  />
                  <Checkbox
                    label="Enable Coupon Input"
                    checked={formData.enableCoupons}
                    onChange={(checked) =>
                      setFormData({ ...formData, enableCoupons: checked })
                    }
                  />
                  <Checkbox
                    label="Enable Order Notes"
                    checked={formData.enableNotes}
                    onChange={(checked) =>
                      setFormData({ ...formData, enableNotes: checked })
                    }
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Installation Instructions
                </Text>
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <ol style={{ marginLeft: "1.5rem", lineHeight: "2" }}>
                    <li>
                      Go to your{" "}
                      <strong>Shopify Admin → Online Store → Themes</strong>
                    </li>
                    <li>
                      Click <strong>Customize</strong> on your active theme
                    </li>
                    <li>
                      Click the <strong>Theme Settings</strong> tab (paintbrush icon)
                    </li>
                    <li>
                      Navigate to <strong>App Embeds</strong>
                    </li>
                    <li>
                      Find <strong>Cart Drawer App</strong> and toggle it ON
                    </li>
                    <li>
                      Click <strong>Save</strong>
                    </li>
                  </ol>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
