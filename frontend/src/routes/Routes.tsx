import { FC } from 'react';
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from 'react-router-dom';

import Home from '../pages/Home/Home.tsx';
import * as Admin from '../pages/Admin';

const urls = {
  animalRecord: '/admin/animal/list',
} as const;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/admin/*',
    loader: () => redirect(urls.animalRecord),
  },
  {
    path: '/admin/animal/:_id?',
    element: <Admin.AnimalOverview />,
    loader: ({ params }): Response => {
      const _id = parseFloat(params._id!);

      if (!Number.isNaN(_id) && _id >= 0 && _id % 1 === 0)
        return new Response(null, { status: 200 });

      return redirect(urls.animalRecord);
    },
  },
  {
    path: urls.animalRecord,
    element: <Admin.AnimalRecord />,
  },
]);

const Routes: FC = () => <RouterProvider router={router} />;

export default Routes;
