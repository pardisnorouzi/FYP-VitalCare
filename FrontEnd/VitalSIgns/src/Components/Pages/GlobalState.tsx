import { useState } from 'react';

interface GlobalState {
  storedData: string;
  updateStoredData: (newData: string) => void;
  clearStoredData: () => void;
}

const useGlobalState = (): GlobalState => {
  const [storedData, setStoredData] = useState<string>('');

  const updateStoredData = (newData: string): void => {
    setStoredData((prevData) => prevData + `${newData}\n`);
  };

  const clearStoredData = (): void => {
    setStoredData('');
  };

  return { storedData, updateStoredData, clearStoredData };
};

export default useGlobalState;
