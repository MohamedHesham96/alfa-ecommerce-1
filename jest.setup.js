import "@testing-library/jest-dom";

import { clearTableCache } from "./app/admin/hooks/tableQueryCache";

beforeEach(() => {
  clearTableCache();
});
