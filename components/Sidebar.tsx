"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

import { Question } from "../src/types";

type Props = {
  onQuestionSelect: (question: Question | null) => void;
};

export default function Sidebar({ onQuestionSelect }: Props) {
  const [rwfibQuestions, setRwfibQuestions] = useState<Question[]>([]);
  const [rfibQuestions, setRfibQuestions] = useState<Question[]>([]);
  const [isRwfibOpen, setIsRwfibOpen] = useState(true);
  const [isRfibOpen, setIsRfibOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRwfibQuestions = rwfibQuestions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRfibQuestions = rfibQuestions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchQuestions = async () => {
      const questionsRef = collection(db, "questions");
      const snapshot = await getDocs(questionsRef);
      const questions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          text: data.text || "",
          type: data.type || "RWFIB"
        } as Question;
      });

      // Sort questions by number in title
      const sortByNumber = (questions: Question[]) => {
        return [...questions].sort((a, b) => {
          const numA = parseInt(a.title.match(/#(\d+)/)?.[1] || "0");
          const numB = parseInt(b.title.match(/#(\d+)/)?.[1] || "0");
          return numA - numB;
        });
      };

      setRwfibQuestions(sortByNumber(questions.filter(q => q.type === "RWFIB")));
      setRfibQuestions(sortByNumber(questions.filter(q => q.type === "RFIB")));
    };

    fetchQuestions();
  }, []);

  return (
    <div className="h-full overflow-y-auto py-4">
      <div className="px-4 mb-4">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* RWFIB Section */}
      <div className="mb-6 px-4">
        <button
          onClick={() => setIsRwfibOpen(!isRwfibOpen)}
          className="flex items-center justify-between w-full p-2 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <span className="font-medium text-gray-900">Reading Writing FIB</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isRwfibOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isRwfibOpen && (
          <div className="mt-2 space-y-1">
            {filteredRwfibQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(question)}
                className="w-full p-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {question.title}
              </button>
            ))}
            {filteredRwfibQuestions.length === 0 && (
              <p className="text-sm text-gray-500 p-2">No questions available</p>
            )}
          </div>
        )}
      </div>

      {/* RFIB Section */}
      <div className="px-4">
        <button
          onClick={() => setIsRfibOpen(!isRfibOpen)}
          className="flex items-center justify-between w-full p-2 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <span className="font-medium text-gray-900">Reading FIB</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isRfibOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isRfibOpen && (
          <div className="mt-2 space-y-1">
            {filteredRfibQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(question)}
                className="w-full p-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {question.title}
              </button>
            ))}
            {filteredRfibQuestions.length === 0 && (
              <p className="text-sm text-gray-500 p-2">No questions available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
