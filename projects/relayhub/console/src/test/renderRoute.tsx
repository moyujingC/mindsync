import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { AppRoutes } from "../app/AppRoutes";

export function renderRoute(initialEntry: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppRoutes />
    </MemoryRouter>,
  );
}
