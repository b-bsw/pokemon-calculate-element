'use client'

import { useTranslate } from '@/i18n/i18nContext'
import { items } from '@/utils/itemIconList'

const copy: Record<string, [string, string]> = {
    '/pokemon': ['ค้นหาข้อมูล ค่าสถานะ และสายวิวัฒนาการ', 'Find Pokémon, stats, and evolutions'],
    '/moves': ['ค้นหาท่าโจมตีและดูรายละเอียดที่จำเป็น', 'Search moves and compare the details that matter'],
    '/items': ['สำรวจไอเทมถือและผลการใช้งาน', 'Explore held items and their effects'],
    '/calculate': ['เลือกธาตุเพื่อดูจุดแข็งและจุดอ่อนทันที', 'Choose types to reveal strengths and weaknesses'],
    '/elements': ['ดูความสัมพันธ์ของทั้ง 18 ธาตุในที่เดียว', 'Explore matchups across all 18 types'],
    '/nature': ['ดู Nature ที่เพิ่มและลดค่าสถานะ', 'Find the nature for the stats you need'],
}

export default function PageBanner({ path }: { path: string }) {
    const { lang, t } = useTranslate()
    const item = items.find((entry) => entry.path === path)
    if (!item) return null
    const Icon = item.icon
    return <div className="page-banner">
        <div className="page-banner-icon"><Icon size={24} strokeWidth={1.8} /></div>
        <div><span className="page-banner-kicker">POKÉ ATLAS / {String(item.id).padStart(2, '0')}</span><h1>{t(item.nameTrans)}</h1><p>{copy[path][lang === 'th' ? 0 : 1]}</p></div>
    </div>
}
