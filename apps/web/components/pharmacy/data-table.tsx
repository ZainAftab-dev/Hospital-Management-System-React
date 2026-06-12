'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  useReactTable
} from '@tanstack/react-table';

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  selectedId?: string;
  getRowId: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  globalFilter?: string;
};

export function DataTable<TData>({ columns, data, selectedId, getRowId, onRowClick, globalFilter }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="overflow-auto border border-border bg-white">
      <table className="data-grid">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: Row<TData>) => (
            <tr
              key={row.id}
              data-selected={selectedId === row.id}
              onClick={() => onRowClick?.(row.original)}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
          {!table.getRowModel().rows.length && (
            <tr>
              <td className="text-center text-muted-foreground" colSpan={columns.length}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
