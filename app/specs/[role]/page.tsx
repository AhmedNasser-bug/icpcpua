import { notFound } from 'next/navigation';
import { PuaSpecSheet } from '@/components/pua-spec-sheet';
import { rolesData, RoleId } from '@/data/recruitment/roles';

interface PageProps {
    params: Promise<{
        role: string;
    }>;
}

export function generateStaticParams() {
    return Object.keys(rolesData).map((role) => ({
        role: role,
    }));
}

export default async function SpecSheetPage({ params }: PageProps) {
    const { role } = await params;
    const roleKey = role as RoleId;
    const data = rolesData[roleKey];

    if (!data) {
        notFound();
    }

    return <PuaSpecSheet data={data} />;
}
