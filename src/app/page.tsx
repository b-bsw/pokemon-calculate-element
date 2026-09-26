'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Search, Sparkles, Zap } from 'lucide-react'
import { useTranslate } from '@/i18n/i18nContext'
import { items } from '@/utils/itemIconList'

export default function Home() {
    const { t, lang } = useTranslate()
    const router = useRouter()
    const [query, setQuery] = useState('')

    function searchPokemon(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        router.push(`/pokemon${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
    }

    return <main className="home-page">
        <div className="home-orbit orbit-one" aria-hidden="true" />
        <div className="home-orbit orbit-two" aria-hidden="true" />
        <div className="home-content">
            <section className="home-hero" aria-labelledby="home-title">
                <div className="hero-copy">
                    <div className="eyebrow"><span className="status-dot" /> {lang === 'th' ? 'คู่มือสำหรับเทรนเนอร์' : 'THE TRAINER’S FIELD GUIDE'} <span className="eyebrow-line" /></div>
                    <h1 id="home-title">{lang === 'th' ? <>รู้จักทุกตัว<br /><em>ชนะทุกทาง</em></> : <>Know every Pokémon.<br /><em>Find your edge.</em></>}</h1>
                    <p>{lang === 'th' ? 'ค้นหาโปเกมอน เช็กธาตุ ท่าโจมตี และไอเทมที่ต้องใช้ ทั้งหมดในที่เดียว' : 'Pokémon, moves, type matchups, and held items. Everything you need, one search away.'}</p>
                    <form className="hero-search" onSubmit={searchPokemon} role="search">
                        <Search size={20} aria-hidden="true" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === 'th' ? 'ค้นหาชื่อหรือหมายเลขโปเกมอน' : 'Search Pokémon by name or number'} aria-label={t('searchNameOrNumber')} />
                        <button type="submit" aria-label={lang === 'th' ? 'ค้นหาโปเกมอน' : 'Search Pokémon'}><ArrowRight size={21} /></button>
                    </form>
                    <div className="hero-hint"><Sparkles size={14} /> {lang === 'th' ? 'ลองค้นหา' : 'TRY SEARCHING'} <Link href="/pokemon?q=pikachu">Pikachu</Link><span>·</span><Link href="/pokemon?q=charizard">Charizard</Link><span>·</span><Link href="/pokemon?q=0025">#025</Link></div>
                </div>
                <div className="hero-visual" aria-hidden="true">
                    <div className="visual-grid" />
                    <div className="visual-ring ring-outer" />
                    <div className="visual-ring ring-inner" />
                    <div className="visual-ball"><div className="ball-top" /><div className="ball-center"><div /></div><div className="ball-bottom" /></div>
                    <div className="visual-label label-top">POKÉDEX <strong>001—∞</strong></div>
                    <div className="visual-label label-bottom"><Zap size={14} /> READY TO EXPLORE</div>
                    <div className="visual-cross cross-one">+</div><div className="visual-cross cross-two">+</div>
                </div>
            </section>
            <section className="explore-section" aria-labelledby="explore-title">
                <div className="section-heading"><div><span className="section-kicker">01 / EXPLORE</span><h2 id="explore-title">{lang === 'th' ? 'เลือกสิ่งที่ต้องการหา' : 'Where do you want to go?'}</h2></div><p>{lang === 'th' ? 'ข้อมูลพร้อมใช้สำหรับทุกการเดินทาง' : 'The right data for every part of your journey.'}</p></div>
                <div className="feature-grid">
                    {items.map((item, index) => {
                        const Icon = item.icon
                        const descriptions: Record<string, [string, string]> = {
                            '/pokemon': ['ค้นหาข้อมูลและค่าสถานะของโปเกมอน', 'Explore Pokémon, stats, and evolutions'],
                            '/moves': ['ดูพลัง ความแม่นยำ และรายละเอียดท่า', 'Check power, accuracy, and move details'],
                            '/items': ['ค้นหาไอเทมและผลการใช้งาน', 'Find held items and their effects'],
                            '/calculate': ['คำนวณแพ้ชนะจากธาตุที่เลือก', 'Calculate strengths and weaknesses'],
                            '/elements': ['ดูความสัมพันธ์ของทั้ง 18 ธาตุ', 'Explore all 18 type matchups'],
                            '/nature': ['ดู Nature ที่เพิ่มและลดค่าสถานะ', 'Find nature stat boosts and reductions'],
                        }
                        return <Link key={item.path} href={item.path} className={`feature-card feature-${index + 1}`}>
                            <span className="feature-index">{String(index + 1).padStart(2, '0')} / 06</span>
                            <span className="feature-icon"><Icon size={27} strokeWidth={1.8} /></span>
                            <span className="feature-title">{t(item.nameTrans)}</span>
                            <span className="feature-description">{descriptions[item.path][lang === 'th' ? 0 : 1]}</span>
                            <span className="feature-arrow"><ArrowRight size={18} /></span>
                        </Link>
                    })}
                </div>
            </section>
            <footer className="home-footer"><span>POKÉ ATLAS © 2026</span><span>{lang === 'th' ? 'สร้างเพื่อเหล่าเทรนเนอร์' : 'MADE FOR TRAINERS EVERYWHERE'}</span></footer>
        </div>
    </main>
}
