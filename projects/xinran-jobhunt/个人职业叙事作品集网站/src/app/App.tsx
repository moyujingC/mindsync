import { HashRouter, Routes, Route } from "react-router";
import Home from "./Home";
import MandalaApp from "./pages/MandalaApp";
import Monorepo from "./pages/Monorepo";
import HealingKB from "./pages/HealingKB";
import HealingAIResearch from "./pages/HealingAIResearch";
import GameCareer from "./pages/GameCareer";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/works/mandala-app" element={<MandalaApp />} />
        <Route path="/works/delivery-system" element={<Monorepo />} />
        <Route path="/works/healing-kb" element={<HealingKB />} />
        <Route path="/works/healing-ai-research" element={<HealingAIResearch />} />
        <Route path="/works/game-career" element={<GameCareer />} />
      </Routes>
    </HashRouter>
  );
}
