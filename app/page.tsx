"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import QuestionContent from "../components/QuestionContent";

import { Question } from "../src/types";

export default function Home() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${sidebarVisible ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-gray-200 bg-white overflow-hidden`}
      >
        <Sidebar onQuestionSelect={setSelectedQuestion} />
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Toggle Sidebar Button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 focus:outline-none"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {sidebarVisible ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>
        
        <QuestionContent question={selectedQuestion} />
      </main>
    </div>
  );
}
