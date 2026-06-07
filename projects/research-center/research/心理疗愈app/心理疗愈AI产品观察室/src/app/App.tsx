import { RouterProvider, useRouter } from './router';
import { Header, Footer } from './components/layout';
import { HomePage } from './components/pages/HomePage';
import { MapPage } from './components/pages/MapPage';
import { FocusPage } from './components/pages/FocusPage';
import { ProductPage } from './components/pages/ProductPage';
import { ArticlesPage } from './components/pages/ArticlesPage';
import { ArticlePage } from './components/pages/ArticlePage';
import { MethodPage } from './components/pages/MethodPage';
import { AboutPage } from './components/pages/AboutPage';
import { DisclaimerPage } from './components/pages/DisclaimerPage';

function Routes() {
  const { route } = useRouter();
  switch (route.name) {
    case 'home': return <HomePage />;
    case 'map': return <MapPage />;
    case 'focus': return <FocusPage />;
    case 'product': return <ProductPage slug={route.slug} />;
    case 'articles': return <ArticlesPage />;
    case 'article': return <ArticlePage slug={route.slug} />;
    case 'method': return <MethodPage />;
    case 'about': return <AboutPage />;
    case 'disclaimer': return <DisclaimerPage />;
    default: return <HomePage />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <Header />
        <div className="flex-1">
          <Routes />
        </div>
        <Footer />
      </div>
    </RouterProvider>
  );
}
