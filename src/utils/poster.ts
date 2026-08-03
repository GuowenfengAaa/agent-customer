const COS_IMAGE_HOST_SUFFIX = ".cos.ap-guangzhou.myqcloud.com";
const POSTER_THUMBNAIL_OPERATION =
  "imageMogr2/thumbnail/300x420/format/webp/quality/80";

export const getPosterThumbnailUrl = (source?: string | null): string => {
  if (!source || source.startsWith("data:") || source.startsWith("blob:")) {
    return source || "";
  }

  try {
    const url = new URL(source);
    const isTencentCos =
      url.hostname === "cos.ap-guangzhou.myqcloud.com" ||
      url.hostname.endsWith(COS_IMAGE_HOST_SUFFIX);

    if (!isTencentCos || url.search.includes("imageMogr2/")) {
      return source;
    }

    return `${source}${url.search ? "&" : "?"}${POSTER_THUMBNAIL_OPERATION}`;
  } catch {
    return source;
  }
};
