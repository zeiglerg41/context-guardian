import React, { useState, useEffect } from 'react';
import { useStore } from 'zustand';

interface AppProps {
  title: string;
}

export const App: React.FC<AppProps> = ({ title }) => {
  const [count, setCount] = useState(0);
  const store = useStore();

  useEffect(() => {
    console.log('Component mounted');
  }, []);

  const handleClick = async () => {
    const result = await fetchData();
    setCount(result);
  };

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
};

async function fetchData(): Promise<number> {
  return Promise.resolve(42);
}
