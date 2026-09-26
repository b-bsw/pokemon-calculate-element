import TableNature from '@/components/table/TableNature'
import PageBanner from '@/components/PageBanner'

const Page = () => {
    return (
        <div className="page-layout">
            <div className="page-panel max-w-5xl">
                <PageBanner path="/nature" />
                <TableNature />
            </div>
        </div>
    )
}

export default Page
