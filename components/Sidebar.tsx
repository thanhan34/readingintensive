"use client"

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

import { Question } from "../src/types";

type Props = {
  onQuestionSelect: (question: Question | null) => void;
};

type NavigationProps = {
  questions: Question[];
  currentQuestion: Question | null;
  onNavigate: (question: Question) => void;
};

const QuestionNavigation = ({ questions, currentQuestion, onNavigate }: NavigationProps) => {
  if (!currentQuestion || questions.length === 0) return null;
  
  const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < questions.length - 1;
  
  return (
    <div className="flex justify-between items-center mb-2 px-4">
      <button
        onClick={() => hasPrevious && onNavigate(questions[currentIndex - 1])}
        disabled={!hasPrevious}
        className={`p-1 rounded ${hasPrevious ? 'text-[#fc5d01] hover:bg-[#fedac2]' : 'text-gray-300'}`}
      >
        ← Back
      </button>
      <button
        onClick={() => hasNext && onNavigate(questions[currentIndex + 1])}
        disabled={!hasNext}
        className={`p-1 rounded ${hasNext ? 'text-[#fc5d01] hover:bg-[#fedac2]' : 'text-gray-300'}`}
      >
        Next →
      </button>
    </div>
  );
};

export default function Sidebar({ onQuestionSelect }: Props) {
  const [rwfibQuestions, setRwfibQuestions] = useState<Question[]>([]);
  const [rfibQuestions, setRfibQuestions] = useState<Question[]>([]);
  const [isRwfibOpen, setIsRwfibOpen] = useState(true);
  const [isRfibOpen, setIsRfibOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rwfibPriorityInput, setRwfibPriorityInput] = useState("");
  const [rfibPriorityInput, setRfibPriorityInput] = useState("");
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrioritySettings, setShowPrioritySettings] = useState(false);

  const filteredRwfibQuestions = rwfibQuestions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch && (!showPriorityOnly || q.priority);
  });

  const filteredRfibQuestions = rfibQuestions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch && (!showPriorityOnly || q.priority);
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const questionsRef = collection(db, "questions");
        const snapshot = await getDocs(questionsRef);
        const questions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            content: data.content || "",
            text: data.text || "",
            type: data.type || "RWFIB",
            priority: data.priority || false
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
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleQuestionSelect = useCallback((question: Question) => {
    setSelectedQuestion(question);
    onQuestionSelect(question);
  }, [onQuestionSelect]);

  // Listen for navigation events from QuestionContent
  useEffect(() => {
    const handleNavigateNext = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { questionId, questionType } = customEvent.detail;
      
      // Find the current question in the appropriate list
      const questions = questionType === "RWFIB" ? filteredRwfibQuestions : filteredRfibQuestions;
      const currentIndex = questions.findIndex(q => q.id === questionId);
      
      // Navigate to the next question if available
      if (currentIndex >= 0 && currentIndex < questions.length - 1) {
        handleQuestionSelect(questions[currentIndex + 1]);
      }
    };

    // Add event listener
    window.addEventListener('navigate-next', handleNavigateNext);
    
    // Clean up
    return () => {
      window.removeEventListener('navigate-next', handleNavigateNext);
    };
  }, [filteredRwfibQuestions, filteredRfibQuestions, handleQuestionSelect]);

  // Function to parse pasted text and extract question numbers
  const parseQuestionNumbers = (text: string): number[] => {
    // Match all occurrences of #number
    const matches = text.match(/#(\d+)/g) || [];
    
    // Extract just the numbers and convert to integers
    const numbers = matches.map(match => parseInt(match.substring(1)));
    
    // Remove duplicates
    return Array.from(new Set(numbers));
  };

  const updateRwfibPriorities = async () => {
    if (!rwfibPriorityInput.trim()) return;
    
    // If input contains # symbols, parse it as a pasted list
    const priorityNumbers = rwfibPriorityInput.includes('#') 
      ? parseQuestionNumbers(rwfibPriorityInput)
      : rwfibPriorityInput.split(/[,\s]+/).map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    
    // Update each RWFIB question's priority status
    const updatePromises = rwfibQuestions.map(async (question) => {
      const questionNumber = parseInt(question.title.match(/#(\d+)/)?.[1] || "0");
      const shouldBePriority = priorityNumbers.includes(questionNumber);
      
      // Only update if priority status changed
      if (shouldBePriority !== question.priority) {
        await updateDoc(doc(db, "questions", question.id), {
          priority: shouldBePriority
        });
        
        // Update local state
        return {
          ...question,
          priority: shouldBePriority
        };
      }
      
      return question;
    });
    
    const updatedQuestions = await Promise.all(updatePromises);
    
    // Update state with new priorities
    setRwfibQuestions(updatedQuestions);
    
    // Clear input
    setRwfibPriorityInput("");
  };
  
  const updateRfibPriorities = async () => {
    if (!rfibPriorityInput.trim()) return;
    
    // If input contains # symbols, parse it as a pasted list
    const priorityNumbers = rfibPriorityInput.includes('#') 
      ? parseQuestionNumbers(rfibPriorityInput)
      : rfibPriorityInput.split(/[,\s]+/).map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    
    // Update each RFIB question's priority status
    const updatePromises = rfibQuestions.map(async (question) => {
      const questionNumber = parseInt(question.title.match(/#(\d+)/)?.[1] || "0");
      const shouldBePriority = priorityNumbers.includes(questionNumber);
      
      // Only update if priority status changed
      if (shouldBePriority !== question.priority) {
        await updateDoc(doc(db, "questions", question.id), {
          priority: shouldBePriority
        });
        
        // Update local state
        return {
          ...question,
          priority: shouldBePriority
        };
      }
      
      return question;
    });
    
    const updatedQuestions = await Promise.all(updatePromises);
    
    // Update state with new priorities
    setRfibQuestions(updatedQuestions);
    
    // Clear input
    setRfibPriorityInput("");
  };

  return (
    <div className="h-full overflow-y-auto py-4">
      <div className="px-4 mb-2">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
        />
      </div>
      
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showPriorityOnly}
              onChange={() => setShowPriorityOnly(!showPriorityOnly)}
              className="form-checkbox h-4 w-4 text-[#fc5d01] rounded focus:ring-[#fc5d01]"
            />
            <span className="ml-2 text-sm text-gray-700">Show priority only</span>
          </label>
          
          <button
            onClick={() => setShowPrioritySettings(!showPrioritySettings)}
            className="text-sm text-[#fc5d01] hover:underline"
          >
            {showPrioritySettings ? "Hide priority settings" : "Show priority settings"}
          </button>
        </div>
      </div>
      
      {selectedQuestion && (
        <QuestionNavigation 
          questions={selectedQuestion.type === "RWFIB" ? filteredRwfibQuestions : filteredRfibQuestions}
          currentQuestion={selectedQuestion}
          onNavigate={handleQuestionSelect}
        />
      )}
      
      {/* Priority Settings (Hidden by default) */}
      {showPrioritySettings && (
        <>
          {/* RWFIB Priority */}
          <div className="mb-4 px-4">
            <div className="mb-4 bg-[#fedac2] p-3 rounded-lg">
              <h3 className="font-medium text-[#fc5d01] mb-2">RWFIB Priority</h3>
              <div className="mb-2">
                <textarea
                  placeholder="Paste question list or enter numbers (e.g. 1,2,5)"
                  value={rwfibPriorityInput}
                  onChange={(e) => setRwfibPriorityInput(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can paste a list with #number format or enter comma-separated numbers
                </p>
              </div>
              <button
                onClick={updateRwfibPriorities}
                className="w-full py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] font-medium"
              >
                Set RWFIB Priority
              </button>
            </div>
          </div>
          
          {/* RFIB Priority */}
          <div className="px-4 mb-4">
            <div className="mb-4 bg-[#fedac2] p-3 rounded-lg">
              <h3 className="font-medium text-[#fc5d01] mb-2">RFIB Priority</h3>
              <div className="mb-2">
                <textarea
                  placeholder="Paste question list or enter numbers (e.g. 1,2,5)"
                  value={rfibPriorityInput}
                  onChange={(e) => setRfibPriorityInput(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can paste a list with #number format or enter comma-separated numbers
                </p>
              </div>
              <button
                onClick={updateRfibPriorities}
                className="w-full py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] font-medium"
              >
                Set RFIB Priority
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* RWFIB Section */}
      <div className="mb-4 px-4">
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
        
        {isLoading ? (
          <div className="mt-2 p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#fc5d01]"></div>
            <p className="mt-2 text-sm text-gray-500">Loading questions...</p>
          </div>
        ) : isRwfibOpen && (
          <div className="mt-2 space-y-1">
            {filteredRwfibQuestions.map((question) => (
              <button
                key={question.id}
                data-id={question.id}
                data-type="RWFIB"
                onClick={() => handleQuestionSelect(question)}
                className={`w-full p-2 text-left text-sm rounded-md transition-colors flex items-center ${
                  question.priority 
                    ? 'bg-[#fedac2] text-[#fc5d01] hover:bg-[#fdbc94]' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {question.priority && (
                  <span className="mr-2 text-[#fc5d01]">★</span>
                )}
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
        
        {isLoading ? (
          <div className="mt-2 p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#fc5d01]"></div>
            <p className="mt-2 text-sm text-gray-500">Loading questions...</p>
          </div>
        ) : isRfibOpen && (
          <div className="mt-2 space-y-1">
            {filteredRfibQuestions.map((question) => (
              <button
                key={question.id}
                data-id={question.id}
                data-type="RFIB"
                onClick={() => handleQuestionSelect(question)}
                className={`w-full p-2 text-left text-sm rounded-md transition-colors flex items-center ${
                  question.priority 
                    ? 'bg-[#fedac2] text-[#fc5d01] hover:bg-[#fdbc94]' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {question.priority && (
                  <span className="mr-2 text-[#fc5d01]">★</span>
                )}
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
