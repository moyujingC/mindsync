import { MemoryRouter, useLocation } from "react-router-dom";
import { render } from "@testing-library/react";
import { AppRoutes } from "../app/AppRoutes";

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="current-location">
      {location.pathname}
      {location.search}
    </div>
  );
}

export function renderRoute(initialEntry: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LocationProbe />
      <AppRoutes />
    </MemoryRouter>,
  );
}
