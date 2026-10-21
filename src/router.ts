import { useEffect, useState } from 'preact/hooks';

export function useHashRoute(): string[] {
  const parse = () => (location.hash.replace(/^#\/?/, '') || 'today').split('/');
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(path: string) {
  location.hash = '#/' + path;
}
