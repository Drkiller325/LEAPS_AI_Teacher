"use client";

import { create } from "zustand";

export const teachers = ["Nanami", "Naoki"];

export const useAITeacher = create((set, get) => ({
  messages: [],
  currentMessage: null, // Index of the message being played or -1 / null
  teacher: teachers[0],
  playingAudio: null, // Store the currently playing Audio object
  playingVisemes: [], // Store visemes for the playing audio
  setTeacher: (teacher) => {
    get().stopMessage(); // Stop audio if playing
    set(() => ({
      teacher,
      messages: get().messages.map((message) => {
        // No need to clear audioPlayer here anymore
        return message;
      }),
    }));
  },
  classroom: "default",
  setClassroom: (classroom) => {
    set(() => ({
      classroom,
    }));
  },
  loading: false,
  furigana: true,
  setFurigana: (furigana) => {
    set(() => ({
      furigana,
    }));
  },
  english: true,
  setEnglish: (english) => {
    set(() => ({
      english,
    }));
  },
  speech: "formal",
  setSpeech: (speech) => set({ speech }),

  askAI: async (question) => {
    if (!question) return;

    set(() => ({
      loading: true,
    }));
    get().stopMessage(); // Stop any previous message

    try {
      const speech = get().speech;
      const res = await fetch(`/api/ai?question=${encodeURIComponent(question)}&speech=${speech}`);
      
      if (!res.ok) {
        throw new Error(`AI API returned status ${res.status}`);
      }

      const data = await res.json();

      // Validate response structure
      if (!data.answer) {
        throw new Error('Response missing answer object');
      }

      const message = {
        id: Date.now(),
        question,
        answer: data.answer,
        speech
      };

      // Add message first
      set((state) => ({
        messages: [...state.messages, message],
        // Don't set currentMessage here, let playMessage handle it
      }));

      // Get the index of the newly added message
      const newMessageIndex = get().messages.length - 1;

      // Now play the new message
      await get().playMessage(newMessageIndex);

    } catch (error) {
      console.error("Error in askAI:", error);
      // Stop loading even if AI or TTS fails
      set((state) => ({
        loading: false,
        currentMessage: null,
        playingAudio: null,
        playingVisemes: [],
        messages: [
          ...state.messages,
          {
            id: Date.now(),
            question: get().messages.find(m => m.id === state.messages[state.messages.length-1]?.id)?.question || "Error", // Attempt to get original question
            answer: {
              english: "Sorry, I encountered an error processing your request. Please try again.",
              japanese: [{ word: "エラーが発生しました。", reading: "エラーがはっせいしました"}],
              grammarBreakdown: []
            },
            speech: get().speech, // or a default
            isError: true
          }
        ]
      }));
    } finally {
      // Ensure loading is set to false after playing starts or if an error occurred
       set(() => ({ loading: false }));
    }
  },

  playMessage: async (index) => {
    const messages = get().messages;
    if (index === null || index < 0 || index >= messages.length) {
      console.error("playMessage: Invalid index", index);
      return;
    }
    const message = messages[index];

    if (!message?.answer?.japanese) {
       console.error("playMessage: No Japanese text found for message", index);
       return;
    }
    
    // Stop any currently playing message
    get().stopMessage();

    // Set loading false *before* playing starts
    set({ loading: false });

    try {
      // Get the Japanese text to speak
      const japaneseText = message.answer.japanese
        .map(item => item.word)
        .join('');

      if (!japaneseText) {
        console.error("playMessage: Empty Japanese text for message", index);
        return;
      }

      // Call the TTS API with the correct voice based on teacher
      const audioRes = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: japaneseText,
          voice: get().teacher === "Nanami" ? "ja-JP-NanamiNeural" : "ja-JP-KeitaNeural"
        }),
      });

      if (!audioRes.ok) {
        throw new Error(`TTS API returned status ${audioRes.status}`);
      }

      const response = await audioRes.json();
      
      if (!response.audio || !response.audio.length) {
        throw new Error('No audio data received from TTS API');
      }
      if (!response.visemes) {
         console.warn("No viseme data received from TTS API");
      }

      const audioData = new Uint8Array(response.audio);
      const audioBlob = new Blob([audioData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Set current message and playing state *before* playing
      set({ currentMessage: index, playingAudio: audio, playingVisemes: response.visemes || [] });

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          // Clear playing state when finished
          set({ currentMessage: null, playingAudio: null, playingVisemes: [] });
          resolve();
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          URL.revokeObjectURL(audioUrl);
           // Clear playing state on error
          set({ currentMessage: null, playingAudio: null, playingVisemes: [] });
          reject(e);
        };
        audio.play().catch(error => {
          console.error('Audio play() error:', error);
           // Clear playing state on play error
          set({ currentMessage: null, playingAudio: null, playingVisemes: [] });
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error playing message:", error);
       // Clear playing state if any error occurs during setup/fetch
      set({ currentMessage: null, playingAudio: null, playingVisemes: [] });
    }
  },

  stopMessage: () => {
    const audio = get().playingAudio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      // Assuming the audio src is a blob URL that needs revoking
      // It's safer to revoke URL when the audio object is discarded (onended/onerror)
      // If the src is not a blob URL, this might not be necessary or correct.
      // URL.revokeObjectURL(audio.src); // Be cautious with this line
    }
    // Clear playing state
    set({ currentMessage: null, playingAudio: null, playingVisemes: [] });
  },
}));
