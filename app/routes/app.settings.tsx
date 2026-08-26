import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  deleteMerchantCredentials,
  getMerchantCredentials,
  upsertMerchantCredentials,
} from "../models/merchant-credential.server";

type ActionData =
  | { ok: true; intent: "save" | "delete" }
  | { ok: false; error: string };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const credentials = await getMerchantCredentials(session.shop);

  return {
    merchantKey: credentials?.merchantKey ?? "",
    hasSecret: Boolean(credentials?.merchantSecret),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "save");

  if (intent === "delete") {
    await deleteMerchantCredentials(session.shop);
    return { ok: true, intent: "delete" } satisfies ActionData;
  }

  const merchantKey = String(formData.get("merchantKey") || "").trim();
  const merchantSecret = String(formData.get("merchantSecret") || "").trim();
  const existing = await getMerchantCredentials(session.shop);

  if (!merchantKey) {
    return { ok: false, error: "Enter a merchant key." } satisfies ActionData;
  }

  if (!merchantSecret && !existing) {
    return { ok: false, error: "Enter a merchant secret." } satisfies ActionData;
  }

  await upsertMerchantCredentials({
    shop: session.shop,
    merchantKey,
    merchantSecret: merchantSecret || existing!.merchantSecret,
  });

  return { ok: true, intent: "save" } satisfies ActionData;
};

export default function SettingsPage() {
  const { merchantKey: savedKey, hasSecret } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [merchantKey, setMerchantKey] = useState(savedKey);
  const [merchantSecret, setMerchantSecret] = useState("");

  const isSaving =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") !== "delete";
  const isDeleting =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "delete";
  const error =
    fetcher.data && "ok" in fetcher.data && !fetcher.data.ok
      ? fetcher.data.error
      : "";

  useEffect(() => {
    setMerchantKey(savedKey);
  }, [savedKey]);

  useEffect(() => {
    if (!fetcher.data || !("ok" in fetcher.data) || !fetcher.data.ok) return;

    setMerchantSecret("");
    shopify.toast.show(
      fetcher.data.intent === "delete"
        ? "Merchant credentials removed"
        : "Merchant credentials saved",
    );
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="Settings">
      <s-section heading="Merchant credentials">
        <s-paragraph>
          Add the merchant key and secret for this shop. Values are encrypted
          and stored in the Gemist database, one set per installed store.
        </s-paragraph>

        {hasSecret ? (
          <s-banner heading="Credentials saved" tone="success">
            A merchant secret is already stored. Leave the secret field blank
            to keep it, or enter a new value to replace it.
          </s-banner>
        ) : null}

        <s-stack direction="block" gap="base">
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="save" />
            <s-stack direction="block" gap="base">
              <s-text-field
                name="merchantKey"
                label="Merchant key"
                value={merchantKey}
                onChange={(event) => setMerchantKey(event.currentTarget.value)}
                autocomplete="off"
                required
              />
              <s-password-field
                name="merchantSecret"
                label="Merchant secret"
                value={merchantSecret}
                onChange={(event) =>
                  setMerchantSecret(event.currentTarget.value)
                }
                autocomplete="off"
                details={
                  hasSecret
                    ? "Leave blank to keep the current secret."
                    : "This secret is encrypted before it is saved."
                }
                error={error}
                {...(!hasSecret ? { required: true } : {})}
              />
              <s-button
                type="submit"
                variant="primary"
                {...(isSaving ? { loading: true } : {})}
              >
                Save credentials
              </s-button>
            </s-stack>
          </fetcher.Form>

          {hasSecret ? (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <s-button
                type="submit"
                variant="tertiary"
                tone="critical"
                {...(isDeleting ? { loading: true } : {})}
              >
                Remove credentials
              </s-button>
            </fetcher.Form>
          ) : null}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
