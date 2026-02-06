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
  ogImage = "https://northwestvanconversions.co.uk/og-image.jpg",
  noindex = false,
  structuredData
}: SEOProps) {
  const fullTitle = `${title} | Northwest Van Conversions`;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://northwestvanconversions.co.uk';
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
      { property: 'og:site_name', content: 'Northwest Van Conversions' },
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

    let script = document.querySelector('script[type="application/ld+json"]');
    
    if (structuredData) {
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    } else {
      if (script) {
        script.remove();
      }
    }
  }, [fullTitle, description, canonicalUrl, ogType, ogImage, noindex, structuredData]);

  return null;
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "name": "Northwest Van Conversions",
  "description": "Premium van conversions and equipment specialists in the Northwest UK",
  "url": "https://northwestvanconversions.co.uk",
  "logo": "https://northwestvanconversions.co.uk/logo.png",
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
    "name": `${van.year} ${van.make} ${van.model} - Northwest Van Conversion`,
    "description": van.description || `Professional van conversion based on ${van.year} ${van.make} ${van.model}`,
    "image": van.image || "https://northwestvanconversions.co.uk/default-van.jpg",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": van.price / 100,
      "availability": "https://schema.org/InStock",
      "url": `https://northwestvanconversions.co.uk/stock/${van.id}`
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
      "item": `https://northwestvanconversions.co.uk${item.url}`
    }))
  };
}
