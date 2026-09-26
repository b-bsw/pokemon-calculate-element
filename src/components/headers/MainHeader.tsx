'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useTranslate } from '@/i18n/i18nContext'
import useDarkMode from '@/hooks/useDarkMode'
import { items } from '@/utils/itemIconList'

export default function MainHeader() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)
    const { t, lang, setLang } = useTranslate()
    const { theme, setTheme } = useDarkMode()

    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link href="/" className="brand" onClick={() => setMenuOpen(false)} aria-label="Pokémon Atlas home">
                    <span className="brand-mark" aria-hidden="true"><span /></span>
                    <span className="brand-copy"><strong>POKÉ ATLAS</strong><small>FIELD GUIDE / 001</small></span>
                </Link>
                <nav className="desktop-nav" aria-label={lang === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
                    {items.map((item) => {
                        const Icon = item.icon
                        const active = pathname === item.path || pathname.startsWith(`${item.path}/`)
                        return <Link key={item.path} href={item.path} className={`nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                            <Icon size={16} strokeWidth={2} /><span>{t(item.nameTrans)}</span>
                        </Link>
                    })}
                </nav>
                <div className="header-actions">
                    <div className="language-switch" role="group" aria-label={t('language.switch')}>
                        <button type="button" className={lang === 'th' ? 'selected' : ''} onClick={() => setLang('th')} aria-pressed={lang === 'th'}>TH</button>
                        <button type="button" className={lang === 'en' ? 'selected' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
                    </div>
                    <button type="button" className="icon-action" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button type="button" className="icon-action menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
            {menuOpen && <nav className="mobile-nav" aria-label={lang === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
                {items.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.path || pathname.startsWith(`${item.path}/`)
                    return <Link key={item.path} href={item.path} onClick={() => setMenuOpen(false)} className={`mobile-nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                        <Icon size={19} /><span>{t(item.nameTrans)}</span><span aria-hidden="true">↗</span>
                    </Link>
                })}
            </nav>}
        </header>
    )
}
