import {
  bootstrapMobileWebFlow,
  refreshMobileWebReport,
  runMobileWebLiteFlow,
} from "../controller";
import { createMobileWebPageViewModel } from "../view-model";
import { getMobileWebPrimaryAction, toStartCreatePayload } from "../state";

async function example() {
  const bootstrap = await bootstrapMobileWebFlow("/tmp/example-mandala.png");
  console.log("bootstrap", bootstrap.state.step);

  const payload = toStartCreatePayload(
    {
      imagePath: "/tmp/example-mandala.png",
      theme: "wealth",
      paintingIntention: "我想看看自己最近的状态",
      paintingFeeling: "画的时候有点紧又有点平静",
      innerRadius: 0.35,
      middleRadius: 0.65,
    },
    "demo-user",
  );

  const result = await runMobileWebLiteFlow(payload);
  const primaryAction = getMobileWebPrimaryAction(result.state);
  const viewModel = createMobileWebPageViewModel(result.state, primaryAction);

  console.log("title", viewModel.title);
  console.log("subtitle", viewModel.subtitle);

  if (result.report?.interpretation_id) {
    const refreshed = await refreshMobileWebReport(
      result.report.interpretation_id,
      "lite",
      result.state,
    );
    console.log("refreshed step", refreshed.state.step);
  }
}

void example();
