import TablePokemon from '@/components/table/TablePokemon'
import PageBanner from '@/components/PageBanner'

const Page = () => {
    return (
        <div className="page-layout">
            <div className="page-panel max-w-5xl">
                <PageBanner path="/elements" />
                <TablePokemon />
            </div>
        </div>
    )
}

export default Page
