const { resolveRuntimeConfig, isRuntimeConfigReady } = require("../../utils/config");
const { ensureMiniappSession } = require("../../utils/session");
const { requestWechatPayment } = require("../../utils/payment");
const { buildRuntimeUrl } = require("../../utils/runtime-url");

function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function extractPostedMessages(rawData) {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.flatMap((item) => {
    if (Array.isArray(item)) {
      return item;
    }
    return [item];
  });
}

function resolvePaymentRequestMessage(rawData) {
  const messages = extractPostedMessages(rawData);
  return messages.find(
    (message) => message && message.type === "aimandala-miniapp-payment-request",
  ) || null;
}

Page({
  data: {
    booting: true,
    errorMessage: "",
    runtimeSrc: "",
  },

  onLoad(query) {
    this.bootstrapRuntime(query || {});
  },

  onShow() {
    if (
      !this.data.booting
      && this.runtimeConfig
      && this.linkedSession
      && this.lastRuntimeOptions
    ) {
      console.info("[aimandala-miniapp-native] page onShow -> refresh runtime", {
        route: this.lastRuntimeOptions.route,
        interpretationId: this.lastRuntimeOptions.interpretationId,
        autoRecover: this.lastRuntimeOptions.autoRecover,
        paymentResult: this.lastRuntimeOptions.paymentResult,
      });
      this.reloadRuntime(this.lastRuntimeOptions);
    }
  },

  async bootstrapRuntime(query) {
    const config = resolveRuntimeConfig(query);
    if (!isRuntimeConfigReady(config)) {
      this.setData({
        booting: false,
        errorMessage: "请在微信开发者工具启动参数里提供 apiBaseUrl 与 runtimeBaseUrl。",
      });
      return;
    }

    try {
      const session = await ensureMiniappSession(config, query);
      this.runtimeConfig = config;
      this.linkedSession = session;
      console.info("[aimandala-miniapp-native] session ready", {
        apiBaseUrl: config.apiBaseUrl,
        runtimeBaseUrl: config.runtimeBaseUrl,
        canonicalUserId: session.canonicalUserId,
        openId: session.openId,
      });
      this.reloadRuntime({
        route: normalizeValue(query.miniappRoute) || "upload",
        interpretationId: normalizeValue(query.interpretationId) || null,
        reportVariant: normalizeValue(query.reportVariant) || "lite",
        autoRecover: normalizeValue(query.miniappAutoRecover) === "1",
        paymentResult: normalizeValue(query.miniappPaymentResult) || null,
      });
    } catch (error) {
      this.setData({
        booting: false,
        errorMessage: error instanceof Error ? error.message : "无法恢复微信会话",
      });
    }
  },

  reloadRuntime(options) {
    if (!this.runtimeConfig || !this.linkedSession) {
      return;
    }
    this.lastRuntimeOptions = {
      route: options.route,
      interpretationId: options.interpretationId,
      reportVariant: options.reportVariant,
      autoRecover: Boolean(options.autoRecover),
      paymentResult: options.paymentResult || null,
    };
    const runtimeSrc = buildRuntimeUrl({
      config: this.runtimeConfig,
      session: this.linkedSession,
      route: options.route,
      interpretationId: options.interpretationId,
      reportVariant: options.reportVariant,
      autoRecover: options.autoRecover,
      paymentResult: options.paymentResult,
    });
    console.info("[aimandala-miniapp-native] runtime reload", this.lastRuntimeOptions);

    this.setData({
      booting: false,
      errorMessage: "",
      runtimeSrc,
    });
  },

  async handleRuntimeMessage(event) {
    const paymentRequest = resolvePaymentRequestMessage(
      event && event.detail ? event.detail.data : [],
    );
    if (!paymentRequest || !paymentRequest.payload) {
      return;
    }

    const hostPayload = paymentRequest.payload.hostPayload;
    if (!hostPayload || hostPayload.mode !== "wechatpay" || !hostPayload.request_payment_args) {
      console.warn("[aimandala-miniapp-native] invalid payment payload", paymentRequest);
      this.setData({
        errorMessage: "当前原生壳收到的支付消息不完整，无法拉起微信支付。",
      });
      return;
    }

    console.info("[aimandala-miniapp-native] begin wx.requestPayment", {
      orderId: hostPayload.order_id,
      interpretationId: paymentRequest.payload.interpretationId,
    });
    const result = await requestWechatPayment(hostPayload.request_payment_args);
    console.info("[aimandala-miniapp-native] wx.requestPayment finished", {
      orderId: hostPayload.order_id,
      status: result.status,
    });
    this.reloadRuntime({
      route: paymentRequest.payload.routeHint || "reportEntry",
      interpretationId: paymentRequest.payload.interpretationId,
      reportVariant: paymentRequest.payload.reportVariant || "lite",
      autoRecover: result.status === "success",
      paymentResult: result.status,
    });
  },
});
