'use client'

import { useTranslate } from '@/i18n/i18nContext'
import {
    getKeyValue,
    Pagination,
    Spinner,
    Card,
    CardBody,
    Input,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Divider,
} from '@heroui/react'
import DataTable from '@/components/table/DataTable'
import PageBanner from '@/components/PageBanner'
import axios from 'axios'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import iconElements from '@/components/icons'
import { Swords, Target, Zap } from 'lucide-react'

// Valid Pokemon types
const VALID_TYPES = [
    'normal',
    'fire',
    'water',
    'electric',
    'grass',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
]

type MoveItem = {
    id: number
    name: string
    url: string
    type: string
    damageClass: string
    power: number | null
    accuracy: number | null
    isLoaded: boolean
}

type MoveDetail = {
    name: string
    type: { name: string }
    damage_class: { name: string }
    power: number | null
    accuracy: number | null
    pp: number
    priority: number
    effect_entries: {
        effect: string
        short_effect: string
        language: { name: string }
    }[]
    flavor_text_entries: { flavor_text: string; language: { name: string } }[]
    learned_by_pokemon: { name: string; url: string }[]
    generation: { name: string }
    target: { name: string }
}

type MoveList = MoveItem[]

const damageClassIcons: Record<string, React.ReactNode> = {
    physical: <Swords size={14} className="text-orange-500" />,
    special: <Zap size={14} className="text-purple-500" />,
    status: <Target size={14} className="text-gray-500" />,
}

