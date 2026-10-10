import { RoleSpecPage, roleSpecParams } from '@/components/recruitment/RoleSpecPage';

interface PageProps {
    params: Promise<{
        role: string;
    }>;
}

export function generateStaticParams() {
    return roleSpecParams();
}

export default async function SpecSheetPage({ params }: PageProps) {
    const { role } = await params;
    return <RoleSpecPage role={role} />;
}
