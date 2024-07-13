export const staticUrl = {
  admin: '/admin',
  animalRecord: '/admin/animal/list',
  transparencyRecord: '/admin/transparency/list',
  campainRecord: '/admin/campain/list',
} as const;

export const dynamicUrl = {
  animalOverview: '/admin/animal/:_id?',
  campainOverview: '/admin/campain/:_id?',
  transparencyOverview: '/admin/transparency/:year?',
} as const;

export const wildcardUrl = {
  admin: '/admin/*',
  animal: '/admin/animal/*',
  campain: '/admin/campain/*',
  transparency: '/admin/transparency/*',
} as const;
