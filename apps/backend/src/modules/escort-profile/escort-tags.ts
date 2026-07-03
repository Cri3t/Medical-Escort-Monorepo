export const MAX_ESCORT_TAGS = 10;
export const MAX_ESCORT_TAG_LENGTH = 20;

export function normalizeEscortTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const normalizedTags: string[] = [];
  const seenTags = new Set<string>();

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      continue;
    }

    const normalizedTag = tag.trim();

    if (!normalizedTag || seenTags.has(normalizedTag)) {
      continue;
    }

    seenTags.add(normalizedTag);
    normalizedTags.push(normalizedTag);
  }

  return normalizedTags;
}
