require('dotenv').config();
const { ChromaClient, OpenAIEmbeddingFunction } = require('chromadb');
const OpenAI = require("openai");
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); 

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Chroma client
const client = new ChromaClient({
    path: 'http://54.210.124.255:8000'
});

const embedder = new OpenAIEmbeddingFunction({ openai_api_key: process.env.OPENAI_API_KEY });

let collection;

// Function to initialize the Chroma collection
async function initializeChromaCollection() {
    try {
        const collections = await client.listCollections();
        const existingCollection = collections.find(c => c.name === "story_summaries");
        
        if (existingCollection) {
            collection = await client.getCollection({
                name: "story_summaries",
                embeddingFunction: embedder
            });
            console.log("Existing Chroma collection retrieved successfully.");
        } else {
            collection = await client.createCollection({
                name: "story_summaries",
                embeddingFunction: embedder
            });
            console.log("New Chroma collection created successfully.");
        }
    } catch (error) {
        console.error("Error initializing Chroma collection:", error);
        process.exit(1);
    }
}

// Function to summarize a story using OpenAI
async function summarizeStory(story) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
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
        return "No relevant stories found.";
    }

    const relevantSummaries = queryResult.documents[0].join(" ");

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "You are a helpful assistant with access to summarized memories." },
            { role: "user", content: `Here are some relevant summarized stories: "${relevantSummaries}"` },
            { role: "user", content: `Based on the above summaries, please answer this question: "${userQuery}"` },
        ],
    });
    return completion.choices[0].message.content;
}

// Route to add a new story and summarize it
app.post('/add', async (req, res) => {
    const { story } = req.body;
    try {
        await addStory(story);
        res.status(200).json({ message: 'Story added and summarized successfully!' });
    } catch (error) {
        console.error("Error adding story:", error);
        res.status(500).json({ error: 'An error occurred while adding the story.' });
    }
});

// Route to ask a question based on summarized stories
app.post('/ask', async (req, res) => {
    const { query } = req.body;
    try {
        const response = await getResponseBasedOnSummaries(query);
        res.status(200).json({ response });
    } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).json({ error: 'An error occurred while processing your query.' });
    }
});

// Initialize the Chroma collection before starting the server
initializeChromaCollection().then(() => {
    app.listen(port, () => console.log(`App listening on port ${port}!`));
}).catch(error => {
    console.error("Failed to initialize the application:", error);
    process.exit(1);
});