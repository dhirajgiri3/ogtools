/**
 * Test script to verify generation API behavior
 * Tests if the API is generating pitch/presentation content when it shouldn't
 */

const testInput = {
    company: {
        name: "FitTrack Pro",
        product: "AI-powered fitness tracking and workout planning app",
        valuePropositions: [
            "Automatically tracks workouts using phone sensors",
            "Creates personalized workout plans based on your goals",
            "Provides real-time form correction using AI",
            "Syncs with all major fitness devices"
        ],
        targetAudience: "Fitness enthusiasts and gym-goers aged 25-45",
        painPoints: [
            "Forgetting to log workouts manually",
            "Not knowing if workout form is correct",
            "Generic workout plans that don't match goals",
            "Juggling multiple fitness apps"
        ],
        activities: [
            "tracking workouts",
            "planning gym sessions",
            "monitoring fitness progress",
            "trying to stay consistent with training"
        ]
    },
    personas: [
        {
            id: "test_persona_1",
            name: "Alex",
            role: "Fitness Enthusiast",
            backstory: "Been going to the gym for 2 years, trying to build muscle and stay consistent",
            vocabulary: {
                characteristic: ["honestly", "ngl", "tbh", "kinda", "pretty much"],
                avoid: ["synergy", "leverage", "optimize", "revolutionary"],
                formality: 0.3
            },
            emotionalTriggers: {
                frustrations: ["inconsistent progress", "forgetting to track"],
                aspirations: ["build muscle", "stay consistent"]
            }
        },
        {
            id: "test_persona_2",
            name: "Jordan",
            role: "Gym Regular",
            backstory: "Works out 4-5 times a week, focused on strength training",
            vocabulary: {
                characteristic: ["yeah", "definitely", "for sure", "actually"],
                avoid: ["paradigm", "ecosystem", "holistic"],
                formality: 0.4
            },
            emotionalTriggers: {
                frustrations: ["not seeing results", "bad form"],
                aspirations: ["get stronger", "avoid injuries"]
            }
        }
    ],
    subreddits: ["r/fitness", "r/GYM"],
    keywords: ["workout tracking", "fitness app", "gym routine"],
    postsPerWeek: 2,
    qualityThreshold: 60,
    weekNumber: 1
};

async function testGenerationAPI() {
    console.log('🧪 Testing Generation API...\n');
    console.log('📋 Test Input:');
    console.log('Company:', testInput.company.name);
    console.log('Product:', testInput.company.product);
    console.log('Subreddits:', testInput.subreddits.join(', '));
    console.log('Keywords:', testInput.keywords.join(', '));
    console.log('\n' + '='.repeat(80) + '\n');

    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testInput)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, response.statusText);
            console.error('Error details:', errorText);
            return;
        }

        const result = await response.json();

        console.log('✅ API Response received\n');
        console.log('Week Number:', result.weekNumber);
        console.log('Total Conversations:', result.conversations?.length || 0);
        console.log('Average Quality:', result.averageQuality);
        console.log('\n' + '='.repeat(80) + '\n');

        // Analyze each conversation for pitch/presentation/deck mentions
        const problematicWords = ['pitch', 'presentation', 'deck', 'slide', 'powerpoint', 'slideforge'];
        let issuesFound = false;

        result.conversations?.forEach((conv, idx) => {
            console.log(`\n📝 Conversation ${idx + 1}:`);
            console.log('Subreddit:', conv.subreddit);
            console.log('Post Author:', conv.post.author);
            console.log('\nPost Content:');
            console.log(conv.post.content);
            console.log('\n---');

            // Check for problematic words in post
            const postLower = conv.post.content.toLowerCase();
            const foundWords = problematicWords.filter(word => postLower.includes(word));

            if (foundWords.length > 0) {
                console.log('⚠️  WARNING: Found pitch/presentation-related words in POST:', foundWords.join(', '));
                issuesFound = true;
            }

            // Check comments
            conv.comments?.forEach((comment, cIdx) => {
                console.log(`\nComment ${cIdx + 1} by ${comment.author}:`);
                console.log(comment.content);

                const commentLower = comment.content.toLowerCase();
                const foundWordsComment = problematicWords.filter(word => commentLower.includes(word));

                if (foundWordsComment.length > 0) {
                    console.log('⚠️  WARNING: Found pitch/presentation-related words in COMMENT:', foundWordsComment.join(', '));
                    issuesFound = true;
                }

                // Check replies
                comment.replies?.forEach((reply, rIdx) => {
                    console.log(`  Reply ${rIdx + 1} by ${reply.author}:`);
                    console.log(`  ${reply.content}`);

                    const replyLower = reply.content.toLowerCase();
                    const foundWordsReply = problematicWords.filter(word => replyLower.includes(word));

                    if (foundWordsReply.length > 0) {
                        console.log('  ⚠️  WARNING: Found pitch/presentation-related words in REPLY:', foundWordsReply.join(', '));
                        issuesFound = true;
                    }
                });
            });

            console.log('\n' + '-'.repeat(80));
        });

        console.log('\n\n' + '='.repeat(80));
        if (issuesFound) {
            console.log('❌ TEST FAILED: Found pitch/presentation/deck-related content');
            console.log('The API is generating content about presentations instead of the user\'s actual product (fitness tracking)');
        } else {
            console.log('✅ TEST PASSED: No pitch/presentation/deck-related content found');
            console.log('Content is correctly focused on fitness tracking');
        }
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error);
    }
}

// Run the test
testGenerationAPI();
