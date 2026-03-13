import { useEffect, useRef, useState } from 'react';

const AUDIO_DB_NAME = 'countdown-audio';
const AUDIO_DB_VERSION = 1;
const AUDIO_STORE_NAME = 'background-audio';
const AUDIO_RECORD_KEY = 'active-track';

type PersistedAudioRecord = {
  blob: Blob;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  updatedAt: number;
};

type PersistedBackgroundAudioState = {
  error: string;
  fileName: string | null;
  hasAudio: boolean;
  isReady: boolean;
};

export type PersistedBackgroundAudio = PersistedBackgroundAudioState & {
  clearAudio: () => Promise<void>;
  ensurePlaying: () => Promise<void>;
  pause: (reset?: boolean) => void;
  playFromStart: () => Promise<void>;
  replaceAudio: (file: File) => Promise<void>;
};

function openAudioDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        request.result.createObjectStore(AUDIO_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open the audio database.'));
  });
}

async function readPersistedAudioRecord() {
  const database = await openAudioDatabase();

  const record = await new Promise<PersistedAudioRecord | null>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    const request = store.get(AUDIO_RECORD_KEY);
    request.onsuccess = () => resolve((request.result as PersistedAudioRecord | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Unable to read the saved audio file.'));
  });

  database.close();
  return record;
}

async function writePersistedAudioRecord(file: File) {
  const database = await openAudioDatabase();
  const record: PersistedAudioRecord = {
    blob: file,
    lastModified: file.lastModified,
    name: file.name,
    size: file.size,
    type: file.type,
    updatedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    store.put(record, AUDIO_RECORD_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save the selected audio file.'));
  });

  database.close();
  return record;
}

async function deletePersistedAudioRecord() {
  const database = await openAudioDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    store.delete(AUDIO_RECORD_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to clear the saved audio file.'));
  });

  database.close();
}

export function usePersistedBackgroundAudio(): PersistedBackgroundAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<PersistedBackgroundAudioState>({
    error: '',
    fileName: null,
    hasAudio: false,
    isReady: false,
  });

  if (!audioRef.current) {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;
  }

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const applyRecord = (record: PersistedAudioRecord | null) => {
    revokeObjectUrl();

    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    if (!record) {
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      setState({
        error: '',
        fileName: null,
        hasAudio: false,
        isReady: true,
      });
      return;
    }

    const objectUrl = URL.createObjectURL(record.blob);
    objectUrlRef.current = objectUrl;
    audioRef.current.src = objectUrl;
    audioRef.current.loop = true;
    audioRef.current.load();
    setState({
      error: '',
      fileName: record.name,
      hasAudio: true,
      isReady: true,
    });
  };

  useEffect(() => {
    let cancelled = false;

    const restorePersistedAudio = async () => {
      try {
        const record = await readPersistedAudioRecord();
        if (!cancelled) {
          applyRecord(record);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            error: error instanceof Error ? error.message : 'Unable to restore the saved audio file.',
            fileName: null,
            hasAudio: false,
            isReady: true,
          });
        }
      }
    };

    void restorePersistedAudio();

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      revokeObjectUrl();
    };
  }, []);

  const replaceAudio = async (file: File) => {
    const record = await writePersistedAudioRecord(file);
    applyRecord(record);
  };

  const clearAudio = async () => {
    await deletePersistedAudioRecord();
    applyRecord(null);
  };

  const playFromStart = async () => {
    if (!audioRef.current || !state.hasAudio) {
      return;
    }

    audioRef.current.currentTime = 0;
    await audioRef.current.play();
  };

  const ensurePlaying = async () => {
    if (!audioRef.current || !state.hasAudio) {
      return;
    }

    await audioRef.current.play();
  };

  const pause = (reset = false) => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    if (reset) {
      audioRef.current.currentTime = 0;
    }
  };

  return {
    ...state,
    clearAudio,
    ensurePlaying,
    pause,
    playFromStart,
    replaceAudio,
  };
}
