import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Text,
  Modal,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Banner,
  InlineStack,
  BlockStack,
  EmptyState,
  ColorPicker,
  hsbToRgb,
  rgbToHsb,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

interface BannerItem {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  displayType: string;
  position: string;
}

function hexToHsb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgbToHsb({ red: r, green: g, blue: b });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const banners = await prisma.banner.findMany({
    where: { shop },
    orderBy: { priority: "desc" },
  });

  return json({ banners });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "create") {
    const data = {
      shop,
      name: formData.get("name") as string,
      content: formData.get("content") as string,
      textColor: formData.get("textColor") as string,
      bgColor: formData.get("bgColor") as string,
      icon: (formData.get("icon") as string) || null,
      displayType: formData.get("displayType") as string,
      targetValue: formData.get("targetValue")
        ? parseFloat(formData.get("targetValue") as string)
        : null,
      position: formData.get("position") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
      isActive: formData.get("isActive") === "true",
    };

    await prisma.banner.create({ data });
    return json({ success: true });
  }

  if (action === "delete") {
    const id = formData.get("id") as string;
    await prisma.banner.deleteMany({ where: { id, shop } });
    return json({ success: true });
  }

  if (action === "toggle") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await prisma.banner.updateMany({
      where: { id, shop },
      data: { isActive },
    });
    return json({ success: true });
  }

  return json({ success: false });
};

export default function BannersPage() {
  const { banners } = useLoaderData<{ banners: BannerItem[] }>();
  const submit = useSubmit();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    textColor: "#FFFFFF",
    bgColor: "#008060",
    icon: "",
    displayType: "always",
    targetValue: "",
    position: "top",
    priority: "0",
    isActive: true,
  });

  const [textColorHsb, setTextColorHsb] = useState(hexToHsb("#FFFFFF"));
  const [bgColorHsb, setBgColorHsb] = useState(hexToHsb("#008060"));

  const handleCreate = useCallback(() => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value.toString());
    });
    form.append("action", "create");
    submit(form, { method: "POST" });
    setModalOpen(false);
    setFormData({
      name: "",
      content: "",
      textColor: "#FFFFFF",
      bgColor: "#008060",
      icon: "",
      displayType: "always",
      targetValue: "",
      position: "top",
      priority: "0",
      isActive: true,
    });
    setTextColorHsb(hexToHsb("#FFFFFF"));
    setBgColorHsb(hexToHsb("#008060"));
  }, [formData, submit]);

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      const form = new FormData();
      form.append("action", "toggle");
      form.append("id", id);
      form.append("isActive", (!isActive).toString());
      submit(form, { method: "POST" });
    },
    [submit]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this banner?")) {
        const form = new FormData();
        form.append("action", "delete");
        form.append("id", id);
        submit(form, { method: "POST" });
      }
    },
    [submit]
  );

  const rows = banners.map((banner) => [
    banner.name,
    banner.content.substring(0, 50) + (banner.content.length > 50 ? "..." : ""),
    banner.position,
    banner.isActive ? "Active" : "Inactive",
    <InlineStack key={banner.id} gap="200">
      <Button
        size="slim"
        onClick={() => handleToggle(banner.id, banner.isActive)}
      >
        {banner.isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button size="slim" tone="critical" onClick={() => handleDelete(banner.id)}>
        Delete
      </Button>
    </InlineStack>,
  ]);

  const rgbToHex = (rgb: { red: number; green: number; blue: number }) => {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
    return `#${toHex(rgb.red)}${toHex(rgb.green)}${toHex(rgb.blue)}`;
  };

  return (
    <Page
      title="Promotional Banners"
      primaryAction={
        <Button variant="primary" icon={PlusIcon} onClick={() => setModalOpen(true)}>
          Add Banner
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner title="About Banners" tone="warning">
              Display promotional messages in your cart drawer. Use progress
              bars to encourage customers to reach free shipping thresholds or
              minimum order values.
            </Banner>

            {banners.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No banners yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  action={{
                    content: "Create Banner",
                    onAction: () => setModalOpen(true),
                  }}
                >
                  <p>Create banners to promote offers and motivate purchases.</p>
                </EmptyState>
              </Card>
            ) : (
              <Card>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={["Name", "Content", "Position", "Status", "Actions"]}
                  rows={rows}
                />
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Banner"
        primaryAction={{
          content: "Create",
          onAction: handleCreate,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Banner Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              autoComplete="off"
            />
            <TextField
              label="Banner Content"
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              autoComplete="off"
              multiline={2}
              helpText="Use {{remaining}} placeholder for cart value progress"
            />
            <TextField
              label="Icon (emoji)"
              value={formData.icon}
              onChange={(value) => setFormData({ ...formData, icon: value })}
              autoComplete="off"
              placeholder="🎁"
            />
            <Select
              label="Display Type"
              options={[
                { label: "Always show", value: "always" },
                { label: "Cart value progress", value: "cart_value_progress" },
                { label: "Product based", value: "product_based" },
              ]}
              value={formData.displayType}
              onChange={(value) =>
                setFormData({ ...formData, displayType: value })
              }
            />
            {formData.displayType === "cart_value_progress" && (
              <TextField
                label="Target Value"
                type="number"
                value={formData.targetValue}
                onChange={(value) =>
                  setFormData({ ...formData, targetValue: value })
                }
                autoComplete="off"
                prefix="$"
                helpText="Target amount for progress bar (e.g., 50 for free shipping)"
              />
            )}
            <Select
              label="Position"
              options={[
                { label: "Top of drawer", value: "top" },
                { label: "Bottom of drawer", value: "bottom" },
                { label: "Above cart items", value: "above_items" },
              ]}
              value={formData.position}
              onChange={(value) =>
                setFormData({ ...formData, position: value })
              }
            />
            <BlockStack gap="200">
              <Text variant="bodyMd" as="span">
                Text Color
              </Text>
              <ColorPicker
                color={textColorHsb}
                onChange={(color) => {
                  setTextColorHsb(color);
                  const rgb = hsbToRgb(color);
                  setFormData({ ...formData, textColor: rgbToHex(rgb) });
                }}
              />
            </BlockStack>
            <BlockStack gap="200">
              <Text variant="bodyMd" as="span">
                Background Color
              </Text>
              <ColorPicker
                color={bgColorHsb}
                onChange={(color) => {
                  setBgColorHsb(color);
                  const rgb = hsbToRgb(color);
                  setFormData({ ...formData, bgColor: rgbToHex(rgb) });
                }}
              />
            </BlockStack>
            <Checkbox
              label="Active"
              checked={formData.isActive}
              onChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
