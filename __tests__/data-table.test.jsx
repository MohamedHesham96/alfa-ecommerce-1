import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTable } from "../app/admin/components/data-table";
import { DataTableToolbar } from "../app/admin/components/data-table";

const columns = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    meta: {
      backendField: "name",
      dataType: "STRING",
      sortable: true,
      filterable: true,
    },
    cell: ({ row }) => row.original.name,
  },
  {
    id: "active",
    accessorKey: "active",
    header: "Active",
    meta: {
      backendField: "active",
      dataType: "BOOLEAN",
      sortable: true,
      filterable: true,
    },
    cell: ({ row }) => (row.original.active ? "Yes" : "No"),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <button type="button" onClick={() => row.original.onAction?.()}>
        Open
      </button>
    ),
  },
];

function TestTable({ data, onRowClick }) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <>
      <pre data-testid="sorting">{JSON.stringify(sorting)}</pre>
      <DataTable
        table={table}
        showInfiniteFooter={false}
        onRowClick={onRowClick}
        toolbar={
          <DataTableToolbar
            table={table}
            searchValue={globalFilter}
            onSearchChange={setGlobalFilter}
          />
        }
        emptyMessage="Nothing here"
      />
    </>
  );
}

describe("DataTable", () => {
  it("renders rows and allows header sorting", () => {
    render(<TestTable data={[{ id: 1, name: "Ahmed", active: true }]} />);

    expect(screen.getByText("Ahmed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));

    expect(screen.getByTestId("sorting").textContent).toContain(
      '"id":"name"',
    );
  });

  it("renders the empty state when there are no rows", () => {
    render(<TestTable data={[]} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("opens the column filter panel", () => {
    render(<TestTable data={[{ id: 1, name: "Ahmed", active: true }]} />);

    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getAllByText("Name").length).toBeGreaterThan(1);
    expect(screen.getAllByDisplayValue(/^all$/i).length).toBeGreaterThan(0);
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = jest.fn();
    render(
      <TestTable
        data={[{ id: 1, name: "Ahmed", active: true }]}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByText("Ahmed"));
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: "Ahmed" }),
    );
  });

  it("does not trigger the row click when an inner control is clicked", () => {
    const onRowClick = jest.fn();
    const onAction = jest.fn();
    render(
      <TestTable
        data={[{ id: 1, name: "Ahmed", active: true, onAction }]}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("supports keyboard activation of a row", () => {
    const onRowClick = jest.fn();
    render(
      <TestTable
        data={[{ id: 1, name: "Ahmed", active: true }]}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.keyDown(screen.getByText("Ahmed").closest("tr"), {
      key: "Enter",
    });
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});
