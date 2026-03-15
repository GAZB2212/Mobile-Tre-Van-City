import type { Request } from "express";

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
    title: `Mobile Tyre Van Conversions UK | Custom-Built & Ready to Earn | ${SITE_NAME}`,
    description: "UK's leading mobile tyre van conversion specialists. Custom-built mobile tyre vans, fully equipped with professional tyre fitting equipment. Nationwide delivery. Finance available. Call 0151 203 8500.",
    canonical: "/",
  },
  "/stock": {
    title: `Mobile Tyre Vans For Sale | Buy Ready-to-Go Conversions UK | ${SITE_NAME}`,
    description: "Browse our stock of mobile tyre vans for sale. Professionally converted, fully equipped, and available with nationwide UK delivery. View prices, specs, and finance options. Call 0151 203 8500.",
    canonical: "/stock",
  },
  "/configurator": {
    title: `Van Configurator | Build Your Mobile Tyre Van | ${SITE_NAME}`,
    description: "Use our online configurator to design your perfect mobile tyre van. Choose your van, equipment kit, upgrades, and get an instant quote. UK-wide delivery.",
    canonical: "/configurator",
  },
  "/finance": {
    title: `Mobile Tyre Van Finance | Flexible Payment Plans UK | ${SITE_NAME}`,
    description: "Finance your mobile tyre van with our flexible, competitive payment plans. Use our free finance calculator to see monthly payments. FCA authorised credit broker. Apply online or call 0151 203 8500.",
    canonical: "/finance",
  },
  "/training": {
    title: `Mobile Tyre Fitting Training | REACT & Tyre Certification UK | ${SITE_NAME}`,
    description: "Get fully certified to operate your mobile tyre business. We offer professional tyre fitting courses and REACT motorway certification. Start legally and safely. Based in Wirral, training UK-wide.",
    canonical: "/training",
  },
  "/gallery": {
    title: `Gallery | Mobile Tyre Van Conversions | ${SITE_NAME}`,
    description: "View our gallery of completed mobile tyre van conversions. See the quality of our work and get inspired for your own build.",
    canonical: "/gallery",
  },
  "/about": {
    title: `About ${SITE_NAME} | UK Van Conversion Specialists | ${SITE_NAME}`,
    description: "Meet the team behind Mobile Tyre Van City — the UK's leading specialists in mobile tyre van conversions. Based in Wirral, we build fully-equipped tyre vans with nationwide delivery.",
    canonical: "/about",
  },
  "/contact": {
    title: `Contact ${SITE_NAME} | 0151 203 8500 | Wirral, UK | ${SITE_NAME}`,
    description: "Contact Mobile Tyre Van City for a quote on your mobile tyre van conversion. Call us on 0151 203 8500 or visit our workshop at 5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL.",
    canonical: "/contact",
  },
  "/how-it-works": {
    title: `How It Works | Mobile Tyre Van Build Process Explained | ${SITE_NAME}`,
    description: "See how we build your mobile tyre van in 4 simple steps: choose your van, select your equipment kit, add custom upgrades, arrange finance. UK-built, in-house team, nationwide delivery.",
    canonical: "/how-it-works",
  },
  "/business-opportunity": {
    title: `The Mobile Tyre Business Opportunity | ${SITE_NAME}`,
    description: "Discover why the mobile tyre fitting sector is one of the UK's fastest growing small business opportunities. Clients earning up to £1,200 per day. Business in a box — van, tech, supplier and website included.",
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

  return null;
}

export function buildVanMeta(van: { year: number; make: string; model: string; mileage: number; slug: string; specs: { transmission?: string; fuel?: string } }): PageMeta {
  const vanTitle = `${van.year} ${van.make} ${van.model}`;
  return {
    title: `${vanTitle} - Mobile Tyre Van | ${SITE_NAME}`,
    description: `For sale: ${vanTitle}. A fully equipped mobile tyre van conversion${van.mileage ? ` with ${van.mileage.toLocaleString()} miles` : ''}. ${van.specs?.transmission || ''}, ${van.specs?.fuel || ''}. Finance available. Enquire now!`,
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
