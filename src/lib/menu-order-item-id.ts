/** Globally unique id across thalis: thaliId * 1e6 + categoryId * 1e3 + itemId */
export function encodeMenuOrderItemId(
  thaliId: number,
  categoryId: number,
  itemId: number
): number {
  return thaliId * 1_000_000 + categoryId * 1_000 + itemId;
}

export function decodeMenuOrderItemId(encoded: number): {
  thaliId: number;
  categoryId: number;
  itemId: number;
} {
  const thaliId = Math.floor(encoded / 1_000_000);
  const remainder = encoded % 1_000_000;
  const categoryId = Math.floor(remainder / 1_000);
  const itemId = remainder % 1_000;
  return { thaliId, categoryId, itemId };
}
