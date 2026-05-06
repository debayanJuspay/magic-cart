import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigate } from "@remix-run/react";
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
  Box,
  BlockStack,
  EmptyState,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

interface UpsellRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  offerProducts: string;
  priority: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const upsells = await prisma.upsellRule.findMany({
    where: { shop },
    orderBy: { priority: "desc" },
  });

  return json({ upsells, shop });
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
      triggerType: formData.get("triggerType") as string,
      triggerProducts: formData.get("triggerProducts") as string,
      offerType: formData.get("offerType") as string,
      offerProducts: formData.get("offerProducts") as string,
      offerLimit: parseInt(formData.get("offerLimit") as string) || 1,
      discountPercent: formData.get("discountPercent")
        ? parseFloat(formData.get("discountPercent") as string)
        : null,
      priority: parseInt(formData.get("priority") as string) || 0,
      isActive: formData.get("isActive") === "true",
    };

    await prisma.upsellRule.create({ data });
    return json({ success: true });
  }

  if (action === "delete") {
    const id = formData.get("id") as string;
    await prisma.upsellRule.deleteMany({ where: { id, shop } });
    return json({ success: true });
  }

  if (action === "toggle") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await prisma.upsellRule.updateMany({
      where: { id, shop },
      data: { isActive },
    });
    return json({ success: true });
  }

  return json({ success: false });
};

export default function UpsellsPage() {
  const { upsells } = useLoaderData<{ upsells: UpsellRule[] }>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "always",
    triggerProducts: "",
    offerType: "product",
    offerProducts: "",
    offerLimit: "1",
    discountPercent: "",
    priority: "0",
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
      triggerType: "always",
      triggerProducts: "",
      offerType: "product",
      offerProducts: "",
      offerLimit: "1",
      discountPercent: "",
      priority: "0",
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
      if (confirm("Are you sure you want to delete this upsell rule?")) {
        const form = new FormData();
        form.append("action", "delete");
        form.append("id", id);
        submit(form, { method: "POST" });
      }
    },
    [submit]
  );

  const rows = upsells.map((upsell) => [
    upsell.name,
    upsell.triggerType.replace("_", " "),
    upsell.offerProducts.split(",").length + " products",
    upsell.isActive ? "Active" : "Inactive",
    <InlineStack key={upsell.id} gap="200">
      <Button
        size="slim"
        onClick={() => handleToggle(upsell.id, upsell.isActive)}
      >
        {upsell.isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button size="slim" tone="critical" onClick={() => handleDelete(upsell.id)}>
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Upsell Rules"
      primaryAction={
        <Button variant="primary" icon={PlusIcon} onClick={() => setModalOpen(true)}>
          Add Upsell Rule
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner title="About Upsells" tone="info">
              Create upsell rules to show product recommendations in the cart
              drawer. Rules trigger based on cart contents and show relevant
              products customers can add with one click.
            </Banner>

            {upsells.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No upsell rules yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  action={{
                    content: "Create Upsell Rule",
                    onAction: () => setModalOpen(true),
                  }}
                >
                  <p>Create your first upsell rule to boost average order value.</p>
                </EmptyState>
              </Card>
            ) : (
              <Card>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={["Name", "Trigger", "Offers", "Status", "Actions"]}
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
        title="Create Upsell Rule"
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
              helpText="Internal name for this rule"
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
            <Select
              label="Trigger Type"
              options={[
                { label: "Always show", value: "always" },
                { label: "Specific products in cart", value: "product" },
                { label: "Products from collection", value: "collection" },
                { label: "Minimum cart value", value: "cart_value" },
              ]}
              value={formData.triggerType}
              onChange={(value) =>
                setFormData({ ...formData, triggerType: value })
              }
            />
            {formData.triggerType === "product" && (
              <TextField
                label="Trigger Product IDs"
                value={formData.triggerProducts}
                onChange={(value) =>
                  setFormData({ ...formData, triggerProducts: value })
                }
                autoComplete="off"
                helpText="Comma-separated product IDs"
              />
            )}
            <TextField
              label="Offer Product IDs"
              value={formData.offerProducts}
              onChange={(value) =>
                setFormData({ ...formData, offerProducts: value })
              }
              autoComplete="off"
              helpText="Comma-separated product/variant IDs to offer as upsells"
            />
            <InlineStack gap="400">
              <TextField
                label="Max Quantity"
                type="number"
                value={formData.offerLimit}
                onChange={(value) =>
                  setFormData({ ...formData, offerLimit: value })
                }
                autoComplete="off"
              />
              <TextField
                label="Discount % (optional)"
                type="number"
                value={formData.discountPercent}
                onChange={(value) =>
                  setFormData({ ...formData, discountPercent: value })
                }
                autoComplete="off"
                suffix="%"
              />
            </InlineStack>
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
