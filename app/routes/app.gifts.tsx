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
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

interface FreeGiftRule {
  id: string;
  name: string;
  conditionType: string;
  minCartValue: number | null;
  isActive: boolean;
  giftProductId: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const gifts = await prisma.freeGiftRule.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return json({ gifts });
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
      description: formData.get("description") as string,
      giftProductId: formData.get("giftProductId") as string,
      giftVariantId: (formData.get("giftVariantId") as string) || null,
      giftQuantity: parseInt(formData.get("giftQuantity") as string) || 1,
      allowMultiple: formData.get("allowMultiple") === "true",
      conditionType: formData.get("conditionType") as string,
      minCartValue: formData.get("minCartValue")
        ? parseFloat(formData.get("minCartValue") as string)
        : null,
      requiredProducts: (formData.get("requiredProducts") as string) || null,
      requiredCoupon: (formData.get("requiredCoupon") as string) || null,
      displayAsLocked: formData.get("displayAsLocked") !== "false",
      customMessage: (formData.get("customMessage") as string) || null,
      isActive: formData.get("isActive") === "true",
    };

    await prisma.freeGiftRule.create({ data });
    return json({ success: true });
  }

  if (action === "delete") {
    const id = formData.get("id") as string;
    await prisma.freeGiftRule.deleteMany({ where: { id, shop } });
    return json({ success: true });
  }

  if (action === "toggle") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await prisma.freeGiftRule.updateMany({
      where: { id, shop },
      data: { isActive },
    });
    return json({ success: true });
  }

  return json({ success: false });
};

export default function GiftsPage() {
  const { gifts } = useLoaderData<{ gifts: FreeGiftRule[] }>();
  const submit = useSubmit();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    giftProductId: "",
    giftVariantId: "",
    giftQuantity: "1",
    allowMultiple: false,
    conditionType: "cart_value",
    minCartValue: "",
    requiredProducts: "",
    requiredCoupon: "",
    displayAsLocked: true,
    customMessage: "",
    isActive: true,
  });

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
      description: "",
      giftProductId: "",
      giftVariantId: "",
      giftQuantity: "1",
      allowMultiple: false,
      conditionType: "cart_value",
      minCartValue: "",
      requiredProducts: "",
      requiredCoupon: "",
      displayAsLocked: true,
      customMessage: "",
      isActive: true,
    });
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
      if (confirm("Are you sure you want to delete this gift rule?")) {
        const form = new FormData();
        form.append("action", "delete");
        form.append("id", id);
        submit(form, { method: "POST" });
      }
    },
    [submit]
  );

  const rows = gifts.map((gift) => [
    gift.name,
    gift.conditionType.replace("_", " "),
    gift.minCartValue ? `$${gift.minCartValue}` : "N/A",
    gift.isActive ? "Active" : "Inactive",
    <InlineStack key={gift.id} gap="200">
      <Button
        size="slim"
        onClick={() => handleToggle(gift.id, gift.isActive)}
      >
        {gift.isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button size="slim" tone="critical" onClick={() => handleDelete(gift.id)}>
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Free Gift Rules"
      primaryAction={
        <Button variant="primary" icon={PlusIcon} onClick={() => setModalOpen(true)}>
          Add Gift Rule
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner title="About Free Gifts" tone="success">
              Automatically add free gifts to the cart when customers meet
              specific conditions. Gifts can be locked (non-removable) or
              removable by customers.
            </Banner>

            {gifts.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No gift rules yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  action={{
                    content: "Create Gift Rule",
                    onAction: () => setModalOpen(true),
                  }}
                >
                  <p>Create free gift incentives to encourage larger orders.</p>
                </EmptyState>
              </Card>
            ) : (
              <Card>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={["Name", "Condition", "Min Value", "Status", "Actions"]}
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
        title="Create Free Gift Rule"
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
              label="Rule Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              autoComplete="off"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              autoComplete="off"
              multiline={2}
            />
            <TextField
              label="Gift Product ID"
              value={formData.giftProductId}
              onChange={(value) =>
                setFormData({ ...formData, giftProductId: value })
              }
              autoComplete="off"
              helpText="Product ID to add as free gift"
            />
            <TextField
              label="Gift Variant ID (optional)"
              value={formData.giftVariantId}
              onChange={(value) =>
                setFormData({ ...formData, giftVariantId: value })
              }
              autoComplete="off"
            />
            <InlineStack gap="400">
              <TextField
                label="Quantity"
                type="number"
                value={formData.giftQuantity}
                onChange={(value) =>
                  setFormData({ ...formData, giftQuantity: value })
                }
                autoComplete="off"
              />
              <TextField
                label="Custom Message"
                value={formData.customMessage}
                onChange={(value) =>
                  setFormData({ ...formData, customMessage: value })
                }
                autoComplete="off"
                placeholder="e.g., Free gift unlocked!"
              />
            </InlineStack>
            <Select
              label="Condition Type"
              options={[
                { label: "Minimum cart value", value: "cart_value" },
                { label: "Purchase specific products", value: "product_purchase" },
                { label: "Apply coupon code", value: "coupon_code" },
              ]}
              value={formData.conditionType}
              onChange={(value) =>
                setFormData({ ...formData, conditionType: value })
              }
            />
            {formData.conditionType === "cart_value" && (
              <TextField
                label="Minimum Cart Value"
                type="number"
                value={formData.minCartValue}
                onChange={(value) =>
                  setFormData({ ...formData, minCartValue: value })
                }
                autoComplete="off"
                prefix="$"
              />
            )}
            {formData.conditionType === "product_purchase" && (
              <TextField
                label="Required Product IDs"
                value={formData.requiredProducts}
                onChange={(value) =>
                  setFormData({ ...formData, requiredProducts: value })
                }
                autoComplete="off"
                helpText="Comma-separated product IDs"
              />
            )}
            {formData.conditionType === "coupon_code" && (
              <TextField
                label="Required Coupon Code"
                value={formData.requiredCoupon}
                onChange={(value) =>
                  setFormData({ ...formData, requiredCoupon: value })
                }
                autoComplete="off"
              />
            )}
            <Checkbox
              label="Display as locked (customer cannot remove)"
              checked={formData.displayAsLocked}
              onChange={(checked) =>
                setFormData({ ...formData, displayAsLocked: checked })
              }
            />
            <Checkbox
              label="Allow multiple gifts"
              checked={formData.allowMultiple}
              onChange={(checked) =>
                setFormData({ ...formData, allowMultiple: checked })
              }
            />
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
