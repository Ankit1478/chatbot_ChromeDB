'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [story, setStory] = useState('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleAddStory = async () => {
    try {
      const res = await axios.post('http://localhost:3001/add', { story });
      alert(res.data.message);
      setStory('');
    } catch (error) {
      console.error('Error adding story:', error);
      alert('An error occurred while adding the story.');
    }
  };

  const handleAskQuery = async () => {
    try {
      const res = await axios.post('http://localhost:3001/ask', { query });
      setResponse(res.data.response);
      setQuery('');
    } catch (error) {
      console.error('Error processing query:', error);
      alert('An error occurred while processing your query.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Story Summarization and Query</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Add a Story</h2>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Enter your story here..."
          style={{ width: '100%', height: '100px' }}
        />
        <button onClick={handleAddStory} style={{ marginTop: '10px' }}>
          Add Story
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Ask a Question</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your question here..."
          style={{ width: '100%', padding: '10px' }}
        />
        <button onClick={handleAskQuery} style={{ marginTop: '10px' }}>
          Ask Question
        </button>
      </div>

      {response && (
        <div>
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
