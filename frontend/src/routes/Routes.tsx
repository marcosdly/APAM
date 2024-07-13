import { FC } from 'react';
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from 'react-router-dom';

import Home from '../pages/Home/Home.tsx';
import * as Admin from '../pages/Admin';
import {
  dynamicUrl,
  staticUrl,
  wildcardUrl,
} from '@/services/api/reactRoutes.ts';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    // Emulate fresh login (there's no auth yet)
    path: staticUrl.admin,
    loader: ({ request }) => {
      const url = new URL(request.url);
      url.pathname = staticUrl.animalRecord;
      url.search = '';
      url.searchParams.append('welcome', 'true');
      return redirect(url.toString());
    },
  },
  {
    path: wildcardUrl.admin,
    loader: () => redirect(staticUrl.animalRecord),
  },
  {
    path: dynamicUrl.animalOverview,
    element: <Admin.AnimalOverview />,
    loader: ({ params }): Response => {
      const _id = parseFloat(params._id!);

      if (!Number.isNaN(_id) && _id >= 0 && _id % 1 === 0)
        return new Response(null, { status: 200 });

      return redirect(staticUrl.animalRecord);
    },
  },
  {
    path: dynamicUrl.campainOverview,
    element: <Admin.CampainOverview />,
    loader: ({ params }) => {
      const _id = parseFloat(params._id!);

      if (!Number.isNaN(_id) && _id >= 0 && _id % 1 === 0)
        return new Response(null, { status: 200 });

      return redirect(staticUrl.campainRecord);
    },
  },
  {
    path: dynamicUrl.transparencyOverview,
    element: <Admin.TransparencyOverview />,
    loader: ({ params }) => {
      const year = parseFloat(params.year!);

      if (!Number.isNaN(year) && year >= 0 && year % 1 === 0)
        return new Response(null, { status: 200 });

      return redirect(staticUrl.transparencyRecord);
    },
  },
  {
    path: wildcardUrl.campain,
    loader: () => redirect(staticUrl.campainRecord),
  },
  {
    path: staticUrl.animalRecord,
    element: <Admin.AnimalRecord />,
  },
  {
    path: staticUrl.transparencyRecord,
    element: <Admin.TransparencyRecord />,
  },
  {
    path: staticUrl.campainRecord,
    element: <Admin.CampainRecord />,
  },
]);

const Routes: FC = () => <RouterProvider router={router} />;

export default Routes;
