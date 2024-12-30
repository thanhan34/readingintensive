"use client";

import { useState } from "react";
import ExcelUploader from "../../components/ExcelUploader";
import QuestionReviewTable from "../../components/QuestionReviewTable";

import { Question } from "../../src/types";

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
  };

  const handleSubmitComplete = () => {
    setQuestions([]);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-none p-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upload Questions</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a CSV file containing questions. Make sure it follows the required format.
            </p>
          </div>
          
          <ExcelUploader onQuestionsLoaded={handleQuestionsLoaded} />
          
          {questions.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review Questions</h2>
              <QuestionReviewTable 
                questions={questions} 
                onSubmitComplete={handleSubmitComplete} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
