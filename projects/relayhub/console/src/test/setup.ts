import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
