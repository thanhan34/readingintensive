"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import QuestionContent from "../components/QuestionContent";

import { Question } from "../src/types";

export default function Home() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-64 border-r border-gray-200 bg-white">
        <Sidebar onQuestionSelect={setSelectedQuestion} />
      </aside>
      <main className="flex-1 relative overflow-y-auto">
        <QuestionContent question={selectedQuestion} />
      </main>
    </div>
  );
}
