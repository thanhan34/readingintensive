"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

import { Question } from "../src/types";

type Props = {
  questions: Question[];
  onSubmitComplete: () => void;
};

export default function QuestionReviewTable({ questions, onSubmitComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string[] }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  const validateQuestions = () => {
    const errors: { [key: number]: string[] } = {};
    let hasErrors = false;

    questions.forEach((question, index) => {
      const questionErrors: string[] = [];

      if (!question.title.trim()) {
        questionErrors.push("Title is required");
      }
      if (!question.content.trim()) {
        questionErrors.push("Content is required");
      }
      if (!question.text.trim()) {
        questionErrors.push("Text is required");
      }
      if (!["RWFIB", "RFIB"].includes(question.type)) {
        questionErrors.push("Invalid question type");
      }

      if (questionErrors.length > 0) {
        errors[index] = questionErrors;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async () => {
    if (!validateQuestions()) {
      setError("Please fix validation errors before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const questionsRef = collection(db, "questions");
      let uploaded = 0;

      // Upload questions in batches of 5
      for (let i = 0; i < questions.length; i += 5) {
        const batch = questions.slice(i, i + 5);
        await Promise.all(batch.map(question => addDoc(questionsRef, question)));
        uploaded += batch.length;
        setUploadProgress(Math.round((uploaded / questions.length) * 100));
      }

      onSubmitComplete();
      setError(null);
    } catch (err) {
      console.error("Error saving questions:", err);
      setError(`Failed to save questions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);

  return (
    <div className="mt-6 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(endIndex, questions.length)} of {questions.length} questions
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content Preview
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text Preview
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentQuestions.map((question, index) => (
              <tr key={index} className={validationErrors[startIndex + index] ? "bg-red-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {question.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={question.content}>
                    {question.content}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={question.text}>
                    {question.text}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    question.type === "RWFIB" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {question.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {validationErrors[startIndex + index] ? (
                    <div className="text-red-500">
                      {validationErrors[startIndex + index].join(", ")}
                    </div>
                  ) : (
                    <span className="text-green-500">Valid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isSubmitting && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="w-full">
              <div className="flex mb-2 items-center justify-between">
                <div className="text-sm font-semibold text-blue-700">
                  Uploading questions...
                </div>
                <div className="text-sm text-blue-700">
                  {uploadProgress}%
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div 
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end sticky bottom-0 bg-white p-4 border-t">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isSubmitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Questions"
          )}
        </button>
      </div>
    </div>
  );
}
