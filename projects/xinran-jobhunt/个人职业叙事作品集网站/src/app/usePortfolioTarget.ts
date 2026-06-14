import { useSearchParams } from "react-router";
import {
  defaultPortfolioTarget,
  getPortfolioTargetProfile,
  resolvePortfolioTarget,
  type PortfolioTarget,
} from "./content/portfolioTargets";

const targetParam = "target";

export function usePortfolioTarget() {
  const [searchParams, setSearchParams] = useSearchParams();
  const target = resolvePortfolioTarget(searchParams.get(targetParam));
  const profile = getPortfolioTargetProfile(target);
  const search = searchParams.toString();

  const setTarget = (nextTarget: PortfolioTarget) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextTarget === defaultPortfolioTarget) {
      nextSearchParams.delete(targetParam);
    } else {
      nextSearchParams.set(targetParam, nextTarget);
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  return {
    target,
    profile,
    search: search ? `?${search}` : "",
    setTarget,
  };
}
