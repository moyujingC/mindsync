import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubEnv("RELAYHUB_CONTROL_PLANE_RUNTIME", "mock");
vi.stubEnv("RELAYHUB_DEV_RELAY_BASE_URL", "/claude");
