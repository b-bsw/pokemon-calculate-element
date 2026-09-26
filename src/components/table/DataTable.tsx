'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Pagination,
    Spinner,
} from '@heroui/react'
import { ReactNode } from 'react'

export type ColumnDefinition = {
    key: string
    label: string
}

interface DataTableProps<T> {
    columns: ColumnDefinition[]
    items: T[]
    isLoading: boolean
    emptyContent: string | ReactNode
    renderCell: (item: T, columnKey: string) => ReactNode
    getRowKey: (item: T) => string | number
    onRowClick?: (item: T) => void
    page?: number
    totalPages?: number
    onPageChange?: (page: number) => void
    ariaLabel?: string
}

export default function DataTable<T>({
    columns,
    items,
    isLoading,
    emptyContent,
    renderCell,
    getRowKey,
    onRowClick,
    page,
    totalPages,
    onPageChange,
    ariaLabel = 'data-table',
}: DataTableProps<T>) {
    const bottomContent =
        page !== undefined && totalPages !== undefined && totalPages > 0 ? (
            <div className="flex w-full justify-center mt-5">
                <Pagination
                    isCompact
                    showControls
                    color="primary"
                    page={page}
                    total={totalPages}
                    onChange={onPageChange}
                    classNames={{
                        base: "gap-2",
                        wrapper: "atlas-pagination",
                        item: "atlas-pagination-item",
                        cursor: "atlas-pagination-current",
                        prev: "atlas-pagination-item",
                        next: "atlas-pagination-item"
                    }}
                />
            </div>
        ) : null

    return (
        <Table
            classNames={{
                wrapper: 'atlas-table',
                th: 'atlas-table-heading',
                td: 'atlas-table-cell',
            }}
            aria-label={ariaLabel}
            bottomContent={bottomContent}
            selectionMode={'none'}
            onRowAction={
                onRowClick
                    ? (key) => {
                          const item = items.find(
                              (i) => getRowKey(i).toString() === key.toString()
                          )
                          if (item) onRowClick(item)
                      }
                    : undefined
            }
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
            </TableHeader>

            <TableBody
                items={items}
                emptyContent={emptyContent}
                isLoading={isLoading}
                loadingContent={<Spinner />}
            >
                {(item) => (
                    <TableRow
                        key={getRowKey(item)}
                        className={`atlas-table-row ${
                            onRowClick ? 'cursor-pointer' : ''
                        }`}
                    >
                        {(columnKey) => (
                            <TableCell>
                                {renderCell(item, columnKey as string)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
