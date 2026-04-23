import { notFound } from 'next/navigation';
import { PuaSpecSheet } from '@/components/pua-spec-sheet';
import { rolesData, RoleId } from '@/data/recruitment/roles';

export function generateStaticParams() {
    return Object.keys(rolesData).map((role) => ({
        role: role,
    }));
}

export default async function SpecSheetPage(props: { params: Promise<{ role: string }> }) {
    const params = await props.params;
    const roleKey = params.role as RoleId;
    const data = rolesData[roleKey];

    if (!data) {
        notFound();
    }

    return <PuaSpecSheet data={data} />;
}
