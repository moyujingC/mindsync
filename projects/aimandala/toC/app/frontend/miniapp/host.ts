import type { WechatPayRequestPaymentArgs } from "../shared/types";

export interface MiniappHostLoginResult {
  code: string;
}

export interface MiniappHostAdapter {
  kind: "wechat" | "stub";
  login(): Promise<MiniappHostLoginResult>;
  requestPayment(args: WechatPayRequestPaymentArgs): Promise<void>;
}

interface WechatMiniProgramApi {
  login(options: {
    success?: (result: { code?: string }) => void;
    fail?: (error: unknown) => void;
  }): void;
  requestPayment(
    options: WechatPayRequestPaymentArgs & {
      success?: () => void;
      fail?: (error: unknown) => void;
    },
  ): void;
}

declare global {
  interface Window {
    wx?: WechatMiniProgramApi;
    __AIMANDALA_MINIAPP_HOST__?: Partial<MiniappHostAdapter>;
  }
}

function createStubHostAdapter(): MiniappHostAdapter {
  return {
    kind: "stub",
    async login() {
      return {
        code: "miniapp-dev-code",
      };
    },
    async requestPayment() {
      return;
    },
  };
}

export function resolveMiniappHostAdapter(): MiniappHostAdapter {
  if (typeof window === "undefined") {
    return createStubHostAdapter();
  }

  const injected = window.__AIMANDALA_MINIAPP_HOST__;
  if (injected?.login && injected?.requestPayment) {
    return {
      kind: injected.kind === "wechat" ? "wechat" : "stub",
      login: () => injected.login!(),
      requestPayment: (args) => injected.requestPayment!(args),
    };
  }

  const wx = window.wx;
  if (!wx?.login || !wx?.requestPayment) {
    return createStubHostAdapter();
  }

  return {
    kind: "wechat",
    login() {
      return new Promise<MiniappHostLoginResult>((resolve, reject) => {
        wx.login({
          success(result) {
            const code = result.code?.trim();
            if (!code) {
              reject(new Error("微信登录未返回 code"));
              return;
            }
            resolve({ code });
          },
          fail(error) {
            reject(error instanceof Error ? error : new Error("微信登录失败"));
          },
        });
      });
    },
    requestPayment(args) {
      return new Promise<void>((resolve, reject) => {
        wx.requestPayment({
          ...args,
          success() {
            resolve();
          },
          fail(error) {
            reject(error instanceof Error ? error : new Error("微信支付拉起失败"));
          },
        });
      });
    },
  };
}
