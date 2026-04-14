import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchJsonMock } = vi.hoisted(() => ({
  fetchJsonMock: vi.fn(),
}));

vi.mock("./httpClient", () => ({
  fetchJson: fetchJsonMock,
}));

vi.mock("./config", () => ({
  getAimandalaApiBaseUrl: () => "http://localhost:8000",
}));

import {
  createMiniappOrder,
  exchangeMiniappSession,
  getMiniappOrder,
  notifyMiniappWechatPayment,
  reconcileMiniappOrder,
} from "./services";

describe("shared/api services miniapp contracts", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    fetchJsonMock.mockResolvedValue({});
  });

  it("exchangeMiniappSession 使用固定路径和 JSON body", async () => {
    await exchangeMiniappSession({
      code: "demo-code",
      debug_canonical_user_id: "user-1",
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v2/miniapp/session/exchange",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "demo-code",
          debug_canonical_user_id: "user-1",
        }),
      }),
    );
  });

  it("createMiniappOrder 使用 orders create contract", async () => {
    await createMiniappOrder({
      interpretation_id: "ipt-1",
      product_type: "pro",
      channel: "miniapp",
      open_id: "openid-1",
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v2/miniapp/orders",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interpretation_id: "ipt-1",
          product_type: "pro",
          channel: "miniapp",
          open_id: "openid-1",
        }),
      }),
    );
  });

  it("getMiniappOrder 使用 order detail contract", async () => {
    await getMiniappOrder("order/1");

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v2/miniapp/orders/order%2F1",
    );
  });

  it("reconcileMiniappOrder 使用 order reconcile contract", async () => {
    await reconcileMiniappOrder("order-2");

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v2/miniapp/orders/order-2/reconcile",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("notifyMiniappWechatPayment 使用 wechat notify contract", async () => {
    await notifyMiniappWechatPayment({
      order_id: "order-3",
      event: "paid",
      payment_reference: "wx-demo",
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v2/miniapp/payments/wechat/notify",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: "order-3",
          event: "paid",
          payment_reference: "wx-demo",
        }),
      }),
    );
  });
});
