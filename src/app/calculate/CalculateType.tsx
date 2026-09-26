'use client'

import { Key, useState, useMemo } from 'react'
import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Tooltip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from '@heroui/react'
import poke from '@/libs/DataElement'
import iconElements, { icon2TagSvg } from '@/components/icons'
import { RefreshCcw } from 'lucide-react'
import Image from 'next/image'
import { useTranslate } from '@/i18n/i18nContext'
import PageBanner from '@/components/PageBanner'

const CalculateType = () => {
    const [type1, setType1] = useState<string>('')
    const [type2, setType2] = useState<string>('')

    const { t } = useTranslate()

    const handleReset = () => {
        setType1('')
        setType2('')
    }

    const selectedTypes = poke.filter(
        (type) => type.name === type1 || (type2 && type.name === type2)
    )

    // Get types we're strong against (Offensive Coverage)
    // For coverage, we just want to know what types we hit Super Effectively with ANY of our types.
    const strongAgainstTypes = useMemo(() => {
        const result: Record<string, number> = {}
        const allStrong = new Set<string>()

        selectedTypes.forEach((t) => {
            t.strongAgainst.forEach((s) => allStrong.add(s))
        })

        // Map to count 1 for the renderer (implies x2 in the generic renderer, but we will customize label)
        allStrong.forEach((type) => {
            result[type] = 1
        })

        return result
    }, [selectedTypes])

    // Calculate defensive effectiveness (Weakness, Resistance, Immunity)
    const defensiveEffectiveness = useMemo(() => {
        const effectiveness: Record<string, number> = {}

        // Initialize all types with 1x multiplier
        poke.forEach((type) => {
            effectiveness[type.name] = 1
        })

        // Iterate through all 18 types as "Attacking Types"
        poke.forEach((attackingType) => {
            let multiplier = 1

            selectedTypes.forEach((defendingType) => {
                // Check weakness (x2)
                if (defendingType.weakAgainst.includes(attackingType.name)) {
                    multiplier *= 2
                }
                // Check resistance (x0.5)
                else if (defendingType.resists?.includes(attackingType.name)) {
                    multiplier *= 0.5
                }
                // Check immunity (x0)
                else if (
                    defendingType.noEffectFrom.includes(attackingType.name)
                ) {
                    multiplier *= 0
                }
            })

            effectiveness[attackingType.name] = multiplier
        })

        return effectiveness
    }, [selectedTypes])

    // Get types we're weak to (take 2x/4x damage)
    const weakToTypes = useMemo(() => {
        const result: Record<string, number> = {}
        Object.entries(defensiveEffectiveness).forEach(([type, mult]) => {
            if (mult > 1) {
                result[type] = mult === 4 ? 2 : 1
            }
        })
        return result
    }, [defensiveEffectiveness])

    // Get types we resist (take 0.5x/0.25x damage)
    const resistantToTypes = useMemo(() => {
        const result: Record<string, number> = {}
        Object.entries(defensiveEffectiveness).forEach(([type, mult]) => {
            if (mult < 1 && mult > 0) {
                result[type] = mult === 0.25 ? 2 : 1
            }
        })
        return result
    }, [defensiveEffectiveness])

    // Get types that have no effect on us
    const noEffectTypes = useMemo(() => {
        return Object.keys(defensiveEffectiveness).filter(
            (type) => defensiveEffectiveness[type] === 0
        )
    }, [defensiveEffectiveness])

    // Render multiplier text with colors
    const renderMultiplierList = (
        counts: Record<string, number>,
        multiplierBase: number, // 2 for strong/weak, 0.5 for resistant
        isOffensive: boolean = false
    ) => {
        const entries = Object.entries(counts)

        if (entries.length === 0) {
            return <span className="text-zinc-500">-</span>
        }

        return (
            <div className="flex flex-wrap gap-2">
                {entries.map(([typeName, count]) => {
                    let multiplierText = ''

                    if (isOffensive) {
                        // Offensive only has x2 (Effective) in this simplified view
                        multiplierText = 'x2'
                    } else {
                        if (multiplierBase >= 1) {
                            // For damage dealt (2x, 4x)
                            if (count === 2) {
                                multiplierText = 'x4'
                            } else {
                                multiplierText = 'x2'
                            }
                        } else {
                            // For resistance (0.5x, 0.25x)
                            if (count === 2) {
                                multiplierText = 'x0.25'
                            } else {
                                multiplierText = 'x0.5'
                            }
                        }
                    }

                    return (
                        <div
                            key={typeName}
                            className={`flex items-center gap-2 rounded-xl border-2 border-zinc-900 dark:border-zinc-50 type-${typeName} px-3 py-1.5 text-sm font-bold text-zinc-50 shadow-none not-dark:invert`}
                        >
                            <div className="flex items-center justify-center rounded-full bg-white/20 p-1">
                                <Image
                                    src={iconElements(typeName)}
                                    alt={typeName}
                                    width={16}
                                    height={16}
                                />
                            </div>
                            <span className="capitalize">{t(typeName)}</span>
                            <span className="rounded bg-white/30 px-1.5 py-0.5 text-xs text-white">
                                {multiplierText}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="page-layout flex-col gap-6">
            <div className="w-full max-w-5xl"><PageBanner path="/calculate" /></div>
            {/* Input Section */}
            <div className="w-full max-w-3xl">
                <div className="flex w-full flex-col items-end gap-4 rounded-xl border-2 border-zinc-900 bg-zinc-50 p-6 shadow-none md:flex-row dark:border-zinc-50 dark:bg-zinc-900">
                    <Autocomplete
                        label={t('SelectPokeElemental')}
                        placeholder="Type 1"
                        size="md"
                        fullWidth
                        variant="bordered"
                        labelPlacement="outside"
                        color="primary"
                        selectedKey={type1}
                        onSelectionChange={(key) =>
                            setType1(key ? key.toString() : '')
                        }
                        inputProps={{
                            classNames: {
                                inputWrapper:
                                    'border-2 border-zinc-900 dark:border-zinc-50 shadow-none bg-zinc-50 dark:bg-zinc-900',
                            },
                        }}
                    >
                        {poke.map((e) => (
                            <AutocompleteItem
                                key={e.name}
                                startContent={icon2TagSvg(e.name, 20)}
                            >
                                {t(e.name)}
                            </AutocompleteItem>
                        ))}
                    </Autocomplete>

                    <Autocomplete
                        label={`${t('SelectPokeElemental')} 2 (${t('optional')})`}
                        placeholder="Type 2"
                        size="md"
                        fullWidth
                        variant="bordered"
                        labelPlacement="outside"
                        color="primary"
                        selectedKey={type2}
                        onSelectionChange={(key) =>
                            setType2(key ? key.toString() : '')
                        }
                        inputProps={{
                            classNames: {
                                inputWrapper:
                                    'border-2 border-zinc-900 dark:border-zinc-50 shadow-none bg-zinc-50 dark:bg-zinc-900',
                            },
                        }}
                    >
                        {poke.map((e) => (
                            <AutocompleteItem
                                key={e.name}
                                startContent={icon2TagSvg(e.name, 20)}
                            >
                                {t(e.name)}
                            </AutocompleteItem>
                        ))}
                    </Autocomplete>

                    <Tooltip content={t('reset')} color="primary" delay={500}>
                        <Button
                            isIconOnly
                            className="h-14 w-14 shrink-0 rounded-xl border-2 border-zinc-900 bg-zinc-900 text-zinc-50 shadow-none dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                            onPress={handleReset}
                        >
                            <RefreshCcw size={20} />
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Results Section */}
            {type1.length > 1 && (
                <div className="grid w-full max-w-5xl gap-6 md:grid-cols-2">
                    {/* Attacking Card */}
                    <div className="flex flex-col gap-4 rounded-xl border-2 border-zinc-900 bg-zinc-50 p-6 shadow-none dark:border-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2 dark:border-zinc-50">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                {t('attacking')}
                            </h2>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-zinc-500">
                                {t('strong')} (x2)
                            </span>
                            {renderMultiplierList(strongAgainstTypes, 2, true)}
                        </div>
                    </div>

                    {/* Defending Card */}
                    <div className="flex flex-col gap-4 rounded-xl border-2 border-zinc-900 bg-zinc-50 p-6 shadow-none dark:border-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2 dark:border-zinc-50">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                {t('defending')}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-zinc-500">
                                    {t('weak')} (x2, x4)
                                </span>
                                {renderMultiplierList(weakToTypes, 2)}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-zinc-500">
                                    {t('resistant')} (x0.5, x0.25)
                                </span>
                                {renderMultiplierList(resistantToTypes, 0.5)}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-zinc-500">
                                    {t('noEffectFrom')} (x0)
                                </span>
                                {noEffectTypes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {noEffectTypes.map((typeName) => (
                                            <div
                                                key={typeName}
                                                className={`flex items-center gap-2 rounded-xl border-2 border-zinc-900 dark:border-zinc-50 type-${typeName} px-3 py-1.5 text-sm font-bold text-zinc-50 shadow-none`}
                                            >
                                                <div className="flex items-center justify-center rounded-full bg-white/20 p-1">
                                                    <Image
                                                        src={iconElements(
                                                            typeName
                                                        )}
                                                        alt={typeName}
                                                        width={16}
                                                        height={16}
                                                    />
                                                </div>
                                                <span className="capitalize">
                                                    {t(typeName)}
                                                </span>
                                                <span className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-white">
                                                    x0
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-zinc-500">-</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CalculateType
