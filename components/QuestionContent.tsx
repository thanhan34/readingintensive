"use client";

import { useState } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);

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
          images: (images.urls || []).map((item: { url: string }) => item.url),
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

  if (!editedQuestion && question) {
    setEditedQuestion(question);
  }

  // Split content into parts, preserving (Answer: ...) sections
  const parts = question.content.split(/(\(Answer:[^)]+\))/g);

  return (
    <div className="h-full">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Title, Content, and Edit Button */}
        <div className="h-full overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-xl font-bold text-gray-900">{question.title}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-base leading-relaxed">
                {parts.map((part, index) => {
                  if (part.match(/\(Answer:[^)]+\)/)) {
                    // This is an answer section
                    return (
                      <span key={index} data-answer="true">
                        {part}
                      </span>
                    );
                  } else {
                    // Split non-answer text into words for translation
                    return part.split(/\s+/).map((word, wordIndex) => (
                      word && (
                        <span key={`${index}-${wordIndex}`} className="inline-block">
                          <button
                            onClick={() => handleWordClick(word)}
                            data-translate="true"
                            className="px-1 py-0.5 rounded"
                          >
                            {word}
                          </button>{" "}
                        </span>
                      )
                    ));
                  }
                })}
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Column: Explanations */}
        <div className="h-full overflow-y-auto border-l p-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Explanations:</h2>
            <div className="space-y-2">
              {question.text.split('\n').map((line, index) => (
                <p key={index} className="text-gray-700 text-base">{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Question Modal */}
      {isEditing && editedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[80vh] flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Question</h2>
              <button
                onClick={() => setIsEditing(false)}
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

            <div className="flex-1 grid grid-cols-2 gap-6 overflow-y-auto px-1">
              {/* Left Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editedQuestion.title}
                  onChange={(e) => setEditedQuestion({
                    ...editedQuestion,
                    title: e.target.value
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mb-3"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={editedQuestion.content}
                  onChange={(e) => setEditedQuestion({
                    ...editedQuestion,
                    content: e.target.value
                  })}
                  rows={24}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Right Column */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Text</label>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Type:</label>
                    <select
                      value={editedQuestion.type}
                      onChange={(e) => setEditedQuestion({
                        ...editedQuestion,
                        type: e.target.value as "RWFIB" | "RFIB"
                      })}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="RWFIB">RWFIB</option>
                      <option value="RFIB">RFIB</option>
                    </select>
                  </div>
                </div>
                <textarea
                  value={editedQuestion.text}
                  onChange={(e) => setEditedQuestion({
                    ...editedQuestion,
                    text: e.target.value
                  })}
                  rows={24}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-1 sticky bottom-0 bg-white border-t">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-0.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      /* eslint-disable @typescript-eslint/no-unused-vars */
                      const docRef = doc(db, "questions", editedQuestion.id);
                      const { id, ...updateData } = editedQuestion;
                      /* eslint-enable @typescript-eslint/no-unused-vars */
                      await updateDoc(docRef, updateData);
                      setIsEditing(false);
                      // Update the current question with the edited data
                      if (question) {
                        question.title = editedQuestion.title;
                        question.content = editedQuestion.content;
                        question.text = editedQuestion.text;
                        question.type = editedQuestion.type;
                      }
                    } catch (error) {
                      console.error("Error updating question:", error);
                      alert("Failed to update question");
                    }
                  }}
                  className="px-2 py-0.5 border border-transparent rounded text-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word Definition Modal */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {wordDefinition.ipa && (
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-700 mb-1">Pronunciation:</h3>
                        <p className="text-base bg-gray-50 p-2 rounded-lg">{wordDefinition.ipa}</p>
                      </div>
                    )}
                    {wordDefinition.partOfSpeech && (
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-700 mb-1">Part of Speech:</h3>
                        <p className="text-base bg-gray-50 p-2 rounded-lg capitalize">{wordDefinition.partOfSpeech}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-700 mb-1">Vietnamese Translation:</h3>
                      <p className="text-base bg-gray-50 p-2 rounded-lg">{wordDefinition.vietnamese}</p>
                    </div>
                  </div>
                </div>
                {wordDefinition.images?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">Related Images:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {wordDefinition.images.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative w-full h-48">
                          <Image
                            src={url}
                            alt={`${selectedWord} visualization ${index + 1}`}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
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
