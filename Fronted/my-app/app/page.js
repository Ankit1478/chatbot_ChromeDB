'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [story, setStory] = useState('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [characterNames, setCharacterNames] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');

  const handleAddStory = async () => {
    try {
        // First, add the story
        await axios.post('http://localhost:3001/add', { story });
        const { data } = await axios.post('http://localhost:3001/charactername', { story });
        setCharacterNames(data.response.split(', '));

        setStory('');
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the story or fetching character names.');
    }
};

  const handleAskQuery = async () => {
    try {
      const res = await axios.post('http://localhost:3001/ask', { query, characterName: selectedCharacter });
      setResponse(res.data.response);
      setQuery('');
    } catch (error) {
      console.error('Error processing query:', error);
      alert('An error occurred while processing your query.');
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-8">Story Summarization and Query</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add a Story</h2>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Enter your story here..."
          className="w-full h-24 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAddStory}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
        >
          Add Story
        </button>
      </div>

      {characterNames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Select a Character</h2>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">--Select Character--</option>
            {characterNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCharacter && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Ask a Question as {selectedCharacter}</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your question here..."
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAskQuery}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            Ask Question
          </button>
        </div>
      )}

      {response && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Response:</h2>
          <p className="p-2 bg-gray-100 border rounded-md">{response}</p>
        </div>
      )}
    </div>
  );
}
