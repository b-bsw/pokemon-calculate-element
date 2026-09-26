'use client'

import { useTranslate } from '@/i18n/i18nContext'
import {
    Input,
    Spinner,
    Card,
    CardBody,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Chip,
    Divider,
} from '@heroui/react'
import axios from 'axios'
import Image from 'next/image'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Package } from 'lucide-react'
import PageBanner from '@/components/PageBanner'

type HeldItem = {
    id: number
    name: string
    url: string
    sprite: string | null
    effect: string
    isLoaded: boolean
}

type ItemDetail = {
    name: string
    cost: number
    fling_power: number | null
    category: { name: string }
    attributes: { name: string }[]
    effect_entries: {
        effect: string
        short_effect: string
        language: { name: string }
    }[]
    flavor_text_entries: { text: string; language: { name: string } }[]
    sprites: { default: string | null }
    held_by_pokemon: { pokemon: { name: string; url: string } }[]
}

export default function Items() {
    const [dataItems, setDataItems] = useState<HeldItem[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>('')

    // Modal state
    const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    const { t } = useTranslate()

    // Load held items category
    const loadHeldItems = async () => {
        try {
            const res = await axios.get(
                `https://pokeapi.co/api/v2/item-category/held-items`
            )
            const items = res.data.items

            const dataWithIndex: HeldItem[] = items.map(
                (e: { name: string; url: string }, index: number) => ({
                    id: index + 1,
                    name: e.name,
                    url: e.url,
                    sprite: null,
                    effect: '',
                    isLoaded: false,
                })
            )
            setDataItems(dataWithIndex)
            setIsLoading(false)

            dataWithIndex.forEach((item) => {
                fetchItemDetails(item)
            })
        } catch (err) {
            console.log(err)
            setIsLoading(false)
        }
    }

    const fetchItemDetails = async (item: HeldItem) => {
        try {
            const response = await axios.get(item.url)
            const data = response.data
            // console.log(data)

            const effectEntry = data.effect_entries?.find(
                (e: { language: { name: string } }) => e.language.name === 'en'
            )
            const effect =
                effectEntry?.short_effect || effectEntry?.effect || ''

            setDataItems((prev) =>
                prev.map((m) =>
                    m.id === item.id
                        ? {
                              ...m,
                              sprite: data.sprites?.default || null,
                              effect: effect,
                              isLoaded: true,
                          }
                        : m
                )
            )
        } catch (err) {
            console.error(`Error fetching details for ${item.name}:`, err)
            setDataItems((prev) =>
                prev.map((m) =>
                    m.id === item.id ? { ...m, isLoaded: true } : m
                )
            )
        }
    }

    const fetchItemFullDetail = async (url: string) => {
        setIsLoadingDetail(true)
        try {
            const response = await axios.get(url)
            setSelectedItem(response.data)
            onOpen()
        } catch (err) {
            console.error('Error fetching item detail:', err)
        } finally {
            setIsLoadingDetail(false)
        }
    }

    const getEnglishEffect = (item: ItemDetail) => {
        const entry = item.effect_entries?.find((e) => e.language.name === 'en')
        return (
            entry?.effect ||
            entry?.short_effect ||
            t('noDescription') ||
            'No description available.'
        )
    }

    const getEnglishFlavorText = (item: ItemDetail) => {
        const entry = item.flavor_text_entries?.find(
            (e) => e.language.name === 'en'
        )
        return entry?.text?.replace(/\n/g, ' ') || ''
    }

    useEffect(() => {
        loadHeldItems()
    }, [])

    // Filter and sort A-Z
    const filtered = useMemo(() => {
        return dataItems
            .filter((m) => {
                const s = search.toLowerCase().replace(/-/g, ' ')
                const name = m.name.toLowerCase().replace(/-/g, ' ')
                return (
                    name.includes(s) ||
                    m.effect.toLowerCase().includes(search.toLowerCase())
                )
            })
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [search, dataItems])

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value)
    }, [])

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Spinner size="lg" color="primary" />
            </div>
        )
    }

    return (
        <>
            <div className="page-layout">
                <section className="page-panel max-w-4xl">
                    <PageBanner path="/items" />

                    <Input
                        type="text"
                        placeholder={t('searchItem') || 'Search item name...'}
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

                    <div className="flex flex-col gap-3 pb-8">
                        {filtered.length === 0 ? (
                            <p className="py-8 text-center text-zinc-500">
                                {t('noItems') || 'No items found.'}
                            </p>
                        ) : (
                            filtered.map((item) => (
                                <Card
                                    key={item.id}
                                    isPressable
                                    onPress={() =>
                                        fetchItemFullDetail(item.url)
                                    }
                                    className="group border-2 border-zinc-900 bg-zinc-50 transition-all hover:bg-zinc-900 hover:text-zinc-50 dark:border-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-50 dark:hover:text-zinc-900 shadow-none rounded-xl"
                                    shadow="none"
                                >
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
                                        <div className="shrink-0">
                                            {item.isLoaded ? (
                                                item.sprite ? (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                                                        <Image
                                                            src={item.sprite}
                                                            alt={item.name}
                                                            width={40}
                                                            height={40}
                                                            className="object-contain"
                                                            unoptimized
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                                                        <Package
                                                            size={24}
                                                            className="text-zinc-400"
                                                        />
                                                    </div>
                                                )
                                            ) : (
                                                <div className="h-12 w-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-zinc-900 capitalize dark:text-zinc-50 group-hover:text-zinc-50 dark:group-hover:text-zinc-900">
                                                {item.name.replace(/-/g, ' ')}
                                            </h3>
                                            {item.isLoaded ? (
                                                <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-300 dark:group-hover:text-zinc-600">
                                                    {item.effect ||
                                                        t('noDescription') ||
                                                        'No description available.'}
                                                </p>
                                            ) : (
                                                <div className="mt-1 h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Item Detail Modal */}
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
                            {isLoadingDetail || !selectedItem ? (
                                <ModalBody className="py-10">
                                    <div className="flex justify-center">
                                        <Spinner size="lg" color="primary" />
                                    </div>
                                </ModalBody>
                            ) : (
                                <>
                                    <ModalHeader className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            {selectedItem.sprites?.default ? (
                                                <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-700">
                                                    <Image
                                                        src={
                                                            selectedItem.sprites
                                                                .default
                                                        }
                                                        alt={selectedItem.name}
                                                        width={48}
                                                        height={48}
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                                    <Package
                                                        size={32}
                                                        className="text-zinc-400"
                                                    />
                                                </div>
                                            )}
                                            <span className="text-xl font-bold text-zinc-800 capitalize dark:text-zinc-50">
                                                {selectedItem.name.replace(
                                                    /-/g,
                                                    ' '
                                                )}
                                            </span>
                                        </div>
                                    </ModalHeader>
                                    <ModalBody>
                                        {/* Info Grid */}
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('category') ||
                                                        'Category'}
                                                </p>
                                                <Chip
                                                    size="sm"
                                                    className="capitalize"
                                                >
                                                    {selectedItem.category?.name?.replace(
                                                        /-/g,
                                                        ' '
                                                    ) || '-'}
                                                </Chip>
                                            </div>

                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('flingPower') ||
                                                        'Fling Power'}
                                                </p>
                                                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-50">
                                                    {selectedItem.fling_power ??
                                                        '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Attributes */}
                                        {selectedItem.attributes &&
                                            selectedItem.attributes.length >
                                                0 && (
                                                <div className="mb-4">
                                                    <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                        {t('attributes') ||
                                                            'Attributes'}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedItem.attributes.map(
                                                            (attr) => (
                                                                <Chip
                                                                    key={
                                                                        attr.name
                                                                    }
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="capitalize"
                                                                >
                                                                    {attr.name.replace(
                                                                        /-/g,
                                                                        ' '
                                                                    )}
                                                                </Chip>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        <Divider className="my-4" />

                                        {/* Effect */}
                                        <div>
                                            <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                {t('effect') || 'Effect'}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                                {getEnglishEffect(selectedItem)}
                                            </p>
                                        </div>

                                        {/* Flavor Text */}
                                        {getEnglishFlavorText(selectedItem) && (
                                            <div className="mt-4">
                                                <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                    {t('description') ||
                                                        'Description'}
                                                </h3>
                                                <p className="text-sm text-zinc-500 italic dark:text-zinc-400">
                                                    "
                                                    {getEnglishFlavorText(
                                                        selectedItem
                                                    )}
                                                    "
                                                </p>
                                            </div>
                                        )}

                                        {/* Held by Pokemon */}
                                        {selectedItem.held_by_pokemon &&
                                            selectedItem.held_by_pokemon
                                                .length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                        {t('heldByPokemon') ||
                                                            'Held by Pokémon'}{' '}
                                                        (
                                                        {
                                                            selectedItem
                                                                .held_by_pokemon
                                                                .length
                                                        }
                                                        )
                                                    </h3>
                                                    <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                                                        {selectedItem.held_by_pokemon.map(
                                                            (p) => (
                                                                <Chip
                                                                    key={
                                                                        p
                                                                            .pokemon
                                                                            .name
                                                                    }
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="text-xs capitalize"
                                                                >
                                                                    {p.pokemon.name.replace(
                                                                        /-/g,
                                                                        ' '
                                                                    )}
                                                                </Chip>
                                                            )
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
