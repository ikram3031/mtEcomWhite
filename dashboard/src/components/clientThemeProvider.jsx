import React, { useEffect } from 'react';
import { clientConfig } from '@/clientConfig';

export const ClientThemeProvider = ({ children }) => {
  useEffect(() => {
    const applyTheme = () => {
      // 1. Dynamic Page Title
      if (typeof document !== 'undefined') {
        const brandName = clientConfig?.brandName || 'Decantre';
        document.title = `Dashboard - ${brandName}`;

        // 2. Dynamic Favicon
        const faviconUrl = clientConfig?.siteIconUrl || clientConfig?.logoUrl;
        if (faviconUrl) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        }
      }

      // 3. Dynamic Theme CSS variables
      const themeConfig = clientConfig.theme || {};
      
      let cssText = ':root {\n';
      if (themeConfig.light) {
        Object.entries(themeConfig.light).forEach(([property, value]) => {
          cssText += `  ${property}: ${value} !important;\n`;
        });
      }
      cssText += '}\n\n.dark {\n';
      if (themeConfig.dark) {
        Object.entries(themeConfig.dark).forEach(([property, value]) => {
          cssText += `  ${property}: ${value} !important;\n`;
        });
      }
      cssText += '}\n';

      let styleTag = document.getElementById('client-theme-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'client-theme-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = cssText;
    };

    applyTheme();
  }, []);

  return <>{children}</>;
};

export default ClientThemeProvider;
