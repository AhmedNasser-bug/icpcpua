import { notFound } from 'next/navigation';
import { PuaSpecSheet } from '@/components/pua-spec-sheet';
import { rolesData, RoleId } from '@/data/recruitment/roles';

interface PageProps {
    params: {
        role: string;
    };
}

export function generateStaticParams() {
    return Object.keys(rolesData).map((role) => ({
        role: role,
    }));
}

export default function SpecSheetPage({ params }: PageProps) {
    const roleKey = params.role as RoleId;
    const data = rolesData[roleKey];

    if (!data) {
        notFound();
    }

    return <PuaSpecSheet data={data} />;
}
