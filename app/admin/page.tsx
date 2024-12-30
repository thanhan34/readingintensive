"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ExcelUploader from "../../components/ExcelUploader";
import QuestionReviewTable from "../../components/QuestionReviewTable";

import { Question } from "../../src/types";

export default function AdminPage() {
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db, "questions");
        const snapshot = await getDocs(questionsRef);
        const questions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Question));
        setExistingQuestions(questions);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setUploadedQuestions(loadedQuestions);
  };

  const handleSubmitComplete = () => {
    setUploadedQuestions([]);
    // Refresh existing questions
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db, "questions");
        const snapshot = await getDocs(questionsRef);
        const questions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Question));
        setExistingQuestions(questions);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };
    fetchQuestions();
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
          
          {uploadedQuestions.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review Uploaded Questions</h2>
              <QuestionReviewTable 
                questions={uploadedQuestions} 
                onSubmitComplete={handleSubmitComplete} 
              />
            </div>
          )}

          <div className="p-6 border-t">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Questions</h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : existingQuestions.length > 0 ? (
              <QuestionReviewTable 
                questions={existingQuestions} 
                onSubmitComplete={handleSubmitComplete}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No questions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
