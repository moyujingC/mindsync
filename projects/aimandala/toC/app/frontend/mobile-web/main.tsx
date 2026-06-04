import { renderUploadEntry } from "./entry";
import { renderMobileWebRoute } from "./host";

/**
 * Minimal mobile-web runtime entry placeholder.
 *
 * This file intentionally does not mount to a concrete framework runtime yet.
 * It exists so the frontend workspace has a stable handoff point once we pick
 * a host shell such as Vite or Next.
 */
export async function bootMobileWebExample() {
  return renderUploadEntry("/tmp/example-mandala.png");
}

export async function bootMobileWebRouteExample() {
  return renderMobileWebRoute({
    route: "upload",
    params: {
      draft: {
        imagePath: "/tmp/example-mandala.png",
        theme: "wealth",
        paintingIntention: "",
        paintingFeeling: "",
      },
    },
  });
}
