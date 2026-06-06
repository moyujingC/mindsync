import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Story } from "./components/Story";
import { Works } from "./components/Works";
import { RoleTracks } from "./components/RoleTracks";
import { Abilities } from "./components/Abilities";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { usePortfolioTarget } from "./usePortfolioTarget";

export default function Home() {
  const { target, profile, setTarget } = usePortfolioTarget();

  return (
    <div
      className="min-h-screen bg-[#F9F7F3] text-[#2C3E50]"
      style={{ fontFamily: "'Noto Sans SC', sans-serif", scrollBehavior: "smooth" }}
    >
      <Nav />
      <main>
        <Hero target={target} profile={profile} onTargetChange={setTarget} />
        <Story />
        <RoleTracks target={target} />
        <Works target={target} />
        <Abilities />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
