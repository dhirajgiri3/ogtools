import { NextRequest, NextResponse } from 'next/server';
import { ScheduledConversation, Persona } from '@/core/types';
import { validateSafety } from '@/core/algorithms/safety/validator';

/**
 * POST /api/validate
 * 
 * Safety validation endpoint for re-validation after edits.
 * Used when user edits conversations in the dashboard.
 */

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();

        // Convert date strings back to Date objects
        const conversations = (body.conversations || []).map((conv: any) => ({
            ...conv,
            scheduledTime: new Date(conv.scheduledTime),
            commentTimings: (conv.commentTimings || []).map((t: string) => new Date(t)),
            replyTimings: (conv.replyTimings || []).map((t: string) => new Date(t))
        })) as ScheduledConversation[];

        const personas = body.personas as Persona[];

        // Validate input
        if (!conversations || !Array.isArray(conversations)) {
            return NextResponse.json(
                { error: 'Missing or invalid conversations array' },
                { status: 400 }
            );
        }

        if (!personas || !Array.isArray(personas)) {
            return NextResponse.json(
                { error: 'Missing or invalid personas array' },
                { status: 400 }
            );
        }

        // Run safety validation
        const safetyReport = validateSafety(conversations, personas);

        return NextResponse.json(safetyReport);

    } catch (error) {
        console.error('Validation error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error during validation',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'POST to this endpoint with conversations and personas to validate safety' },
        { status: 200 }
    );
}
