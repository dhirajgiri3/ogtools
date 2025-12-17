/**
 * Direct test of Phase 3 authenticity engine
 * Bypasses API to test core generation
 */

import { generateConversation } from './src/core/algorithms/conversation/designer';
import { injectAuthenticity } from './src/core/algorithms/authenticity/engine';
import { predictQuality } from './src/core/algorithms/quality/predictor';
import type { Persona, CompanyContext, ConversationThread } from './src/core/types';

// Test data
const testPersona: Persona = {
    id: 'alex',
    name: 'Alex',
    role: 'startup founder',
    backstory: 'Running a 3-person startup, always short on time',
    vocabulary: {
        formality: 0.3,
        characteristic: ['honestly', 'ngl', 'fr'],
        avoid: ['leverage', 'synergy']
    },
    communicationStyle: {
        default: 'casual',
        acceptable: ['casual', 'professional']
    },
    redditPattern: 'periodic_checker',
    experienceLevel: 'medium',
    interests: ['startups', 'productivity', 'presentations']
};

const testCompany: CompanyContext = {
    name: 'Pitch.ai',
    product: 'AI-powered presentation tool',
    valuePropositions: ['AI slide generation', 'auto-formatting'],
    icp: ['startup founders', 'busy professionals'],
    keywords: ['pitch deck', 'presentation tool']
};

async function testGeneration() {
    console.log('🧪 Testing Phase 3 Authenticity Engine\n');

    try {
        // Generate base conversation
        console.log('1. Generating base conversation...');
        const conversation = await generateConversation(
            'discovery',
            [testPersona],
            testCompany,
            'Entrepreneur',
            ['pitch deck frustration'],
            new Set()
        );

        console.log('✓ Base generation successful\n');
        console.log('POST (before authenticity):');
        console.log(`  "${conversation.post.content}"\n`);

        // Apply authenticity to post
        console.log('2. Applying authenticity engine...');
        const authenticPost = await injectAuthenticity(
            conversation.post.content,
            testPersona,
            'Entrepreneur',
            'post'
        );

        console.log('✓ Authenticity applied\n');
        console.log('POST (after authenticity):');
        console.log(`  "${authenticPost}"\n`);

        // Update conversation
        conversation.post.content = authenticPost;

        // Apply to comments
        for (const comment of conversation.topLevelComments) {
            comment.content = await injectAuthenticity(
                comment.content,
                comment.persona,
                'Entrepreneur',
                'comment'
            );
        }

        // Apply to replies
        for (const reply of conversation.replies) {
            reply.content = await injectAuthenticity(
                reply.content,
                reply.persona,
                'Entrepreneur',
                'reply'
            );
        }

        // Score quality
        console.log('3. Scoring quality...');
        const quality = predictQuality(conversation as ConversationThread);

        console.log('\n📊 QUALITY REPORT:');
        console.log(`Overall Score: ${quality.overall}/100`);
        console.log(`  - Subreddit Relevance: ${quality.dimensions.subredditRelevance}/100`);
        console.log(`  - Problem Specificity: ${quality.dimensions.problemSpecificity}/100`);
        console.log(`  - Authenticity: ${quality.dimensions.authenticity}/100`);
        console.log(`  - Value First: ${quality.dimensions.valueFirst}/100`);
        console.log(`  - Engagement Design: ${quality.dimensions.engagementDesign}/100`);

        if (quality.issues.length > 0) {
            console.log('\n⚠ Issues:');
            quality.issues.forEach((issue: any) => console.log(`  - ${issue.type}: ${issue.description}`));
        }

        console.log('\n📝 FINAL CONTENT:');
        console.log('\nPOST:');
        console.log(`  "${conversation.post.content}"`);
        console.log(`  Length: ${conversation.post.content.length} chars`);

        console.log('\nCOMMENTS:');
        conversation.topLevelComments.forEach((c, i) => {
            console.log(`  ${i + 1}. "${c.content}" (${c.content.length} chars)`);
        });

        console.log('\nREPLIES:');
        conversation.replies.forEach((r, i) => {
            console.log(`  ${i + 1}. "${r.content}" (${r.content.length} chars)`);
        });

        console.log('\n✅ Test complete!');
        console.log(`\n🎯 Target: 90+/100 | Actual: ${quality.overall}/100`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
    }
}

testGeneration();
