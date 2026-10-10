import { notFound } from 'next/navigation';
import { PuaSpecSheet } from '@/components/pua-spec-sheet';
import { rolesData, RoleId } from '@/data/recruitment/roles';

/**
 * Shared page composition for the role spec-sheet routes.
 * Serves both /specs/[role] and /recruitment/specs/[role].
 */
export function roleSpecParams() {
    return Object.keys(rolesData).map((role) => ({
        role: role,
    }));
}

export async function RoleSpecPage({ role }: { role: string }) {
    const roleKey = role as RoleId;
    const data = rolesData[roleKey];

    if (!data) {
        notFound();
    }

    return <PuaSpecSheet data={data} />;
}
