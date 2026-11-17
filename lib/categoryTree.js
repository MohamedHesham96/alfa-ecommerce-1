/**
 * Shared helpers for the optional category hierarchy.
 *
 * The backend returns flat categories while ENABLE_CATEGORIES_TREE is disabled
 * and nested roots while it is enabled. These helpers work for both shapes, so
 * components never need to hardcode the feature flag or make extra requests.
 */

export function flattenCategoryTree(categories = [], depth = 0, parent = null, output = []) {
  if (!Array.isArray(categories)) return output;
  for (const category of categories) {
    if (!category) continue;
    output.push({ category, depth, parent });
    const children = Array.isArray(category.children) ? category.children : [];
    if (children.length > 0) {
      flattenCategoryTree(children, depth + 1, category, output);
    }
  }
  return output;
}

export function findCategoryEntry(categories, predicate) {
  if (typeof predicate !== "function") return null;
  return flattenCategoryTree(categories).find(({ category }) => predicate(category)) || null;
}

export function findCategorySummary(categories, categoryId) {
  if (categoryId === null || categoryId === undefined) return null;
  const entry = findCategoryEntry(
    categories,
    (category) => category.itemCategoryId === categoryId,
  );
  return entry ? entry.category : null;
}

/**
 * Returns the root-to-category path for breadcrumbs. A flat list produces a
 * single-element path, which preserves the existing disabled behavior.
 */
export function findCategoryPath(categories, categoryId) {
  if (categoryId === null || categoryId === undefined) return [];
  for (const category of Array.isArray(categories) ? categories : []) {
    if (!category) continue;
    if (category.itemCategoryId === categoryId) return [category];
    const childPath = findCategoryPath(category.children, categoryId);
    if (childPath.length > 0) return [category, ...childPath];
  }
  return [];
}

export function collectDescendantIds(category) {
  const ids = [];
  const children = Array.isArray(category?.children) ? category.children : [];
  for (const child of children) {
    if (!child) continue;
    if (child.itemCategoryId !== null && child.itemCategoryId !== undefined) {
      ids.push(child.itemCategoryId);
    }
    ids.push(...collectDescendantIds(child));
  }
  return ids;
}

export function hasNestedCategories(categories) {
  if (!Array.isArray(categories)) return false;
  return categories.some(
    (category) =>
      Array.isArray(category?.children) && category.children.length > 0,
  );
}
