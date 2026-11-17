import {
  collectDescendantIds,
  findCategoryPath,
  findCategorySummary,
  flattenCategoryTree,
  hasNestedCategories,
} from "../lib/categoryTree";

const grandchild = {
  itemCategoryId: 3,
  nameEn: "Grandchild",
  nameAr: "قسم فرعي",
  seoCode: "grandchild",
  children: [],
};

const child = {
  itemCategoryId: 2,
  nameEn: "Child",
  nameAr: "قسم فرعي",
  seoCode: "child",
  children: [grandchild],
};

const root = {
  itemCategoryId: 1,
  nameEn: "Root",
  nameAr: "قسم رئيسي",
  seoCode: "root",
  children: [child],
};

const secondRoot = {
  itemCategoryId: 4,
  nameEn: "Second",
  nameAr: "قسم ثانٍ",
  seoCode: "second",
  children: [],
};

describe("category tree helpers", () => {
  it("flattens every nesting level without mutating the input", () => {
    const flat = flattenCategoryTree([root, secondRoot]);

    expect(flat.map((entry) => entry.category.itemCategoryId)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(flat.map((entry) => entry.depth)).toEqual([0, 1, 2, 0]);
    expect(root.children[0]).toBe(child);
  });

  it("supports the flat list returned while the feature is disabled", () => {
    const flat = flattenCategoryTree([root, secondRoot]);
    expect(hasNestedCategories([root, secondRoot])).toBe(true);
    expect(
      hasNestedCategories(
        flat.map((entry) => ({ ...entry.category, children: undefined })),
      ),
    ).toBe(false);
  });

  it("finds nested categories and reports the root-to-category path", () => {
    expect(findCategorySummary([root, secondRoot], 3)).toBe(grandchild);
    expect(findCategorySummary([root, secondRoot], 99)).toBeNull();
    expect(findCategoryPath([root, secondRoot], 3)).toEqual([
      root,
      child,
      grandchild,
    ]);
    expect(findCategoryPath([root, secondRoot], 4)).toEqual([secondRoot]);
  });

  it("collects descendant ids for admin cycle protection", () => {
    expect(collectDescendantIds(root).sort()).toEqual([2, 3]);
    expect(collectDescendantIds(grandchild)).toEqual([]);
  });
});
