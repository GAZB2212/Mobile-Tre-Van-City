// Copyright © GAJO Creative Ltd
// Proprietary and confidential — unauthorised copying or distribution prohibited

import type { Request } from "express";
import { vanModels } from "../client/src/pages/seo/data/vanModels";
import { locations } from "../client/src/pages/seo/data/locations";

export const SITE_URL = "https://www.mobiletyrevancity.co.uk";
export const SITE_NAME = "Mobile Tyre Van City";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

declare global {
  namespace Express {
    interface Request {
      __seoMeta?: PageMeta;
    }
  }
}

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
}

export const staticRouteMeta: Record<string, PageMeta> = {
  "/": {
    title: `Mobile Tyre Van Conversions UK | ${SITE_NAME}`,
    description: "UK specialists in custom mobile tyre van conversions. Fully equipped builds, nationwide delivery, finance available. Based in Wirral. Call 0151 203 8500.",
    canonical: "/",
  },
  "/stock": {
    title: `Mobile Tyre Vans For Sale UK | ${SITE_NAME}`,
    description: "Mobile tyre vans for sale — professionally converted, fully equipped. UK-wide delivery and finance options available. Call 0151 203 8500.",
    canonical: "/stock",
  },
  "/configurator": {
    title: `Build Your Mobile Tyre Van | ${SITE_NAME}`,
    description: "Build your mobile tyre van online. Choose your van, equipment kit and upgrades for an instant quote. UK-wide delivery. Call 0151 203 8500.",
    canonical: "/configurator",
  },
  "/finance": {
    title: `Tyre Van Finance UK | ${SITE_NAME}`,
    description: "Flexible finance for your mobile tyre van. Free calculator, competitive rates. FCA authorised credit broker. Monthly plans available. Call 0151 203 8500.",
    canonical: "/finance",
  },
  "/training": {
    title: `Tyre Fitting Training UK | ${SITE_NAME}`,
    description: "REACT motorway certification and tyre fitting courses. Start your mobile tyre business legally and safely. Wirral-based, UK-wide training. Call 0151 203 8500.",
    canonical: "/training",
  },
  "/gallery": {
    title: `Gallery | ${SITE_NAME}`,
    description: "View our completed mobile tyre van conversions. See the quality of our in-house builds and get inspired for your own van.",
    canonical: "/gallery",
  },
  "/about": {
    title: `About Us | ${SITE_NAME}`,
    description: "Meet the team at Mobile Tyre Van City, UK specialists in mobile tyre van conversions. Based in Wirral, delivering nationwide. Call 0151 203 8500.",
    canonical: "/about",
  },
  "/contact": {
    title: `Contact Us | ${SITE_NAME}`,
    description: "Call 0151 203 8500 or visit 5-7 Bassendale Road, Bromborough, Wirral CH62 3QL. Get a quote on your mobile tyre van conversion today.",
    canonical: "/contact",
  },
  "/how-it-works": {
    title: `How It Works | ${SITE_NAME}`,
    description: "How we build your mobile tyre van in 4 steps: choose van, pick kit, add upgrades, arrange finance. UK-built by our in-house team, nationwide delivery.",
    canonical: "/how-it-works",
  },
  "/business-opportunity": {
    title: `Mobile Tyre Business Opportunity | ${SITE_NAME}`,
    description: "Why mobile tyre fitting is one of the UK's fastest-growing small businesses. Operators earning up to £1,200 per day. Van, training and support included.",
    canonical: "/business-opportunity",
  },
  "/blog": {
    title: `Blog | Mobile Tyre Van Insights & Industry News | ${SITE_NAME}`,
    description: "Expert advice, industry news, and practical guides for mobile tyre van operators. Tips on growing your mobile tyre business from the MTVC team.",
    canonical: "/blog",
  },
};

export function resolveStaticMeta(urlPath: string): PageMeta | null {
  const cleanPath = urlPath.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  
  if (staticRouteMeta[cleanPath]) {
    return staticRouteMeta[cleanPath];
  }

  if (cleanPath.startsWith("/configurator/")) {
    return staticRouteMeta["/configurator"];
  }

  // Van conversion hub page
  if (cleanPath === "/van-conversions") {
    return {
      title: `Tyre Van Conversions UK | ${SITE_NAME}`,
      description: "All major L3H3 panel vans converted for mobile tyre fitting — Ford Transit, Sprinter, Crafter and more. UK delivery, finance available. Call 0151 203 8500.",
      canonical: "/van-conversions",
    };
  }

  // Van model page
  if (cleanPath.startsWith("/van-conversions/")) {
    const slug = cleanPath.replace("/van-conversions/", "");
    const van = vanModels.find((v) => v.slug === slug);
    if (van) {
      return {
        title: `${van.displayName} Tyre Van Conversion | ${SITE_NAME}`,
        description: `${van.displayName} converted for mobile tyre fitting. ${van.loadVolumeCubicM} m³ load, ${van.payloadKg} kg payload. Euro 6, UK-wide delivery. Finance available. 0151 203 8500.`,
        canonical: `/van-conversions/${van.slug}`,
      };
    }
  }

  // Location hub page
  if (cleanPath === "/mobile-tyre-vans") {
    return {
      title: `Mobile Tyre Van Delivery UK | ${SITE_NAME}`,
      description: "Mobile tyre van conversions delivered UK-wide. 76 areas covered from Liverpool to London. Finance available. Call 0151 203 8500.",
      canonical: "/mobile-tyre-vans",
    };
  }

  // Location page
  if (cleanPath.startsWith("/mobile-tyre-vans/")) {
    const slug = cleanPath.replace("/mobile-tyre-vans/", "");
    const location = locations.find((l) => l.slug === slug);
    if (location) {
      return {
        title: `Mobile Tyre Vans in ${location.name} | ${SITE_NAME}`,
        description: `Mobile tyre van delivered to ${location.name}, ${location.county}. Fully equipped L3H3 build, Euro 6. Finance available. Call 0151 203 8500.`,
        canonical: `/mobile-tyre-vans/${location.slug}`,
      };
    }
  }

  return null;
}

