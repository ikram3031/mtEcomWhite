import * as React from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
<<<<<<< HEAD:dashboard/src/components/providers.jsx
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';
import { handleGlobalError } from '@/lib/error-handler';
=======
import { Toaster } from '@/components/core/ui/sonner';
import { AuthProvider } from '@/lib/core/auth-context';
import { ThemeProvider } from '@/components/core/theme-provider';
import { handleGlobalError } from '@/lib/core/error-handler';
>>>>>>> Decantre:dashboard/src/components/core/providers.jsx

export const ReactQueryProvider = ({ children }) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            handleGlobalError(error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            handleGlobalError(error);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      event.preventDefault();
      handleGlobalError(event.reason);
    };

    const handleWindowError = (event) => {
      event.preventDefault();
      handleGlobalError(event.error || event.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

