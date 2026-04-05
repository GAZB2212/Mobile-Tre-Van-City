import type { Request } from "express";
import { vanModels } from "../client/src/pages/seo/data/vanModels";
import { locations } from "../client/src/pages/seo/data/locations";

export const SITE_URL = "https://www.mobiletyrevancity.co.uk";
export const SITE_NAME = "Mobile Tyre Van City";

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
    title: `The Mobile Tyre Business Opportunity | ${SITE_NAME}`,
    description: "Why mobile tyre fitting is one of the UK's fastest-growing small businesses. Operators earning up to £1,200 per day. Van, training and ongoing support included.",
    canonical: "/business-opportunity",
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
        title: `${van.displayName} Tyre Van | ${SITE_NAME}`,
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
        title: `Tyre Vans in ${location.name} | ${SITE_NAME}`,
        description: `Mobile tyre van delivered to ${location.name}, ${location.county}. Fully equipped L3H3 build, Euro 6. Finance available. Call 0151 203 8500.`,
        canonical: `/mobile-tyre-vans/${location.slug}`,
      };
    }
  }

  return null;
}

export function buildVanMeta(van: { year: number; make: string; model: string; mileage: number; slug: string; specs: { transmission?: string; fuel?: string } }): PageMeta {
  const vanTitle = `${van.year} ${van.make} ${van.model}`;
  return {
    title: `${vanTitle} - Tyre Van For Sale | ${SITE_NAME}`,
    description: `For sale: ${vanTitle}. Fully equipped mobile tyre van conversion${van.mileage ? ` — ${van.mileage.toLocaleString()} miles` : ''}. Finance available. Call 0151 203 8500.`,
    canonical: `/stock/${van.slug}`,
  };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function injectMetaIntoHtml(html: string, meta: PageMeta): string {
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(meta.description)}">`
  );

  const canonicalUrl = `${SITE_URL}${meta.canonical === "/" ? "" : meta.canonical}`;
  const hreflangTag = `<link rel="alternate" hreflang="en-gb" href="${canonicalUrl}" />`;
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  html = html.replace("</head>", `  ${canonicalTag}\n    ${hreflangTag}\n  </head>`);

  return html;
}
