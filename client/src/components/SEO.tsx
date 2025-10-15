import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  structuredData?: object;
}

export default function SEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = "https://tyrevancity.com/og-image.jpg",
  noindex = false,
  structuredData
}: SEOProps) {
  const fullTitle = `${title} | Tyre Van City`;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tyrevancity.com';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : siteUrl;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : currentUrl;

  useEffect(() => {
    document.title = fullTitle;

    const metaTags = [
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: ogImage },
      { property: 'og:site_name', content: 'Tyre Van City' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage }
    ];

    if (noindex) {
      metaTags.push({ name: 'robots', content: 'noindex, nofollow' });
    }

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let meta = document.querySelector(selector);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    });

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, description, canonicalUrl, ogType, ogImage, noindex, structuredData]);

  return null;
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "name": "Tyre Van City",
  "description": "Premium mobile tyre van conversions and equipment specialists in the UK",
  "url": "https://tyrevancity.com",
  "logo": "https://tyrevancity.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+44-XXXX-XXXXXX",
    "contactType": "Sales",
    "areaServed": "GB",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "GB"
  },
  "sameAs": []
};

export function createProductStructuredData(van: {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${van.year} ${van.make} ${van.model} - Mobile Tyre Van Conversion`,
    "description": van.description || `Professional mobile tyre van conversion based on ${van.year} ${van.make} ${van.model}`,
    "image": van.image || "https://tyrevancity.com/default-van.jpg",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": van.price / 100,
      "availability": "https://schema.org/InStock",
      "url": `https://tyrevancity.com/stock/${van.id}`
    },
    "brand": {
      "@type": "Brand",
      "name": van.make
    }
  };
}

export function createBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://tyrevancity.com${item.url}`
    }))
  };
}
