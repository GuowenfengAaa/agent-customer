const COS_IMAGE_HOST_SUFFIX = '.cos.ap-guangzhou.myqcloud.com';
const AVATAR_THUMBNAIL_OPERATION = 'imageMogr2/thumbnail/160x160/format/webp/quality/85';

export const getAvatarThumbnailUrl = (source?: string | null): string => {
  if (!source || source.startsWith('data:') || source.startsWith('blob:')) {
    return source || '';
  }

  try {
    const url = new URL(source);
    const isTencentCos =
      url.hostname === 'cos.ap-guangzhou.myqcloud.com' ||
      url.hostname.endsWith(COS_IMAGE_HOST_SUFFIX);

    if (!isTencentCos || url.search.includes('imageMogr2/')) return source;
    return `${source}${url.search ? '&' : '?'}${AVATAR_THUMBNAIL_OPERATION}`;
  } catch {
    return source;
  }
};
