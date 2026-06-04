const {
  resolveRuntimeConfig,
  isRuntimeConfigReady,
} = require("../../utils/config");
const { ensureMiniappSession } = require("../../utils/session");
const { buildRuntimeUrl } = require("../../utils/runtime-url");

function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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
      !this.data.booting &&
      this.runtimeConfig &&
      this.linkedSession &&
      this.lastRuntimeOptions
    ) {
      console.info(
        "[aimandala-miniapp-native] page onShow -> refresh runtime",
        {
          route: this.lastRuntimeOptions.route,
          interpretationId: this.lastRuntimeOptions.interpretationId,
          autoRecover: this.lastRuntimeOptions.autoRecover,
        },
      );
      this.reloadRuntime(this.lastRuntimeOptions);
    }
  },

  async bootstrapRuntime(query) {
    const config = resolveRuntimeConfig(query);
    if (!isRuntimeConfigReady(config)) {
      this.setData({
        booting: false,
        errorMessage: "请在微信开发者工具启动参数里提供 runtimeBaseUrl。",
      });
      return;
    }

    try {
      const session = await ensureMiniappSession(config, query);
      this.runtimeConfig = config;
      this.linkedSession = session;
      console.info("[aimandala-miniapp-native] session ready", {
        runtimeBaseUrl: config.runtimeBaseUrl,
        canonicalUserId: session.canonicalUserId,
        openId: session.openId,
      });
      this.reloadRuntime({
        route: normalizeValue(query.miniappRoute) || "upload",
        interpretationId: normalizeValue(query.interpretationId) || null,
        reportVariant: normalizeValue(query.reportVariant) || "lite",
        autoRecover: normalizeValue(query.miniappAutoRecover) === "1",
      });
    } catch (error) {
      this.setData({
        booting: false,
        errorMessage:
          error instanceof Error ? error.message : "无法恢复微信会话",
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
    };
    const runtimeSrc = buildRuntimeUrl({
      config: this.runtimeConfig,
      session: this.linkedSession,
      route: options.route,
      interpretationId: options.interpretationId,
      reportVariant: options.reportVariant,
      autoRecover: options.autoRecover,
    });
    console.info(
      "[aimandala-miniapp-native] runtime reload",
      this.lastRuntimeOptions,
    );

    this.setData({
      booting: false,
      errorMessage: "",
      runtimeSrc,
    });
  },

  async handleRuntimeMessage(event) {
    console.info("[aimandala-miniapp-native] runtime message ignored", {
      data: event && event.detail ? event.detail.data : null,
    });
  },
});
