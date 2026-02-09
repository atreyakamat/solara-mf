import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are FundFlow AI's investment advisor, an expert on Indian mutual funds. You help users:
- Understand mutual fund concepts (NAV, expense ratio, CAGR, alpha, beta, sharpe ratio, etc.)
- Compare funds and categories (Equity, Debt, Hybrid, ELSS, Index Funds)
- Plan SIP strategies and portfolio allocation
- Evaluate risk and returns
- Understand taxation (STCG, LTCG for equity/debt)

Guidelines:
- Be concise but informative
- Use Indian Rupee and Indian market context
- Suggest diversification when appropriate
- Mention both risks and potential rewards
- Don't give specific buy/sell recommendations, but help users understand their options`;

export async function POST(request: NextRequest) {
    try {
        const { content, context } = await request.json();

        if (!content) {
            return NextResponse.json({ error: 'Message content required' }, { status: 400 });
        }

        // If OpenAI API key not configured, return mock response
        if (!process.env.OPENAI_API_KEY) {
            const encoder = new TextEncoder();
            const mockResponse = getMockResponse(content);

            const stream = new ReadableStream({
                async start(controller) {
                    for (const char of mockResponse) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: char })}\n\n`));
                        await new Promise(r => setTimeout(r, 10));
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                    controller.close();
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                },
            });
        }

        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ];

        if (context) {
            messages.push({ role: 'system', content: `Context: ${context}` });
        }

        messages.push({ role: 'user', content });

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            stream: true,
            max_tokens: 1000,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
    }
}

// Mock responses when OpenAI API key is not configured
function getMockResponse(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('sip') || q.includes('start')) {
        return "Starting a SIP (Systematic Investment Plan) is one of the best ways to build wealth. Here's what you should know:\n\n1. **Start Small**: You can begin with as little as ₹500/month\n2. **Consistency Matters**: Regular investing averages out market volatility\n3. **Choose Diversified Funds**: Consider flexi-cap or large-cap funds for beginners\n4. **Time Horizon**: Longer investment periods (7+ years) typically yield better results\n\nFor a monthly SIP of ₹5,000 in a equity fund averaging 12% CAGR, you could potentially accumulate:\n- 5 years: ~₹4.1L (Invested: ₹3L)\n- 10 years: ~₹11.6L (Invested: ₹6L)\n\nWould you like me to explain any specific aspect in more detail?";
    }

    if (q.includes('best') || q.includes('recommend')) {
        return "I can't make specific fund recommendations, but I can help you understand what to look for:\n\n**For Beginners:**\n- Large-cap or index funds (lower risk)\n- Expense ratio below 1%\n- Consistent 3-5 year performance\n- 4-5 star rated funds\n\n**Key Metrics to Check:**\n- Alpha: Positive alpha means fund beat benchmark\n- Sharpe Ratio: Higher is better (risk-adjusted returns)\n- Standard Deviation: Lower means less volatile\n\n**Categories to Consider:**\n- Index Funds: Low cost, market returns\n- Flexi-Cap: Flexibility across market caps\n- ELSS: Tax saving under 80C\n\nWould you like me to explain any of these categories in detail?";
    }

    if (q.includes('risk') || q.includes('low risk')) {
        return "For low-risk investing, here are your options:\n\n**Conservative Options:**\n1. **Debt Funds**: ~6-8% returns, lower volatility\n2. **Liquid Funds**: For emergency funds, ~4-6% returns\n3. **Arbitrage Funds**: Equity taxation benefits, ~5-7% returns\n\n**Moderate Options:**\n4. **Hybrid Conservative**: 20-30% equity, rest in debt\n5. **Large-Cap Index**: Less volatile than mid/small cap\n\n**Risk vs Return Trade-off:**\n- Lower risk = Lower potential returns\n- But also = Better sleep at night!\n\nFor retirement specifically, a step-down approach works well:\n- Early years: Higher equity allocation\n- Near retirement: Shift to debt\n\nWhat's your investment horizon?";
    }

    return "That's a great question about investing! Here are some key points to consider:\n\n**Mutual Fund Basics:**\n- NAV (Net Asset Value): Current price per unit\n- Expense Ratio: Annual fee, lower is better\n- CAGR: Compound Annual Growth Rate\n\n**Fund Categories:**\n- Equity: Higher risk, higher potential returns\n- Debt: Lower risk, stable returns\n- Hybrid: Mix of both\n\n**Smart Investing Tips:**\n1. Start early - compounding works magic\n2. Stay invested for long term (5+ years)\n3. Diversify across categories\n4. Review but don't overtrade\n\nIs there anything specific you'd like me to elaborate on?";
}
