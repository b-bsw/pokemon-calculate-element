'use client'

import axios from 'axios'
import { useEffect, useState, useMemo } from 'react'
import { useTranslate } from '@/i18n/i18nContext'
import {
    Card,
    CardBody,
    Spinner,
    Progress,
    Chip,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Divider,
    Tabs,
    Tab,
} from '@heroui/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import iconElements from '@/components/icons'
import { ArrowLeft, ArrowRight, Swords, Target, Zap } from 'lucide-react'

// Valid Pokemon types that exist in the project
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

type MoveDetail = {
    name: string
    type: { name: string }
    damage_class: { name: string }
    power: number | null
    accuracy: number | null
    pp: number
    effect_entries: {
        effect: string
        short_effect: string
        language: { name: string }
    }[]
    flavor_text_entries: { flavor_text: string; language: { name: string } }[]
}

type AbilityDetail = {
    name: string
    effect_entries: {
        effect: string
        short_effect: string
        language: { name: string }
    }[]
    flavor_text_entries: {
        flavor_text: string
        language: { name: string }
        version_group: { name: string }
    }[]
    generation: { name: string }
    pokemon: { is_hidden: boolean; pokemon: { name: string } }[]
}

// Type colors for the banner gradient
const TYPE_COLORS: Record<string, string> = {
    normal: '#a0a29f',
    fire: '#fba54c',
    water: '#539ddf',
    electric: '#f2d94e',
    grass: '#5fbd58',
    ice: '#75d0c1',
    fighting: '#d3425f',
    poison: '#b763cf',
    ground: '#da7c4d',
    flying: '#a1bbec',
    psychic: '#fa8581',
    bug: '#92bc2c',
    rock: '#c9bb8a',
    ghost: '#5f6dbc',
    dragon: '#0c69c8',
    dark: '#595761',
    steel: '#5695a3',
    fairy: '#ee90e6',
}

type VersionGroupDetail = {
    level_learned_at: number
    move_learn_method: {
        name: string
        url: string
    }
    version_group: {
        name: string
        url: string
    }
}

type PokemonMove = {
    move: {
        name: string
        url: string
    }
    version_group_details: VersionGroupDetail[]
}

type PokemonData = {
    abilities: {
        ability: {
            name: string
            url: string
        }
        is_hidden: boolean
        slot: number
    }[]
    id: number
    name: string
    moves: PokemonMove[]
    species: {
        name: string
        url: string
    }
    sprites: {
        front_default: string
        other: {
            'official-artwork': {
                front_default: string
            }
            dream_world: {
                front_default: string
            }
        }
    }
    stats: {
        base_stat: number
        effort: number
        stat: {
            name: string
            url: string
        }
    }[]
    types: {
        slot: number
        type: {
            name: string
            url: string
        }
    }[]
}

type MoveWithDetails = {
    name: string
    url: string
    type: string
    damageClass: string
    power: number | null
    accuracy: number | null
    learnMethod: string
    levelLearnedAt: number
}

type EvolutionMember = {
    name: string
    image: string
    types: string[]
    id: number
    minLevel?: number | null
    trigger?: string
    item?: string
    heldItem?: string
    knownMove?: string
    knownMoveType?: string
    location?: string
    minHappiness?: number | null
    minBeauty?: number | null
    minAffection?: number | null
    needsOverworldRain?: boolean
    partySpecies?: string
    partyType?: string
    relativePhysicalStats?: number | null
    timeOfDay?: string
    tradeSpecies?: string
    turnUpsideDown?: boolean
}

const statColors: Record<string, string> = {
    hp: 'danger',
    attack: 'warning',
    defense: 'primary',
    'special-attack': 'secondary',
    'special-defense': 'success',
    speed: 'default',
}

const statNames: Record<string, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SP.ATK',
    'special-defense': 'SP.DEF',
    speed: 'SPD',
}

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

