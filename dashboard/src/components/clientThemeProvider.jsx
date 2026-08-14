import React, { useEffect } from 'react';
import { clientConfig } from '@/clientConfig';

export const ClientThemeProvider = ({ children }) => {
  useEffect(() => {
    const applyTheme = () => {
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