const damageClassColors: Record<string, string> = {
    physical:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    special:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    status: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

export default function Moves() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize from URL params
    const initialSearch = searchParams.get('q') || ''
    const initialPage = parseInt(searchParams.get('page') || '1', 10)

    const [dataMoves, setDataMoves] = useState<MoveList>([])
    const [page, setPage] = useState<number>(initialPage)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>(initialSearch)
    const fetchedIds = useRef<Set<number>>(new Set())

    // Modal state
    const [selectedMove, setSelectedMove] = useState<MoveDetail | null>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    const { t } = useTranslate()

    // Update URL when search or page changes
    const updateURL = useCallback(
        (newSearch: string, newPage: number) => {
            const params = new URLSearchParams()
            if (newSearch) params.set('q', newSearch)
            if (newPage > 1) params.set('page', newPage.toString())
            const queryString = params.toString()
            router.replace(`/moves${queryString ? `?${queryString}` : ''}`, {
                scroll: false,
            })
        },
        [router]
    )

    // Initial loading - get list of all Moves
    const loading = async () => {
        try {
            const res = await axios.get(
                `https://pokeapi.co/api/v2/move?limit=934&offset=0`
            )
            const data = res.data.results
            const dataWithIndex: MoveList = data.map(
                (e: { name: string; url: string }, index: number) => ({
                    id: index + 1,
                    name: e.name,
                    url: e.url,
                    type: '',
                    damageClass: '',
                    power: null,
                    accuracy: null,
                    isLoaded: false,
                })
            )
            setDataMoves(dataWithIndex)
            if (!searchParams.get('page')) {
                setPage(1)
            }
            setIsLoading(false)
        } catch (err) {
            console.log(err)
        }
    }

    // Fetch details for a specific Move (for table display)
    const fetchMoveDetails = async (move: MoveItem) => {
        if (fetchedIds.current.has(move.id)) return

        fetchedIds.current.add(move.id)

        try {
            const response = await axios.get(move.url)
            const data = response.data

            setDataMoves((prev) =>
                prev.map((m) =>
                    m.id === move.id
                        ? {
                              ...m,
                              type: data.type?.name || 'normal',
                              damageClass: data.damage_class?.name || 'status',
                              power: data.power,
                              accuracy: data.accuracy,
                              isLoaded: true,
                          }
                        : m
                )
            )
        } catch (err) {
            console.error(`Error fetching details for ${move.name}:`, err)
            setDataMoves((prev) =>
                prev.map((m) =>
                    m.id === move.id ? { ...m, isLoaded: true } : m
                )
            )
        }
    }

    // Fetch full move detail for modal
    const fetchMoveFullDetail = async (url: string) => {
        setIsLoadingDetail(true)
        try {
            const response = await axios.get(url)
            setSelectedMove(response.data)
            onOpen()
        } catch (err) {
            console.error('Error fetching move detail:', err)
        } finally {
            setIsLoadingDetail(false)
        }
    }

    // Get English effect text
    const getEnglishEffect = (move: MoveDetail) => {
        const entry = move.effect_entries?.find((e) => e.language.name === 'en')
        return (
            entry?.short_effect ||
            entry?.effect ||
            t('noDescription') ||
            'No description available.'
        )
    }

    // Get English flavor text
    const getEnglishFlavorText = (move: MoveDetail) => {
        const entry = move.flavor_text_entries?.find(
            (e) => e.language.name === 'en'
        )
        return entry?.flavor_text?.replace(/\n/g, ' ') || ''
    }

    useEffect(() => {
        loading()
    }, [])

    const columns = [
        { key: 'id', label: '#' },
        { key: 'name', label: t('name') },
        { key: 'type', label: t('type') },
        { key: 'category', label: t('category') },
        { key: 'power', label: t('power') },
        { key: 'accuracy', label: t('accuracy') },
    ]

    const filtered = useMemo(() => {
        return dataMoves.filter((m) => {
            const s = search.toLowerCase().replace(/-/g, ' ')
            const name = m.name.toLowerCase().replace(/-/g, ' ')
            return name.includes(s)
        })
    }, [search, dataMoves])

    const pages = Math.ceil(filtered.length / 10)

    const items = useMemo(() => {
        const start = (page - 1) * 10
        const end = start + 10
        return filtered.slice(start, end)
    }, [page, filtered])

    // Fetch details when items change (page change or search)
    useEffect(() => {
        items.forEach((item) => {
            if (!item.isLoaded && !fetchedIds.current.has(item.id)) {
                fetchMoveDetails(item)
            }
        })
    }, [items])

    // Handle search change with callback to prevent input freezing
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearch(value)
            setPage(1)
            updateURL(value, 1)
        },
        [updateURL]
    )

    // Handle page change
    const handlePageChange = useCallback(
        (newPage: number) => {
            setPage(newPage)
            updateURL(search, newPage)
        },
        [search, updateURL]
    )

    const renderCell = (item: MoveItem, columnKey: string) => {
        switch (columnKey) {
            case 'id':
                return <span className="text-zinc-500">{item.id}</span>
            case 'name':
                return (
                    <span className="font-medium capitalize">
                        {item.name.replace(/-/g, ' ')}
                    </span>
                )
            case 'type':
                if (!item.isLoaded) {
                    return (
                        <div className="h-6 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    )
                }
                return VALID_TYPES.includes(item.type) ? (
                    <div className="flex items-center justify-center gap-1">
                        <div className={`rounded-full p-1 type-${item.type}`}>
                            <Image
                                src={iconElements(item.type)}
                                alt={item.type}
                                width={16}
                                height={16}
                            />
                        </div>
                        <span className="text-sm capitalize">
                            {t(item.type)}
                        </span>
                    </div>
                ) : (
                    <span className="text-zinc-400">-</span>
                )
            case 'category':
                if (!item.isLoaded) {
                    return (
                        <div className="h-6 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    )
                }
                return item.damageClass ? (
                    <Chip
                        size="sm"
                        variant="flat"
                        className={`${damageClassColors[item.damageClass]} capitalize`}
                        startContent={damageClassIcons[item.damageClass]}
                    >
                        {t(item.damageClass)}
                    </Chip>
                ) : (
                    <span className="text-zinc-400">-</span>
                )
            case 'power':
                if (!item.isLoaded) {
                    return (
                        <div className="h-6 w-8 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    )
                }
                return <span className="font-medium">{item.power ?? '-'}</span>
            case 'accuracy':
                if (!item.isLoaded) {
                    return (
                        <div className="h-6 w-8 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    )
                }
                return (
                    <span className="font-medium">
                        {item.accuracy ? `${item.accuracy}%` : '-'}
                    </span>
                )
            default:
                return getKeyValue(item, columnKey)
        }
    }

    return (
        <>
            <div className="page-layout">
                <section className="page-panel max-w-5xl">
                    <PageBanner path="/moves" />
                    <Input
                        type="text"
                        placeholder={t('searchMove') || 'Search move name...'}
                        value={search}
                        onValueChange={handleSearchChange}
                        variant="bordered"
                        color="primary"
                        isClearable
                        onClear={() => handleSearchChange('')}
                        classNames={{
                            inputWrapper:
                                'border-2 border-zinc-900 dark:border-zinc-50 shadow-none rounded-xl bg-zinc-50 dark:bg-zinc-900',
                        }}
                    />

                    <div className="space-y-3 md:hidden">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        ) : items.length === 0 ? (
                            <p className="py-8 text-center text-zinc-500">
                                {t('noMoves') || 'No moves found.'}
                            </p>
                        ) : (
                            items.map((item) => (
                                <Card
                                    key={item.id}
                                    isPressable
                                    onPress={() =>
                                        fetchMoveFullDetail(item.url)
                                    }
                                    className="group rounded-xl border-2 border-zinc-900 bg-zinc-50 shadow-none transition-colors hover:bg-zinc-900 hover:text-zinc-50 dark:border-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
                                    fullWidth
                                >
                                    <CardBody className="gap-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-zinc-500">
                                                #{item.id}
                                            </span>
                                            <span className="font-semibold text-zinc-900 capitalize dark:text-zinc-50">
                                                {item.name.replace(/-/g, ' ')}
                                            </span>
                                            <span></span>
                                        </div>

                                        <div className="flex flex-col flex-wrap items-start gap-2">
                                            {item.isLoaded &&
                                            VALID_TYPES.includes(item.type) ? (
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className={`rounded-full p-1 type-${item.type}`}
                                                    >
                                                        <Image
                                                            src={iconElements(
                                                                item.type
                                                            )}
                                                            alt={item.type}
                                                            width={16}
                                                            height={16}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-zinc-900 capitalize dark:text-zinc-50">
                                                        {t(item.type)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="h-6 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                                            )}

                                            {item.isLoaded &&
                                            item.damageClass ? (
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={`${damageClassColors[item.damageClass]} capitalize`}
                                                    startContent={
                                                        damageClassIcons[
                                                            item.damageClass
                                                        ]
                                                    }
                                                >
                                                    {t(item.damageClass)}
                                                </Chip>
                                            ) : (
                                                <div className="h-6 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                {t('power')}:&nbsp;
                                                <span className="font-semibold">
                                                    {item.isLoaded
                                                        ? (item.power ?? '-')
                                                        : '...'}
                                                </span>
                                            </div>
                                            <div className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                {t('accuracy')}:&nbsp;
                                                <span className="font-semibold">
                                                    {item.isLoaded
                                                        ? item.accuracy
                                                            ? `${item.accuracy}%`
                                                            : '-'
                                                        : '...'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="hidden md:block">
                        <DataTable
                            columns={columns}
                            items={items}
                            isLoading={isLoading}
                            emptyContent={t('noMoves') || 'No moves found.'}
                            page={page}
                            totalPages={pages}
                            onPageChange={handlePageChange}
                            getRowKey={(item) => item.name}
                            onRowClick={(item) => fetchMoveFullDetail(item.url)}
                            ariaLabel="table-of-moves"
                            renderCell={renderCell}
                        />
                    </div>

                    {page > 0 && pages > 0 && (
                        <div className="flex w-full justify-center mt-4 md:hidden">
                            <Pagination
                                isCompact
                                showControls
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={handlePageChange}
                                classNames={{
                                    base: "gap-2",
                                    wrapper: "border-2 border-zinc-900 dark:border-zinc-50 shadow-none rounded-xl bg-zinc-50 dark:bg-zinc-900 overflow-hidden",
                                    item: "bg-transparent text-zinc-900 dark:text-zinc-50 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800",
                                    cursor: "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 font-bold",
                                    prev: "bg-transparent text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800",
                                    next: "bg-transparent text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                }}
                            />
                        </div>
                    )}
                </section>
            </div>

            {/* Move Detail Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                scrollBehavior="inside"
                size="lg"
                classNames={{
                    base: 'bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-50 shadow-none rounded-xl',
                    header: 'border-b-2 border-zinc-900 dark:border-zinc-50',
                    footer: 'border-t-2 border-zinc-900 dark:border-zinc-50',
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            {isLoadingDetail || !selectedMove ? (
                                <ModalBody className="py-10">
                                    <div className="flex justify-center">
                                        <Spinner size="lg" color="primary" />
                                    </div>
                                </ModalBody>
                            ) : (
                                <>
                                    <ModalHeader className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`rounded-full p-2 type-${selectedMove.type.name}`}
                                            >
                                                {VALID_TYPES.includes(
                                                    selectedMove.type.name
                                                ) && (
                                                    <Image
                                                        src={iconElements(
                                                            selectedMove.type
                                                                .name
                                                        )}
                                                        alt={
                                                            selectedMove.type
                                                                .name
                                                        }
                                                        width={24}
                                                        height={24}
                                                    />
                                                )}
                                            </div>
                                            <span className="text-xl font-bold text-zinc-800 capitalize dark:text-zinc-50">
                                                {selectedMove.name.replace(
                                                    /-/g,
                                                    ' '
                                                )}
                                            </span>
                                        </div>
                                    </ModalHeader>
                                    <ModalBody>
                                        {/* Move Info Grid */}
                                        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                                            {/* Type */}
                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('type') || 'Type'}
                                                </p>
                                                <Chip
                                                    size="sm"
                                                    className={`type-${selectedMove.type.name} text-zinc-50 capitalize`}
                                                >
                                                    {t(
                                                        selectedMove.type.name
                                                    ) || selectedMove.type.name}
                                                </Chip>
                                            </div>

                                            {/* Category */}
                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('category') ||
                                                        'Category'}
                                                </p>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={`${damageClassColors[selectedMove.damage_class.name]} capitalize`}
                                                    startContent={
                                                        damageClassIcons[
                                                            selectedMove
                                                                .damage_class
                                                                .name
                                                        ]
                                                    }
                                                >
                                                    {t(
                                                        selectedMove
                                                            .damage_class.name
                                                    ) ||
                                                        selectedMove
                                                            .damage_class.name}
                                                </Chip>
                                            </div>

                                            {/* Power */}
                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('power') || 'Power'}
                                                </p>
                                                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-50">
                                                    {selectedMove.power ?? '-'}
                                                </p>
                                            </div>

                                            {/* Accuracy */}
                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('accuracy') ||
                                                        'Accuracy'}
                                                </p>
                                                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-50">
                                                    {selectedMove.accuracy
                                                        ? `${selectedMove.accuracy}%`
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* PP and Priority */}
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        PP
                                                    </span>
                                                    <span className="font-bold text-zinc-800 dark:text-zinc-50">
                                                        {selectedMove.pp}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {t('priority') ||
                                                            'Priority'}
                                                    </span>
                                                    <span className="font-bold text-zinc-800 dark:text-zinc-50">
                                                        {selectedMove.priority >=
                                                        0
                                                            ? `+${selectedMove.priority}`
                                                            : selectedMove.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Generation and Target */}
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {t('generation') ||
                                                            'Generation'}
                                                    </span>
                                                    <span className="text-sm font-bold text-zinc-800 capitalize dark:text-zinc-50">
                                                        {selectedMove.generation?.name?.replace(
                                                            /-/g,
                                                            ' '
                                                        ) || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {t('target') ||
                                                            'Target'}
                                                    </span>
                                                    <span className="text-sm font-bold text-zinc-800 capitalize dark:text-zinc-50">
                                                        {selectedMove.target?.name?.replace(
                                                            /-/g,
                                                            ' '
                                                        ) || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Divider className="my-4" />

                                        {/* Effect Description */}
                                        <div>
                                            <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                {t('effect') || 'Effect'}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                                {getEnglishEffect(selectedMove)}
                                            </p>
                                        </div>

                                        {/* Flavor Text */}
                                        {getEnglishFlavorText(selectedMove) && (
                                            <div className="mt-4">
                                                <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                    {t('description') ||
                                                        'Description'}
                                                </h3>
                                                <p className="text-sm text-zinc-500 italic dark:text-zinc-400">
                                                    "
                                                    {getEnglishFlavorText(
                                                        selectedMove
                                                    )}
                                                    "
                                                </p>
                                            </div>
                                        )}

                                        {/* Pokemon that can learn this move */}
                                        {selectedMove.learned_by_pokemon &&
                                            selectedMove.learned_by_pokemon
                                                .length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                        {t(
                                                            'learnedByPokemon'
                                                        ) ||
                                                            'Learned by Pokémon'}{' '}
                                                        (
                                                        {
                                                            selectedMove
                                                                .learned_by_pokemon
                                                                .length
                                                        }
                                                        )
                                                    </h3>
                                                    <div className="scll flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                                                        {selectedMove.learned_by_pokemon
                                                            .slice(0, 30)
                                                            .map((p) => (
                                                                <Chip
                                                                    key={p.name}
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="text-xs capitalize"
                                                                >
                                                                    {p.name.replace(
                                                                        /-/g,
                                                                        ' '
                                                                    )}
                                                                </Chip>
                                                            ))}
                                                        {selectedMove
                                                            .learned_by_pokemon
                                                            .length > 30 && (
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                className="text-xs"
                                                            >
                                                                +
                                                                {selectedMove
                                                                    .learned_by_pokemon
                                                                    .length -
                                                                    30}{' '}
                                                                more
                                                            </Chip>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button
                                            color="primary"
                                            variant="light"
                                            onPress={onClose}
                                        >
                                            {t('close') || 'Close'}
                                        </Button>
                                    </ModalFooter>
                                </>
                            )}
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}
