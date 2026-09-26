import type { Metadata, Viewport } from 'next'
import { Prompt } from 'next/font/google'
import { Providers } from './providers'
import MainHeader from '@/components/headers/MainHeader'
import { I18nProvider } from '@/i18n/i18nContext'
import './globals.css'

const prompt = Prompt({
    variable: '--font-prompt',
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['latin', 'thai'],
})

export const metadata: Metadata = {
    title: 'Poké Atlas | คู่มือโปเกมอนสำหรับเทรนเนอร์',
    description: 'ค้นหาโปเกมอน ท่าโจมตี ไอเทม ตารางธาตุ และคำนวณจุดแข็งจุดอ่อนในที่เดียว',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
}

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${prompt.variable} antialiased`}>
                <I18nProvider>
                    <Providers>
                        <div className="min-h-dvh w-full max-w-full">
                            <MainHeader />
                            <div className="app-content flex min-h-[calc(100dvh-76px)] flex-col">
                                {children}
                            </div>
                        </div>
                    </Providers>
                </I18nProvider>
            </body>
        </html>
    )
}
