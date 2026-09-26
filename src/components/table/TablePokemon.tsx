'use client'
import typeChart from '@/libs/DataElement'
import Image from 'next/image'
import iconElements from '@/components/icons'
import { useTranslate } from '@/i18n/i18nContext'
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from '@heroui/react'

const TablePokemon = () => {
    const { t } = useTranslate()

    return (
        <div className="w-full">
            <div className="space-y-3 md:hidden">
                {typeChart.map((e) => (
                    <div
                        key={e.name}
                        className="atlas-type-card"
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <div
                                className={`shrink-0 rounded-full p-1 type-${e.name.toLowerCase()}`}
                            >
                                <Image
                                    src={iconElements(e.name)}
                                    alt={e.name}
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <span className="font-semibold">{t(e.name)}</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p className="text-zinc-900 dark:text-zinc-50">
                                <span className="font-medium">
                                    {t('strong')}:{' '}
                                </span>
                                {e.strongAgainst.map((st) => t(st)).join(', ')}
                            </p>
                            <p className="text-zinc-900 dark:text-zinc-50">
                                <span className="font-medium">
                                    {t('weak')}:{' '}
                                </span>
                                {e.weakAgainst.map((wk) => t(wk)).join(', ')}
                            </p>
                            <p className="text-zinc-900 dark:text-zinc-50">
                                <span className="font-medium">
                                    {t('noEffectFrom')}:{' '}
                                </span>
                                {e.noEffectFrom.length > 0
                                    ? e.noEffectFrom
                                          .map((no) => t(no))
                                          .join(', ')
                                    : '-'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <Table
                    aria-label="Pokemon element table"
                    classNames={{
                        wrapper: 'atlas-table',
                        th: 'atlas-table-heading',
                        td: 'atlas-table-cell',
                        tr: 'atlas-table-row',
                    }}
                >
                    <TableHeader>
                        <TableColumn>{t('elemental')}</TableColumn>
                        <TableColumn>{t('strong')}</TableColumn>
                        <TableColumn>{t('weak')}</TableColumn>
                        <TableColumn>{t('noEffectFrom')}</TableColumn>
                    </TableHeader>

                    <TableBody>
                        {typeChart.map((e) => (
                            <TableRow key={e.name}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`shrink-0 rounded-full p-1 type-${e.name.toLowerCase()}`}
                                        >
                                            <Image
                                                src={iconElements(e.name)}
                                                alt={e.name}
                                                width={20}
                                                height={20}
                                            />
                                        </div>
                                        <span className="font-medium">
                                            {t(e.name)}
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <span className="text-zinc-900 dark:text-zinc-50">
                                        {e.strongAgainst.length > 0
                                            ? e.strongAgainst
                                                  .map((st) => t(st))
                                                  .join(', ')
                                            : '-'}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <span className="text-zinc-900 dark:text-zinc-50">
                                        {e.weakAgainst
                                            .map((wk) => t(wk))
                                            .join(', ')}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <span className="text-zinc-900 dark:text-zinc-50">
                                        {e.noEffectFrom.length > 0
                                            ? e.noEffectFrom
                                                  .map((no) => t(no))
                                                  .join(', ')
                                            : '-'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default TablePokemon
