import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Story } from "./components/Story";
import { Works } from "./components/Works";
import { Abilities } from "./components/Abilities";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-[#F9F7F3] text-[#2C3E50]"
      style={{ fontFamily: "'Noto Sans SC', sans-serif", scrollBehavior: "smooth" }}
    >
      <Nav />
      <main>
        <Hero />
        <Story />
        <Works />
        <Abilities />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
