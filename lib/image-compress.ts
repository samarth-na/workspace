export type CompressImageOptions = {
  maxDimension?: number;
  maxSizeBytes?: number;
};

const DEFAULT_MAX_DIMENSION = 256;
const DEFAULT_MAX_SIZE_BYTES = 512 * 1024;

export function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  if (file.type === "image/gif") {
    return Promise.resolve(file);
  }
  if (file.size <= maxSizeBytes) {
    return decodeDimensions(file).then(({ width, height }) => {
      if (width <= maxDimension && height <= maxDimension) return file;
      return downscale(file, width, height, maxDimension);
    });
  }
  return decodeDimensions(file).then(({ width, height }) =>
    downscale(file, width, height, maxDimension),
  );
}

function decodeDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image"));
    };
    image.src = url;
  });
}

function downscale(
  file: File,
  width: number,
  height: number,
  maxDimension: number,
): Promise<File> {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not compress the image"));
        return;
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      const base = file.name.replace(/\.[^.]+$/, "");
      const encode = (type: string, quality?: number) =>
        new Promise<Blob | null>((resolveBlob) => {
          canvas.toBlob(resolveBlob, type, quality);
        });
      void encode("image/webp", 0.85)
        .then(async (webpBlob) => {
          const blob = webpBlob ?? (await encode("image/png"));
          if (!blob) {
            reject(new Error("Could not compress the image"));
            return;
          }
          const type = webpBlob ? "image/webp" : "image/png";
          const ext = webpBlob ? "webp" : "png";
          resolve(
            new File([blob], `${base}.${ext}`, {
              type,
              lastModified: Date.now(),
            }),
          );
        })
        .catch(() => {
          reject(new Error("Could not compress the image"));
        });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image"));
    };
    image.src = url;
  });
}
