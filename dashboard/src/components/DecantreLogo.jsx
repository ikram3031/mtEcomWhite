import React, { useState } from 'react';
import { clientConfig } from '@/clientConfig';
import { apiClient } from '@/lib/api-client';

// Renders the branding logo dynamically from dynamic URL, client config, or fallback text
export const DecantreLogo = ({
  src,
  className = 'h-10 w-auto',
  alt = 'Brand logo',
  iconOnly = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const { clientKey = 'decantre', brandName = 'Decantre', logoUrl } = clientConfig || {};

  // Resolve target logo URL (Prop > Client Config > Env Var > Default asset path)
  const rawUrl = src || logoUrl || import.meta.env?.VITE_LOGO_URL || `/src/uploads/assets/logo.webp`;

  // Helper to resolve full URL
  const resolveLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const base = apiClient?.defaults?.baseURL || '';
    if (url.startsWith('/') && base.endsWith('/')) {
      return `${base.slice(0, -1)}${url}`;
    }
    if (!url.startsWith('/') && !base.endsWith('/')) {
      return `${base}/${url}`;
    }
    return `${base}${url}`;
  };

  const finalUrl = resolveLogoUrl(rawUrl);

  // If URL is available and hasn't errored out, render dynamic <img>
  if (finalUrl && !imageError) {
    return (
      <div className={`relative overflow-hidden flex items-center shrink-0 ${className}`}>
        <img
          src={finalUrl}
          alt={alt || brandName}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback badge for collapsed icon view
  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center font-bold text-primary shrink-0 ${className}`}>
        <span className="bg-primary/20 px-2 py-0.5 rounded border border-primary/30 uppercase text-xs font-black">
          {clientKey ? clientKey.slice(0, 2) : 'DC'}
        </span>
      </div>
    );
  }

  // Fallback stylized text logo
  return (
    <div className={`flex items-center gap-2 font-bold tracking-wider text-xl text-primary shrink-0 ${className}`}>
      <span className="bg-primary/20 px-2 py-0.5 rounded border border-primary/30 uppercase text-xs font-black">
        {clientKey ? clientKey.slice(0, 2) : 'DC'}
      </span>
      <span className="truncate">{brandName}</span>
    </div>
  );
};

export default DecantreLogo;
