require('dotenv').config();
const { ChromaClient, OpenAIEmbeddingFunction } = require('chromadb');
const OpenAI = require("openai");
const readline = require("readline");

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Chroma client
const chroma = new ChromaClient();
const embedder = new OpenAIEmbeddingFunction({openai_api_key: process.env.OPENAI_API_KEY});

let collection;

// Function to initialize the Chroma collection
async function initializeChromaCollection() {
    try {
        // Try to get the existing collection
        collection = await chroma.getCollection({
            name: "story_summaries",
            embeddingFunction: embedder
        });
        console.log("Existing Chroma collection retrieved successfully.");
    } catch (error) {
        // If the collection doesn't exist, create a new one
        if (error.message.includes('Collection not found')) {
            try {
                collection = await chroma.createCollection({
                    name: "story_summaries",
                    embeddingFunction: embedder
                });
                console.log("New Chroma collection created successfully.");
            } catch (createError) {
                console.error("Error creating Chroma collection:", createError);
                process.exit(1);
            }
        } else {
            console.error("Error retrieving Chroma collection:", error);
            process.exit(1);
        }
    }
}

// Function to summarize a story using OpenAI
async function summarizeStory(story) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are a helpful assistant that can summarize information concisely." },
            { role: "user", content: `Please summarize the following story: "${story}"` },
        ],
    });
    return completion.choices[0].message.content.trim();
}

// Function to add and summarize a new story
async function addStory(story) {
    const summary = await summarizeStory(story);
    await collection.add({
        ids: [Date.now().toString()],
        documents: [summary],
        metadatas: [{ original_story: story }]
    });
    console.log("Story added and summarized successfully!\n");
}

// Function to generate a response based on all summarized stories
async function getResponseBasedOnSummaries(userQuery) {
    const queryResult = await collection.query({
        queryTexts: [userQuery],
        nResults: 5
    });

    if (queryResult.documents[0].length === 0) {
        console.log("No relevant stories found. Please add more stories.\n");
        return;
    }

    const relevantSummaries = queryResult.documents[0].join(" ");

    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are a helpful assistant with access to summarized memories." },
            { role: "user", content: `Here are some relevant summarized stories: "${relevantSummaries}"` },
            { role: "user", content: `Based on the above summaries, please answer this question: "${userQuery}"` },
        ],
    });
    console.log("Response:", completion.choices[0].message.content, "\n");
}

// Terminal interface setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Enter a command ('add', 'ask', 'exit'): ",
});

// Main function to run the program
async function main() {
    await initializeChromaCollection();

    rl.prompt();
    rl.on("line", async (line) => {
        const input = line.trim().toLowerCase();
        if (input === "add") {
            rl.question("Enter the story: ", async (story) => {
                await addStory(story);
                rl.prompt();
            });
        } else if (input === "ask") {
            rl.question("Enter your question: ", async (question) => {
                await getResponseBasedOnSummaries(question);
                rl.prompt();
            });
        } else if (input === "exit") {
            rl.close();
        } else {
            console.log("Invalid command. Please use 'add', 'ask', or 'exit'.\n");
            rl.prompt();
        }
    }).on("close", () => {
        console.log("Exiting the program.");
        process.exit(0);
    });
}

main().catch(console.error);