export function buildVanMeta(van: { year: number; make: string; model: string; mileage: number; slug: string; specs: { transmission?: string; fuel?: string }; heroImage?: string | null; images?: string[] }): PageMeta {
  const vanTitle = `${van.year} ${van.make} ${van.model}`;
  const image = van.heroImage || (van.images && van.images[0]) || DEFAULT_OG_IMAGE;
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
  // Keep title under ~65 chars: if full name is too long, use year + make only
  const shortBase = `${van.year} ${van.make}`;
  const fullBase = vanTitle;
  const suffix = ` | Tyre Van For Sale | ${SITE_NAME}`;
  const titleBase = (fullBase + suffix).length <= 65 ? fullBase : shortBase;
  return {
    title: `${titleBase}${suffix}`,
    description: `For sale: ${vanTitle} mobile tyre van conversion. Fully equipped and ready to earn${van.mileage ? ` — ${van.mileage.toLocaleString()} miles` : ''}. Finance available. Call 0151 203 8500.`,
    canonical: `/stock/${van.slug}`,
    ogImage: absoluteImage,
    ogType: "product",
  };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function injectMetaIntoHtml(html: string, meta: PageMeta): string {
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
  const canonicalUrl = `${SITE_URL}${meta.canonical === "/" ? "" : meta.canonical}`;
  const ogType = meta.ogType || "website";

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(meta.description)}">`
  );

  // Replace og: tags if already present, or collect new ones for injection
  const ogReplacements: Array<{ attr: string; name: string; value: string }> = [
    { attr: 'property', name: 'og:title', value: meta.title },
    { attr: 'property', name: 'og:description', value: meta.description },
    { attr: 'property', name: 'og:type', value: ogType },
    { attr: 'property', name: 'og:url', value: canonicalUrl },
    { attr: 'property', name: 'og:image', value: ogImage },
    { attr: 'property', name: 'og:site_name', value: SITE_NAME },
    { attr: 'name', name: 'twitter:title', value: meta.title },
    { attr: 'name', name: 'twitter:description', value: meta.description },
    { attr: 'name', name: 'twitter:image', value: ogImage },
  ];

  const tagsToInject: string[] = [];
  for (const { attr, name, value } of ogReplacements) {
    const regex = new RegExp(`<meta\\s+${attr}="${name.replace(/:/g, '\\:')}\\s*"\\s+content="[^"]*"\\s*/?>`, 'i');
    if (regex.test(html)) {
      html = html.replace(regex, `<meta ${attr}="${name}" content="${escapeHtml(value)}" />`);
    } else {
      tagsToInject.push(`<meta ${attr}="${name}" content="${escapeHtml(value)}" />`);
    }
  }

  // Replace canonical if already exists, else inject it
  const canonicalRegex = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (canonicalRegex.test(html)) {
    html = html.replace(canonicalRegex, canonicalTag);
  } else {
    tagsToInject.push(canonicalTag);
  }

  // Replace hreflang en-gb if exists
  const hreflangRegex = /<link\s+rel="alternate"\s+hreflang="en-gb"\s+href="[^"]*"\s*\/?>/i;
  const hreflangTag = `<link rel="alternate" hreflang="en-gb" href="${canonicalUrl}" />`;
  if (hreflangRegex.test(html)) {
    html = html.replace(hreflangRegex, hreflangTag);
  } else {
    tagsToInject.push(hreflangTag);
  }

  // Replace x-default hreflang if exists, or add it
  const xDefaultRegex = /<link\s+rel="alternate"\s+hreflang="x-default"\s+href="[^"]*"\s*\/?>/i;
  const xDefaultTag = `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`;
  if (xDefaultRegex.test(html)) {
    html = html.replace(xDefaultRegex, xDefaultTag);
  } else {
    tagsToInject.push(xDefaultTag);
  }

  // Inject author/copyright/generator attribution tags if not already present
  if (!html.includes('name="author"')) {
    tagsToInject.push(`<meta name="author" content="GAJO Creative Ltd">`);
  }
  if (!html.includes('name="copyright"')) {
    tagsToInject.push(`<meta name="copyright" content="© GAJO Creative Ltd">`);
  }
  if (!html.includes('name="generator"')) {
    tagsToInject.push(`<meta name="generator" content="GAJO Platform Systems">`);
  }

  if (tagsToInject.length > 0) {
    html = html.replace("</head>", `  ${tagsToInject.join('\n    ')}\n  </head>`);
  }

  return html;
}
