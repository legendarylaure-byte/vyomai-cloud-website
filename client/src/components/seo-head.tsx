import { Helmet } from "react-helmet-async";

interface SeoHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
}

const DEFAULTS = {
  title: "VyomAi Cloud Pvt. Ltd - AI Solutions for Business & Personal Growth | Nepal",
  description:
    "VyomAi Cloud Pvt. Ltd offers cutting-edge AI agent templates, bots, and seamless integration with Google and Microsoft platforms. Transform your organization with intelligent AI solutions from Nepal to the world.",
  ogImage: "https://vyomai.cloud/og-image.png",
  ogUrl: "https://vyomai.cloud",
  ogType: "website",
  canonical: "https://vyomai.cloud",
};

export function SeoHead({
  title,
  description,
  ogImage,
  ogUrl,
  ogType,
  canonical,
  noindex,
}: SeoHeadProps) {
  const t = title || DEFAULTS.title;
  const d = description || DEFAULTS.description;
  const img = ogImage || DEFAULTS.ogImage;
  const url = ogUrl || DEFAULTS.ogUrl;
  const type = ogType || DEFAULTS.ogType;
  const canon = canonical || DEFAULTS.canonical;

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={canon} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="VyomAi Cloud" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@vyomaicloud" />
      <meta name="twitter:domain" content="vyomai.cloud" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
