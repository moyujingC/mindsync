import { createContext, useContext, useState, ReactNode } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'focus' }
  | { name: 'product'; slug: string }
  | { name: 'articles' }
  | { name: 'article'; slug: string }
  | { name: 'method' }
  | { name: 'about' }
  | { name: 'disclaimer' };

interface RouterCtx {
  route: Route;
  go: (r: Route) => void;
}

const Ctx = createContext<RouterCtx | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const go = (r: Route) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };
  return <Ctx.Provider value={{ route, go }}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const c = useContext(Ctx);
  if (!c) throw new Error('Router missing');
  return c;
}

export function Link({
  to,
  children,
  className,
  ...rest
}: {
  to: Route;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLAnchorElement>) {
  const { go } = useRouter();
  return (
    <a
      href="#"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