export default function PokemonDetail({
    pokeName = 'none',
}: {
    pokeName: string
}) {
    const [pokemonData, setPokemonData] = useState<PokemonData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [movesWithDetails, setMovesWithDetails] = useState<MoveWithDetails[]>(
        []
    )
    const [isLoadingMoves, setIsLoadingMoves] = useState(false)
    const [selectedMove, setSelectedMove] = useState<MoveDetail | null>(null)
    const [isLoadingMoveDetail, setIsLoadingMoveDetail] = useState(false)
    const [selectedTab, setSelectedTab] = useState<string>('level-up')
    const [evolutionChain, setEvolutionChain] = useState<EvolutionMember[]>([])
    const [isLoadingEvolutions, setIsLoadingEvolutions] = useState(false)

    // Ability modal state
    const [selectedAbility, setSelectedAbility] =
        useState<AbilityDetail | null>(null)
    const [isLoadingAbility, setIsLoadingAbility] = useState(false)

    const { t } = useTranslate()
    const router = useRouter()

    // Move modal disclosure
    const {
        isOpen: isMoveModalOpen,
        onOpen: onMoveModalOpen,
        onOpenChange: onMoveModalOpenChange,
    } = useDisclosure()
    // Ability modal disclosure
    const {
        isOpen: isAbilityModalOpen,
        onOpen: onAbilityModalOpen,
        onOpenChange: onAbilityModalOpenChange,
    } = useDisclosure()

    const fetchPokeData = async () => {
        try {
            setIsLoading(true)
            setError(null)
            setEvolutionChain([]) // Clear old evolution chain
            const response = await axios.get(
                `https://pokeapi.co/api/v2/pokemon/${pokeName.toLowerCase()}`
            )
            setPokemonData(response.data)
        } catch (err) {
            console.error(err)
            setError('Pokemon not found')
        } finally {
            setIsLoading(false)
        }
    }

    // Get learn method info from version_group_details (prefer latest version)
    const getLearnMethodInfo = (details: VersionGroupDetail[]) => {
        // Find level-up method first
        const levelUp = details.find(
            (d) => d.move_learn_method.name === 'level-up'
        )
        if (levelUp) {
            return {
                method: 'level-up',
                level: levelUp.level_learned_at,
            }
        }
        // Then machine/TM
        const machine = details.find(
            (d) => d.move_learn_method.name === 'machine'
        )
        if (machine) {
            return {
                method: 'machine',
                level: 0,
            }
        }
        // Other methods (egg, tutor, etc.)
        const other = details[0]
        return {
            method: other?.move_learn_method.name || 'other',
            level: other?.level_learned_at || 0,
        }
    }

    // Fetch move details for all moves
    const fetchMovesDetails = async (moves: PokemonMove[]) => {
        setIsLoadingMoves(true)
        try {
            const moveDetailsPromises = moves.map(async (move) => {
                try {
                    const response = await axios.get(move.move.url)
                    const learnInfo = getLearnMethodInfo(
                        move.version_group_details
                    )
                    return {
                        name: move.move.name,
                        url: move.move.url,
                        type: response.data.type?.name || 'normal',
                        damageClass:
                            response.data.damage_class?.name || 'status',
                        power: response.data.power,
                        accuracy: response.data.accuracy,
                        learnMethod: learnInfo.method,
                        levelLearnedAt: learnInfo.level,
                    }
                } catch {
                    const learnInfo = getLearnMethodInfo(
                        move.version_group_details
                    )
                    return {
                        name: move.move.name,
                        url: move.move.url,
                        type: 'normal',
                        damageClass: 'status',
                        power: null,
                        accuracy: null,
                        learnMethod: learnInfo.method,
                        levelLearnedAt: learnInfo.level,
                    }
                }
            })
            const details = await Promise.all(moveDetailsPromises)
            setMovesWithDetails(details)
        } catch (err) {
            console.error('Error fetching move details:', err)
        } finally {
            setIsLoadingMoves(false)
        }
    }

    // Fetch single move detail for modal
    const fetchMoveDetail = async (url: string) => {
        setIsLoadingMoveDetail(true)
        try {
            const response = await axios.get(url)
            setSelectedMove(response.data)
            onMoveModalOpen()
        } catch (err) {
            console.error('Error fetching move detail:', err)
        } finally {
            setIsLoadingMoveDetail(false)
        }
    }

    // Fetch ability detail for modal
    const fetchAbilityDetail = async (url: string) => {
        setIsLoadingAbility(true)
        try {
            const response = await axios.get(url)
            setSelectedAbility(response.data)
            onAbilityModalOpen()
        } catch (err) {
            console.error('Error fetching ability detail:', err)
        } finally {
            setIsLoadingAbility(false)
        }
    }

    const fetchEvolutionChain = async (speciesUrl: string) => {
        setIsLoadingEvolutions(true)
        try {
            const speciesRes = await axios.get(speciesUrl)
            const chainUrl = speciesRes.data.evolution_chain.url
            const chainRes = await axios.get(chainUrl)

            const chain: EvolutionMember[] = []

            const processChain = async (evoData: any) => {
                try {
                    const pokeRes = await axios.get(
                        `https://pokeapi.co/api/v2/pokemon/${evoData.species.name}`
                    )
                    const details = evoData.evolution_details[0]

                    chain.push({
                        name: evoData.species.name,
                        id: pokeRes.data.id,
                        image:
                            pokeRes.data.sprites.other?.['official-artwork']
                                ?.front_default ||
                            pokeRes.data.sprites.front_default,
                        types: pokeRes.data.types.map((t: any) => t.type.name),
                        minLevel: details?.min_level,
                        trigger: details?.trigger?.name,
                        item: details?.item?.name,
                        heldItem: details?.held_item?.name,
                        knownMove: details?.known_move?.name,
                        knownMoveType: details?.known_move_type?.name,
                        location: details?.location?.name,
                        minHappiness: details?.min_happiness,
                        minBeauty: details?.min_beauty,
                        minAffection: details?.min_affection,
                        needsOverworldRain: details?.needs_overworld_rain,
                        partySpecies: details?.party_species?.name,
                        partyType: details?.party_type?.name,
                        relativePhysicalStats: details?.relative_physical_stats,
                        timeOfDay: details?.time_of_day,
                        tradeSpecies: details?.trade_species?.name,
                        turnUpsideDown: details?.turn_upside_down,
                    })

                    if (evoData.evolves_to && evoData.evolves_to.length > 0) {
                        // We process all branches
                        for (const nextEvo of evoData.evolves_to) {
                            await processChain(nextEvo)
                        }
                    }
                } catch (err) {
                    console.error(
                        `Error fetching pokemon data for ${evoData.species.name}:`,
                        err
                    )
                }
            }

            await processChain(chainRes.data.chain)
            setEvolutionChain(chain)
        } catch (err) {
            console.error('Error fetching evolution chain:', err)
        } finally {
            setIsLoadingEvolutions(false)
        }
    }

    // Get English effect text for ability
    const getAbilityEnglishEffect = (ability: AbilityDetail) => {
        const entry = ability.effect_entries?.find(
            (e) => e.language.name === 'en'
        )
        return (
            entry?.short_effect || entry?.effect || 'No description available.'
        )
    }

    // Get English flavor text for ability
    const getAbilityFlavorText = (ability: AbilityDetail) => {
        const entry = ability.flavor_text_entries?.find(
            (e) => e.language.name === 'en'
        )
        return entry?.flavor_text?.replace(/\n/g, ' ') || ''
    }

    useEffect(() => {
        if (pokeName !== 'none') {
            fetchPokeData()
        }
    }, [pokeName])

    useEffect(() => {
        if (pokemonData?.moves) {
            fetchMovesDetails(pokemonData.moves)
        }
        if (pokemonData?.species?.url) {
            fetchEvolutionChain(pokemonData.species.url)
        }
    }, [pokemonData])

    const formatEvolutionDetail = (member: EvolutionMember) => {
        const details = []
        if (member.trigger === 'level-up') {
            if (member.minLevel) details.push(`Lv. ${member.minLevel}`)
            if (member.minHappiness)
                details.push(
                    `${t('happiness') || 'Happiness'} ${member.minHappiness}`
                )
            if (member.minAffection)
                details.push(
                    `${t('affection') || 'Affection'} ${member.minAffection}`
                )
            if (member.minBeauty)
                details.push(`${t('beauty') || 'Beauty'} ${member.minBeauty}`)
            if (member.heldItem)
                details.push(
                    `${t('hold') || 'Hold'} ${member.heldItem.replace(/-/g, ' ')}`
                )
            if (member.knownMove)
                details.push(
                    `${t('know') || 'Know'} ${member.knownMove.replace(/-/g, ' ')}`
                )
            if (member.knownMoveType)
                details.push(
                    `${t('know') || 'Know'} ${member.knownMoveType} ${t('type') || 'type'}`
                )
            if (member.location)
                details.push(
                    `${t('at') || 'At'} ${member.location.replace(/-/g, ' ')}`
                )
            if (member.timeOfDay) details.push(`${member.timeOfDay}`)
            if (member.needsOverworldRain) details.push(t('rain') || 'Rain')
            if (member.turnUpsideDown)
                details.push(t('upsideDown') || 'Upside down')
            if (
                member.relativePhysicalStats !== null &&
                member.relativePhysicalStats !== undefined
            ) {
                if (member.relativePhysicalStats === 1)
                    details.push('Atk > Def')
                else if (member.relativePhysicalStats === -1)
                    details.push('Atk < Def')
                else if (member.relativePhysicalStats === 0)
                    details.push('Atk = Def')
            }
        } else if (member.trigger === 'use-item') {
            if (member.item) details.push(member.item.replace(/-/g, ' '))
        } else if (member.trigger === 'trade') {
            details.push(t('trade') || 'Trade')
            if (member.tradeSpecies)
                details.push(`${t('with') || 'with'} ${member.tradeSpecies}`)
            if (member.heldItem)
                details.push(
                    `${t('holding') || 'holding'} ${member.heldItem.replace(/-/g, ' ')}`
                )
        } else if (member.trigger === 'shed') {
            details.push(t('shed') || 'Shed')
        }

        return details.length > 0
            ? details.join(' + ')
            : member.trigger?.replace(/-/g, ' ')
    }

    const formatPokemonId = (id: number) => {
        return `#${id.toString().padStart(4, '0')}`
    }

    // Filter types to only include valid ones
    const getValidTypes = (types: PokemonData['types']) => {
        return types.filter((typeInfo) =>
            VALID_TYPES.includes(typeInfo.type.name.toLowerCase())
        )
    }

    // Group moves by learn method
    const { levelUpMoves, tmMoves, otherMoves } = useMemo(() => {
        const levelUp: MoveWithDetails[] = []
        const tm: MoveWithDetails[] = []
        const other: MoveWithDetails[] = []

        movesWithDetails.forEach((move) => {
            if (move.learnMethod === 'level-up') {
                levelUp.push(move)
            } else if (move.learnMethod === 'machine') {
                tm.push(move)
            } else {
                other.push(move)
            }
        })

        // Sort level-up by level
        levelUp.sort((a, b) => a.levelLearnedAt - b.levelLearnedAt)

        // Sort TM by name
        tm.sort((a, b) => a.name.localeCompare(b.name))

        // Sort other by name
        other.sort((a, b) => a.name.localeCompare(b.name))

        return { levelUpMoves: levelUp, tmMoves: tm, otherMoves: other }
    }, [movesWithDetails])

    // Get English effect text
    const getEnglishEffect = (move: MoveDetail) => {
        const entry = move.effect_entries?.find((e) => e.language.name === 'en')
        return (
            entry?.short_effect || entry?.effect || 'No description available.'
        )
    }

    // Get English flavor text
    const getEnglishFlavorText = (move: MoveDetail) => {
        const entry = move.flavor_text_entries?.find(
            (e) => e.language.name === 'en'
        )
        return entry?.flavor_text?.replace(/\n/g, ' ') || ''
    }

    // Render move item
    const renderMoveItem = (
        move: MoveWithDetails,
        showLevel: boolean = false
    ) => (
        <button
            key={move.name}
            onClick={() => fetchMoveDetail(move.url)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
            {/* Level (for level-up moves) */}
            {showLevel && (
                <div className="w-12 shrink-0 text-center">
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        Lv.
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-50">
                        {move.levelLearnedAt || '-'}
                    </span>
                </div>
            )}

            {/* Type Icon */}
            <div className={`shrink-0 rounded-full p-1.5 type-${move.type}`}>
                {VALID_TYPES.includes(move.type.toLowerCase()) && (
                    <Image
                        src={iconElements(move.type)}
                        alt={move.type}
                        width={18}
                        height={18}
                    />
                )}
            </div>

            {/* Move Name */}
            <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 capitalize dark:text-zinc-50">
                {move.name.replace(/-/g, ' ')}
            </span>

            {/* Damage Class */}
            <Chip
                size="sm"
                variant="flat"
                className={`${damageClassColors[move.damageClass]} shrink-0 capitalize`}
                startContent={damageClassIcons[move.damageClass]}
            >
                <span className="hidden sm:inline">{move.damageClass}</span>
            </Chip>

            {/* Power */}
            <div className="w-12 shrink-0 text-center">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    PWR
                </span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-50">
                    {move.power ?? '-'}
                </span>
            </div>

            {/* Accuracy */}
            <div className="w-12 shrink-0 text-center">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    ACC
                </span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-50">
                    {move.accuracy ? `${move.accuracy}` : '-'}
                </span>
            </div>
        </button>
    )

    if (isLoading) {
        return (
            <div className="flex w-full flex-1 items-start justify-center py-8 md:items-center md:py-4">
                <Spinner size="lg" color="primary" />
            </div>
        )
    }

    if (error || !pokemonData) {
        return (
            <div className="flex w-full flex-1 flex-col items-start justify-center gap-4 py-8 md:items-center md:py-4">
                <p className="text-xl text-zinc-500 dark:text-zinc-400">
                    {error || 'Pokemon not found'}
                </p>
                <Button
                    color="primary"
                    variant="ghost"
                    onPress={() => router.back()}
                    startContent={<ArrowLeft size={18} />}
                >
                    {t('back') || 'Go Back'}
                </Button>
            </div>
        )
    }

    const validTypes = getValidTypes(pokemonData.types)
    const mainType = validTypes[0]?.type.name || 'normal'
    const pokemonImage =
        pokemonData.sprites.other?.['official-artwork']?.front_default ||
        pokemonData.sprites.other?.dream_world?.front_default ||
        pokemonData.sprites.front_default

    return (
        <>
            <div className="detail-layout w-full max-w-5xl flex-1 px-4 py-8">
                {/* Main Card */}
                <Card className="border-2 border-zinc-900 bg-zinc-50 shadow-none dark:border-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden">
                    <CardBody className="p-0">
                        {/* Header with black-white background */}
                        <div
                            className="relative overflow-hidden rounded-t-xl p-6 bg-zinc-900 dark:bg-zinc-50"
                            style={{ minHeight: '200px' }}
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent" />

                            {/* Pokemon ID and Name */}
                            <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-zinc-50 dark:text-zinc-900">
                                        {formatPokemonId(pokemonData.id)}
                                    </p>
                                    <h1 className="text-3xl font-bold text-zinc-50 capitalize dark:text-zinc-900 md:text-4xl">
                                        {pokemonData.name}
                                    </h1>

                                    {/* Types - Only show valid types */}
                                    <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                                        {validTypes.map((typeInfo) => (
                                            <Chip
                                                key={typeInfo.type.name}
                                                variant="flat"
                                                className="bg-zinc-50/30 text-zinc-50 backdrop-blur-sm"
                                                startContent={
                                                    <Image
                                                        src={iconElements(
                                                            typeInfo.type.name
                                                        )}
                                                        alt={typeInfo.type.name}
                                                        width={16}
                                                        height={16}
                                                    />
                                                }
                                            >
                                                {t(typeInfo.type.name) ||
                                                    typeInfo.type.name}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>

                                {/* Pokemon Image */}
                                <div className="relative mt-4 h-40 w-40 md:mt-0 md:h-48 md:w-48">
                                    {pokemonImage && (
                                        <Image
                                            src={pokemonImage}
                                            alt={pokemonData.name}
                                            fill
                                            className="object-contain drop-shadow-2xl"
                                            priority
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6">
                            {/* Abilities */}
                            <div className="mb-6 rounded-xl border-2 border-zinc-900 bg-zinc-50 p-4 dark:border-zinc-50 dark:bg-zinc-900">
                                <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    {t('abilities') || 'Abilities'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {pokemonData.abilities.map(
                                        (abilityInfo) => (
                                            <Chip
                                                key={abilityInfo.ability.name}
                                                size="sm"
                                                variant={
                                                    abilityInfo.is_hidden
                                                        ? 'bordered'
                                                        : 'solid'
                                                }
                                                color="primary"
                                                className="cursor-pointer capitalize transition-transform hover:scale-105"
                                                onClick={() =>
                                                    fetchAbilityDetail(
                                                        abilityInfo.ability.url
                                                    )
                                                }
                                            >
                                                {isLoadingAbility ? (
                                                    <Spinner
                                                        size="sm"
                                                        color="current"
                                                    />
                                                ) : (
                                                    <>
                                                        {abilityInfo.ability.name.replace(
                                                            /-/g,
                                                            ' '
                                                        )}
                                                        {abilityInfo.is_hidden &&
                                                            ' (Hidden)'}
                                                    </>
                                                )}
                                            </Chip>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Evolution Chain Section */}
                            {!isLoadingEvolutions &&
                                evolutionChain.length > 1 && (
                                    <div className="mb-8">
                                        <h2 className="mb-4 text-xl font-bold text-zinc-800 dark:text-zinc-50">
                                            {t('evolutionChain') ||
                                                'Evolution Chain'}
                                        </h2>
                                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-8 rounded-xl border-2 border-zinc-900 bg-zinc-50 p-6 dark:border-zinc-50 dark:bg-zinc-900">
                                            {evolutionChain.map(
                                                (member, index) => {
                                                    const nextMember =
                                                        evolutionChain[
                                                            index + 1
                                                        ]
                                                    return (
                                                        <div
                                                            key={`${member.id}-${index}`}
                                                            className="flex items-center gap-4"
                                                        >
                                                            <div
                                                                className={`flex cursor-pointer flex-col items-center rounded-xl p-2 transition-transform hover:scale-105 ${member.name === pokemonData.name ? 'bg-primary/10 ring-primary/30 ring-2' : ''}`}
                                                                onClick={() => {
                                                                    if (
                                                                        member.name !==
                                                                        pokemonData.name
                                                                    ) {
                                                                        router.push(
                                                                            `/pokemon/${member.name}`
                                                                        )
                                                                    }
                                                                }}
                                                            >
                                                                <div className="relative mb-2 h-20 w-20">
                                                                    <Image
                                                                        src={
                                                                            member.image
                                                                        }
                                                                        alt={
                                                                            member.name
                                                                        }
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                </div>
                                                                <span className="max-w-20 truncate text-xs font-bold text-zinc-800 capitalize dark:text-zinc-50">
                                                                    {
                                                                        member.name
                                                                    }
                                                                </span>
                                                                <div className="mt-1 flex gap-1">
                                                                    {member.types
                                                                        .filter(
                                                                            (
                                                                                type
                                                                            ) =>
                                                                                VALID_TYPES.includes(
                                                                                    type
                                                                                )
                                                                        )
                                                                        .map(
                                                                            (
                                                                                type
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        type
                                                                                    }
                                                                                    className={`rounded-full p-0.5 type-${type}`}
                                                                                >
                                                                                    <Image
                                                                                        src={iconElements(
                                                                                            type
                                                                                        )}
                                                                                        alt={
                                                                                            type
                                                                                        }
                                                                                        width={
                                                                                            10
                                                                                        }
                                                                                        height={
                                                                                            10
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            )
                                                                        )}
                                                                </div>
                                                            </div>
                                                            {nextMember && (
                                                                <div className="flex flex-col items-center text-zinc-400">
                                                                    <ArrowRight
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                    <span className="mt-1 max-w-20 text-center text-[9px] font-bold capitalize">
                                                                        {formatEvolutionDetail(
                                                                            nextMember
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}

                            {isLoadingEvolutions && (
                                <div className="mb-8">
                                    <h2 className="mb-4 text-xl font-bold text-zinc-800 dark:text-zinc-50">
                                        {t('evolutionChain') ||
                                            'Evolution Chain'}
                                    </h2>
                                    <div className="flex justify-center py-8">
                                        <Spinner size="md" color="primary" />
                                    </div>
                                </div>
                            )}
                            {/* Stats Section */}
                            <div className="mb-6">
                                <h2 className="mb-4 text-xl font-bold text-zinc-800 dark:text-zinc-50">
                                    {t('baseStats') || 'Base Stats'}
                                </h2>
                                <div className="space-y-3">
                                    {pokemonData.stats.map((statInfo) => (
                                        <div
                                            key={statInfo.stat.name}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="w-16 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                                {statNames[
                                                    statInfo.stat.name
                                                ] || statInfo.stat.name}
                                            </span>
                                            <span className="w-10 text-right text-sm font-bold text-zinc-800 dark:text-zinc-50">
                                                {statInfo.base_stat}
                                            </span>
                                            <Progress
                                                value={statInfo.base_stat}
                                                maxValue={255}
                                                color={
                                                    (statColors[
                                                        statInfo.stat.name
                                                    ] as any) || 'default'
                                                }
                                                className="flex-1"
                                                size="sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 dark:border-zinc-600">
                                    <span className="font-medium text-zinc-600 dark:text-zinc-300">
                                        {t('total') || 'Total'}
                                    </span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-50">
                                        {pokemonData.stats.reduce(
                                            (sum, s) => sum + s.base_stat,
                                            0
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Moves Section */}
                            <div>
                                <h2 className="mb-4 text-xl font-bold text-zinc-800 dark:text-zinc-50">
                                    {t('moves') || 'Moves'} (
                                    {pokemonData.moves.length})
                                </h2>

                                {isLoadingMoves ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner size="md" color="primary" />
                                    </div>
                                ) : (
                                    <Tabs
                                        selectedKey={selectedTab}
                                        onSelectionChange={(key) =>
                                            setSelectedTab(key as string)
                                        }
                                        variant="underlined"
                                        color="primary"
                                        classNames={{
                                            base: 'w-full',
                                            tabList: 'gap-0  min-w-full',
                                            tab: 'px-0',
                                        }}
                                    >
                                        <Tab
                                            key="level-up"
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <span>Level Up</span>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                    >
                                                        {levelUpMoves.length}
                                                    </Chip>
                                                </div>
                                            }
                                        >
                                            <div className="scll mt-4 max-h-[400px] space-y-2 overflow-x-hidden overflow-y-auto">
                                                {levelUpMoves.length > 0 ? (
                                                    levelUpMoves.map((move) =>
                                                        renderMoveItem(
                                                            move,
                                                            true
                                                        )
                                                    )
                                                ) : (
                                                    <p className="py-4 text-center text-zinc-500">
                                                        No level-up moves
                                                    </p>
                                                )}
                                            </div>
                                        </Tab>
                                        <Tab
                                            key="tm"
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <span>TM/HM</span>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                    >
                                                        {tmMoves.length}
                                                    </Chip>
                                                </div>
                                            }
                                        >
                                            <div className="scll mt-4 max-h-[400px] space-y-2 overflow-x-hidden overflow-y-auto">
                                                {tmMoves.length > 0 ? (
                                                    tmMoves.map((move) =>
                                                        renderMoveItem(
                                                            move,
                                                            false
                                                        )
                                                    )
                                                ) : (
                                                    <p className="py-4 text-center text-zinc-500">
                                                        No TM/HM moves
                                                    </p>
                                                )}
                                            </div>
                                        </Tab>
                                        <Tab
                                            key="other"
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {t('other') || 'Other'}
                                                    </span>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                    >
                                                        {otherMoves.length}
                                                    </Chip>
                                                </div>
                                            }
                                        >
                                            <div className="scll mt-4 max-h-[400px] space-y-2 overflow-x-hidden overflow-y-auto">
                                                {otherMoves.length > 0 ? (
                                                    otherMoves.map((move) =>
                                                        renderMoveItem(
                                                            move,
                                                            false
                                                        )
                                                    )
                                                ) : (
                                                    <p className="py-4 text-center text-zinc-500">
                                                        No other moves
                                                    </p>
                                                )}
                                            </div>
                                        </Tab>
                                    </Tabs>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Move Detail Modal */}
            <Modal
                isOpen={isMoveModalOpen}
                onOpenChange={onMoveModalOpenChange}
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
                            {isLoadingMoveDetail || !selectedMove ? (
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
                                                className={`rounded-lg p-2 type-${selectedMove.type.name}`}
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
                                                    {
                                                        selectedMove
                                                            .damage_class.name
                                                    }
                                                </Chip>
                                            </div>

                                            {/* Power */}
                                            <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-700">
                                                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {t('power') || 'Power'}
                                                </p>
                                                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-50">
                                                    {selectedMove.power ??
                                                        'N/A'}
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
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* PP */}
                                        <div className="mb-4 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                    PP (Power Points)
                                                </span>
                                                <span className="font-bold text-zinc-800 dark:text-zinc-50">
                                                    {selectedMove.pp}
                                                </span>
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

            {/* Ability Detail Modal */}
            <Modal
                isOpen={isAbilityModalOpen}
                onOpenChange={onAbilityModalOpenChange}
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
                            {isLoadingAbility || !selectedAbility ? (
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
                                                className="rounded-lg p-2"
                                                style={{
                                                    background:
                                                        TYPE_COLORS[mainType] ||
                                                        TYPE_COLORS.normal,
                                                    boxShadow: `0 0 10px ${TYPE_COLORS[mainType] || TYPE_COLORS.normal}50`,
                                                }}
                                            >
                                                <Zap
                                                    size={24}
                                                    className="text-zinc-50"
                                                />
                                            </div>
                                            <span className="text-xl font-bold text-zinc-800 capitalize dark:text-zinc-50">
                                                {selectedAbility.name.replace(
                                                    /-/g,
                                                    ' '
                                                )}
                                            </span>
                                        </div>
                                    </ModalHeader>
                                    <ModalBody>
                                        {/* Generation Info */}
                                        <div className="mb-4 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                    {t('generation') ||
                                                        'Generation'}
                                                </span>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    className="capitalize"
                                                >
                                                    {selectedAbility.generation?.name?.replace(
                                                        /-/g,
                                                        ' '
                                                    ) || 'Unknown'}
                                                </Chip>
                                            </div>
                                        </div>

                                        <Divider className="my-4" />

                                        {/* Effect Description */}
                                        <div>
                                            <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                {t('effect') || 'Effect'}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                                {getAbilityEnglishEffect(
                                                    selectedAbility
                                                )}
                                            </p>
                                        </div>

                                        {/* Flavor Text */}
                                        {getAbilityFlavorText(
                                            selectedAbility
                                        ) && (
                                            <div className="mt-4">
                                                <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                    {t('description') ||
                                                        'Description'}
                                                </h3>
                                                <p className="text-sm text-zinc-500 italic dark:text-zinc-400">
                                                    "
                                                    {getAbilityFlavorText(
                                                        selectedAbility
                                                    )}
                                                    "
                                                </p>
                                            </div>
                                        )}

                                        {/* Pokemon with this ability */}
                                        {selectedAbility.pokemon &&
                                            selectedAbility.pokemon.length >
                                                0 && (
                                                <div className="mt-4">
                                                    <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-50">
                                                        {t(
                                                            'pokemonWithAbility'
                                                        ) ||
                                                            'Pokémon with this ability'}{' '}
                                                        (
                                                        {
                                                            selectedAbility
                                                                .pokemon.length
                                                        }
                                                        )
                                                    </h3>
                                                    <div className="scll flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                                                        {selectedAbility.pokemon
                                                            .slice(0, 20)
                                                            .map((p) => (
                                                                <Chip
                                                                    key={
                                                                        p
                                                                            .pokemon
                                                                            .name
                                                                    }
                                                                    size="sm"
                                                                    variant={
                                                                        p.is_hidden
                                                                            ? 'bordered'
                                                                            : 'flat'
                                                                    }
                                                                    className="text-xs capitalize"
                                                                >
                                                                    {p.pokemon.name.replace(
                                                                        /-/g,
                                                                        ' '
                                                                    )}
                                                                    {p.is_hidden &&
                                                                        ' ★'}
                                                                </Chip>
                                                            ))}
                                                        {selectedAbility.pokemon
                                                            .length > 20 && (
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                className="text-xs"
                                                            >
                                                                +
                                                                {selectedAbility
                                                                    .pokemon
                                                                    .length -
                                                                    20}{' '}
                                                                more
                                                            </Chip>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-zinc-400">
                                                        ★ = Hidden Ability
                                                    </p>
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
