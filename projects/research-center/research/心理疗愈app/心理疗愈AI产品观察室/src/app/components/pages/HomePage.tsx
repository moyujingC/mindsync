import {
  AboutSubscribeSection,
  ArticlesPreviewSection,
  FeaturedProductsSection,
  FocusRoutesSection,
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
      <FocusRoutesSection />
      <ArticlesPreviewSection />
      <AboutSubscribeSection />
    </main>
  );
}
