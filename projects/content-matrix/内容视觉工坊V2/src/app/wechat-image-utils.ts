export const WECHAT_IMAGE_MAX_WIDTH = 1080;

export async function ensureWechatImageMaxWidthBlob(blob: Blob) {
  if (!blob.type.startsWith("image/")) return blob;

  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return blob;

  if (bitmap.width <= WECHAT_IMAGE_MAX_WIDTH) {
    bitmap.close();
    return blob;
  }

  const nextWidth = WECHAT_IMAGE_MAX_WIDTH;
  const nextHeight = Math.round((bitmap.height * nextWidth) / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    return blob;
  }

  context.drawImage(bitmap, 0, 0, nextWidth, nextHeight);
  bitmap.close();

  return await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (resized) => resolve(resized || blob),
      blob.type === "image/png" ? "image/png" : "image/jpeg",
      0.92
    );
  });
}

export async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("读取图片失败"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
    reader.readAsDataURL(blob);
  });
}
