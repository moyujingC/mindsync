import {
  AboutSubscribeSection,
  ArticlesPreviewSection,
  FeaturedProductsSection,
  HeroSection,
  MethodPreviewSection,
  TrackPreviewSection,
} from '../home/HomeSections';

export function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrackPreviewSection />
      <MethodPreviewSection />
      <FeaturedProductsSection />
      <ArticlesPreviewSection />
      <AboutSubscribeSection />
    </main>
  );
}
