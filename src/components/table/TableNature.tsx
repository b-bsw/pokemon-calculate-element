'use client'
import { useTranslate } from '@/i18n/i18nContext'
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from '@heroui/react'

const naturesData = [
    {
        plus: '+ stat.attack',
        natures: [
            { name: 'Hardy', neutral: true },
            { name: 'Lonely', neutral: false },
            { name: 'Adamant', neutral: false },
            { name: 'Naughty', neutral: false },
            { name: 'Brave', neutral: false },
        ],
    },
    {
        plus: '+ stat.defense',
        natures: [
            { name: 'Bold', neutral: false },
            { name: 'Docile', neutral: true },
            { name: 'Impish', neutral: false },
            { name: 'Lax', neutral: false },
            { name: 'Relaxed', neutral: false },
        ],
    },
    {
        plus: '+ stat.spAtk',
        natures: [
            { name: 'Modest', neutral: false },
            { name: 'Mild', neutral: false },
            { name: 'Bashful', neutral: true },
            { name: 'Rash', neutral: false },
            { name: 'Quiet', neutral: false },
        ],
    },
    {
        plus: '+ stat.spDef',
        natures: [
            { name: 'Calm', neutral: false },
            { name: 'Gentle', neutral: false },
            { name: 'Careful', neutral: false },
            { name: 'Quirky', neutral: true },
            { name: 'Sassy', neutral: false },
        ],
    },
    {
        plus: '+ stat.speed',
        natures: [
            { name: 'Timid', neutral: false },
            { name: 'Hasty', neutral: false },
            { name: 'Jolly', neutral: false },
            { name: 'Naive', neutral: false },
            { name: 'Serious', neutral: true },
        ],
    },
]

const TableNature = () => {
    const { t } = useTranslate()

    return (
        <div className="w-full overflow-auto">
            <Table
                aria-label="Pokemon nature table"
                classNames={{
                    wrapper: 'atlas-table',
                    th: 'atlas-table-heading',
                    td: 'atlas-table-cell',
                    tr: 'atlas-table-row',
                }}
            >
                <TableHeader>
                    <TableColumn> </TableColumn>
                    <TableColumn className="text-danger-500 font-prompt font-bold dark:text-red-500">
                        - {t('stat.attack')}
                    </TableColumn>
                    <TableColumn className="text-danger-500 font-prompt font-bold dark:text-red-500">
                        - {t('stat.defense')}
                    </TableColumn>
                    <TableColumn className="text-danger-500 font-prompt font-bold dark:text-red-500">
                        - {t('stat.spAtk')}
                    </TableColumn>
                    <TableColumn className="text-danger-500 font-prompt font-bold dark:text-red-500">
                        - {t('stat.spDef')}
                    </TableColumn>
                    <TableColumn className="text-danger-500 font-prompt font-bold dark:text-red-500">
                        - {t('stat.speed')}
                    </TableColumn>
                </TableHeader>

                <TableBody>
                    {naturesData.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-prompt text-left font-bold text-nowrap text-green-600 dark:text-green-400/90">
                                {row.plus
                                    .replace('stat.', '')
                                    .includes('Atk') ||
                                row.plus.replace('stat.', '').includes('Def')
                                    ? row.plus.split(' ')[0] +
                                      ' ' +
                                      t('stat.' + row.plus.split('.')[1])
                                    : row.plus.split(' ')[0] +
                                      ' ' +
                                      t('stat.' + row.plus.split('.')[1])}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        row.natures[0].neutral
                                            ? 'text-zinc-500 dark:text-zinc-400'
                                            : 'font-bold text-zinc-900 dark:text-zinc-50'
                                    }
                                >
                                    {row.natures[0].name}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        row.natures[1].neutral
                                            ? 'text-zinc-500 dark:text-zinc-400'
                                            : 'font-bold text-zinc-900 dark:text-zinc-50'
                                    }
                                >
                                    {row.natures[1].name}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        row.natures[2].neutral
                                            ? 'text-zinc-500 dark:text-zinc-400'
                                            : 'font-bold text-zinc-900 dark:text-zinc-50'
                                    }
                                >
                                    {row.natures[2].name}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        row.natures[3].neutral
                                            ? 'text-zinc-500 dark:text-zinc-400'
                                            : 'font-bold text-zinc-900 dark:text-zinc-50'
                                    }
                                >
                                    {row.natures[3].name}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        row.natures[4].neutral
                                            ? 'text-zinc-500 dark:text-zinc-400'
                                            : 'font-bold text-zinc-900 dark:text-zinc-50'
                                    }
                                >
                                    {row.natures[4].name}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default TableNature
