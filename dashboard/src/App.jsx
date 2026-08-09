import { RouterProvider } from 'react-router-dom';
import { ReactQueryProvider } from '@/components/core/providers';
import { router } from './router';

const App = () => {
  return (
    <ReactQueryProvider>
      <RouterProvider router={router} />
    </ReactQueryProvider>
  );
};

export default App;
