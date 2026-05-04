function normalizePaymentResult(error) {
  const errMsg = String((error && error.errMsg) || "").toLowerCase();
  if (errMsg.includes("cancel")) {
    return "cancelled";
  }
  if (errMsg.includes("fail")) {
    return "failed";
  }
  return "failed";
}

function requestWechatPayment(requestPaymentArgs) {
  return new Promise((resolve) => {
    wx.requestPayment({
      ...requestPaymentArgs,
      success() {
        resolve({
          status: "success",
        });
      },
      fail(error) {
        resolve({
          status: normalizePaymentResult(error),
          detail: error && error.errMsg ? error.errMsg : "",
        });
      },
    });
  });
}

module.exports = {
  requestWechatPayment,
};
