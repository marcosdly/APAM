import { FC } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Home from '../pages/Home/Home.tsx';
import * as Admin from '../pages/Admin';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/admin',
    element: <Admin.AnimalRecord />,
  },
]);

const Routes: FC = () => <RouterProvider router={router} />;

export default Routes;
