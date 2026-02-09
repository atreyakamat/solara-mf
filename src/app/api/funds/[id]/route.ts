import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const fundId = Number(id);

        const [fund] = await db.select().from(funds).where(eq(funds.id, fundId));

        if (!fund) {
            return NextResponse.json({ message: 'Fund not found' }, { status: 404 });
        }

        return NextResponse.json(fund);
    } catch (error) {
        console.error('Error fetching fund:', error);
        return NextResponse.json({ message: 'Failed to fetch fund' }, { status: 500 });
    }
}
