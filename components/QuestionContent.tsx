"use client";

import { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

import { Question } from "../src/types";

type WordDefinition = {
  vietnamese: string;
  images: string[];
  partOfSpeech?: string;
  ipa?: string;
};

type Props = {
  question: Question | null;
};

export default function QuestionContent({ question }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDefinition, setWordDefinition] = useState<WordDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setIsLoading(true);

    try {
      // Check cache first
      // Clean the word: remove punctuation and special characters
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cacheDoc = await getDoc(doc(db, `dictionary/${cleanWord}`));
      
      if (cacheDoc.exists()) {
        setWordDefinition(cacheDoc.data() as WordDefinition);
      } else {
        // Fetch from APIs and cache
        const [translationResponse, imagesResponse, dictionaryResponse] = await Promise.all([
          fetch(`/api/translate?text=${encodeURIComponent(word)}`),
          fetch(`/api/images?query=${encodeURIComponent(word)}`),
          fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        ]);

        const [translation, images] = await Promise.all([
          translationResponse.json(),
          imagesResponse.json()
        ]);

        let partOfSpeech = "";
        let ipa = "";

        try {
          const dictData = await dictionaryResponse.json();
          if (Array.isArray(dictData) && dictData.length > 0) {
            partOfSpeech = dictData[0].meanings?.[0]?.partOfSpeech || "";
            ipa = dictData[0].phonetic || dictData[0].phonetics?.[0]?.text || "";
          }
        } catch (error) {
          console.error("Dictionary API error:", error);
        }

        const definition: WordDefinition = {
          vietnamese: translation.text || "No translation available",
          images: (images.urls || []).map((item: any) => item.url),
          partOfSpeech,
          ipa
        };

        // Cache the result
        await setDoc(doc(db, `dictionary/${cleanWord}`), definition);
        setWordDefinition(definition);
      }
    } catch (error) {
      console.error("Error fetching word definition:", error);
      setWordDefinition(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No question selected</h3>
          <p className="mt-1 text-sm text-gray-500">Select a question from the sidebar to begin practicing</p>
        </div>
      </div>
    );
  }

  const words = question.content.split(/\s+/);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{question.title}</h1>
        <div className="space-y-8">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed">
              {words.map((word, index) => (
                <span key={index} className="inline-block">
                  <button
                    onClick={() => handleWordClick(word)}
                    className="px-1 py-0.5 rounded hover:bg-yellow-100 transition-colors"
                  >
                    {word}
                  </button>{" "}
                </span>
              ))}
            </p>
          </div>
          
          {question.text && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Explanations:</h2>
              <div className="space-y-2">
                {question.text.split('\n').map((line, index) => (
                  <p key={index} className="text-gray-700">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Word Definition Modal */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedWord}</h2>
              <button
                onClick={() => {
                  setSelectedWord(null);
                  setWordDefinition(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : wordDefinition ? (
              <div>
                <div className="mb-6 space-y-4">
                  {wordDefinition.ipa && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Pronunciation:</h3>
                      <p className="text-lg bg-gray-50 p-3 rounded-lg">{wordDefinition.ipa}</p>
                    </div>
                  )}
                  {wordDefinition.partOfSpeech && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Part of Speech:</h3>
                      <p className="text-lg bg-gray-50 p-3 rounded-lg capitalize">{wordDefinition.partOfSpeech}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Vietnamese Translation:</h3>
                    <p className="text-lg bg-gray-50 p-3 rounded-lg">{wordDefinition.vietnamese}</p>
                  </div>
                </div>
                {wordDefinition.images?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Related Images:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {wordDefinition.images.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${selectedWord} visualization ${index + 1}`}
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No definition found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
