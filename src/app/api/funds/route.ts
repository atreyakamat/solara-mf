import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const riskLevel = searchParams.get('riskLevel');
        const minRating = searchParams.get('minRating');

        let query = db.select().from(funds);
        const conditions = [];

        if (search) {
            conditions.push(sql`(${funds.name} ILIKE ${`%${search}%`} OR ${funds.amc} ILIKE ${`%${search}%`})`);
        }
        if (category && category !== 'All') {
            conditions.push(eq(funds.category, category));
        }
        if (riskLevel && riskLevel !== 'All') {
            conditions.push(eq(funds.riskLevel, riskLevel));
        }
        if (minRating) {
            conditions.push(sql`${funds.rating} >= ${Number(minRating)}`);
        }

        let result;
        if (conditions.length > 0) {
            result = await query.where(sql.join(conditions, sql` AND `));
        } else {
            result = await query;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching funds:', error);
        return NextResponse.json({ message: 'Failed to fetch funds' }, { status: 500 });
    }
}
