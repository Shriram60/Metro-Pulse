import { useEffect, useState } from 'react';

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [page, query = ''] = raw.split('?');
  return { key: raw, page: page || 'home', params: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const update = () => setRoute(parseHash());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  return route;
}

export function href(page, params) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  return `#/${page}${query}`;
}
