import React from 'react';
import logoImage from '@/assets/decantre_logo.png';
import { clientConfig } from '@/clientConfig';

// Renders the branding logo dynamically based on active client configuration
export const DecantreLogo = ({
  className = 'h-10 w-auto',
  alt = 'Brand logo',
  iconOnly = false,
}) => {
  const { clientKey, brandName } = clientConfig;

  // Use the Decantre image logo for Decantre client
  if (clientKey === 'decantre') {
    return (
      <div className={`relative overflow-hidden flex items-center ${className}`}>
        <img
          src={logoImage}
          alt={alt || brandName}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Render a clean, stylized badge icon for other clients
  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center font-bold text-primary ${className}`}>
        <span className="bg-primary/20 px-2 py-0.5 rounded border border-primary/30 uppercase text-xs font-black">
          {clientKey.slice(0, 2)}
        </span>
      </div>
    );
  }

  // Render a clean, stylized text logo for other clients
  return (
    <div className={`flex items-center gap-2 font-bold tracking-wider text-xl text-primary ${className}`}>
      <span className="bg-primary/20 px-2 py-0.5 rounded border border-primary/30 uppercase text-xs font-black">
        {clientKey.slice(0, 2)}
      </span>
      <span className="truncate">{brandName}</span>
    </div>
  );
};

export default DecantreLogo;
