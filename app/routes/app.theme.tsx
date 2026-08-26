import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const editorBase = `https://${session.shop}/admin/themes/current/editor`;

  return {
    shop: session.shop,
    addBlockUrl: `${editorBase}?template=product&addAppBlockId=${apiKey}/gemist-data&target=mainSection`,
    addSectionUrl: `${editorBase}?template=product&addAppBlockId=${apiKey}/gemist-data&target=newAppsSection`,
    activateEmbedUrl: `${editorBase}?context=apps&activateAppId=${apiKey}/gemist-embed`,
  };
};

export default function ThemePage() {
  const { addBlockUrl, addSectionUrl, activateEmbedUrl } =
    useLoaderData<typeof loader>();

  return (
    <s-page heading="Theme">
      <s-section heading="Add Gemist to the storefront">
        <s-paragraph>
          Merchants can drop the Gemist data card into Online Store 2.0 themes
          without editing Liquid. The block reads product metafields and can be
          restyled in the theme editor.
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-button href={addBlockUrl} target="_blank" variant="primary">
            Add data card to product page
          </s-button>
          <s-button href={addSectionUrl} target="_blank">
            Add as full-width section
          </s-button>
          <s-button href={activateEmbedUrl} target="_blank" variant="tertiary">
            Enable floating widget
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="Storefront data">
        <s-paragraph>
          Fill these product metafields and the theme block will render them:
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            <s-text>headline</s-text> — card title
          </s-list-item>
          <s-list-item>
            <s-text>summary</s-text> — supporting copy
          </s-list-item>
          <s-list-item>
            <s-text>badge</s-text> — small label above the title
          </s-list-item>
          <s-list-item>
            <s-text>storefront</s-text> — optional JSON for stats and a CTA
          </s-list-item>
        </s-unordered-list>
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            <code>{`{
  "headline": "Crafted in 18K gold",
  "summary": "Hand-finished details made for daily wear.",
  "badge": "Gemist",
  "items": [
    { "label": "Metal", "value": "18K gold" },
    { "label": "Origin", "value": "India" }
  ],
  "cta_label": "See details",
  "cta_url": "/pages/about"
}`}</code>
          </pre>
        </s-box>
      </s-section>

      <s-section slot="aside" heading="Where it appears">
        <s-unordered-list>
          <s-list-item>Product, collection, home, and page templates</s-list-item>
          <s-list-item>Theme editor → Apps → Data card</s-list-item>
          <s-list-item>Theme settings → App embeds → Floating widget</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
