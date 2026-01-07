import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import pb from "../pocketbase";
import Navbar from "../components/Banner";

export function Polls() {
  const { user, isAdmin } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userResponses, setUserResponses] = useState({});
  const [editingPoll, setEditingPoll] = useState(null);
  const [isStudent, setIsStudent] = useState(false);

  // Admin: Create/Edit poll form
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    questionType: "single",
    questions: [{ text: "", type: "multiple-choice", options: ["", ""] }],
  });

  // Check if user is a student
  useEffect(() => {
    const checkStudentStatus = async () => {
      if (!user || isAdmin) {
        setIsStudent(false);
        return;
      }

      try {
        const students = await pb.collection("students").getFullList();
        const studentRecord = students.find((s) => s.email === user.email);
        setIsStudent(!!studentRecord);
        console.log("Is student:", !!studentRecord);
      } catch (error) {
        console.error("Error checking student status:", error);
        setIsStudent(false);
      }
    };

    checkStudentStatus();
  }, [user, isAdmin]);

  // Load polls from PocketBase
  useEffect(() => {
    console.log("Polls component mounted, user:", user);
    if (!user) {
      setLoading(false);
      return;
    }
    loadPolls();

    // Subscribe to real-time updates
    try {
      pb.collection("polls").subscribe("*", function (e) {
        console.log("Poll update received:", e.action);
        loadPolls();
      });
    } catch (err) {
      console.error("Error subscribing to polls:", err);
    }

    return () => {
      try {
        pb.collection("polls").unsubscribe("*");
      } catch (err) {
        console.error("Error unsubscribing from polls:", err);
      }
    };
  }, [user]);

  const loadPolls = async () => {
    console.log("Loading polls...");
    try {
      const records = await pb.collection("polls").getFullList({
        sort: "-created",
      });

      console.log("Raw polls data:", records);

      // Parse and validate poll data
      const validPolls = records.map((poll) => {
        // Parse questions if it's a string
        let questions = poll.questions;
        if (typeof questions === "string") {
          try {
            questions = JSON.parse(questions);
          } catch (e) {
            console.error("Failed to parse questions for poll:", poll.id, e);
            questions = [];
          }
        }

        // Parse responses if it's a string
        let responses = poll.responses;
        if (typeof responses === "string") {
          try {
            responses = JSON.parse(responses);
          } catch (e) {
            console.error("Failed to parse responses for poll:", poll.id, e);
            responses = [];
          }
        }

        // Ensure questions is an array
        if (!Array.isArray(questions)) {
          questions = [];
        }

        // Ensure responses is an array
        if (!Array.isArray(responses)) {
          responses = [];
        }

        return {
          ...poll,
          questions,
          responses,
        };
      });

      console.log("Processed polls:", validPolls);
      setPolls(validPolls);

      // Load user's responses
      if (user) {
        const responses = {};
        for (const poll of validPolls) {
          if (poll.responses && Array.isArray(poll.responses)) {
            const userResponse = poll.responses.find(
              (r) => r.userId === user.id,
            );
            if (userResponse) {
              responses[poll.id] = userResponse;
            }
          }
        }
        setUserResponses(responses);
      }

      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error loading polls:", error);
      setError(error.message || "Failed to load polls");
      setLoading(false);
    }
  };

  // Admin: Add a new question to the form
  const addQuestion = () => {
    setNewPoll({
      ...newPoll,
      questions: [
        ...newPoll.questions,
        { text: "", type: "multiple-choice", options: ["", ""] },
      ],
    });
  };

  // Admin: Remove a question from the form
  const removeQuestion = (index) => {
    const questions = [...newPoll.questions];
    questions.splice(index, 1);
    setNewPoll({ ...newPoll, questions });
  };

  // Admin: Update question text
  const updateQuestionText = (qIndex, text) => {
    const questions = [...newPoll.questions];
    questions[qIndex].text = text;
    setNewPoll({ ...newPoll, questions });
  };

  // Admin: Update question type
  const updateQuestionType = (qIndex, type) => {
    const questions = [...newPoll.questions];
    questions[qIndex].type = type;
    // If switching to text, clear options
    if (type === "text") {
      questions[qIndex].options = [];
    } else if (
      !questions[qIndex].options ||
      questions[qIndex].options.length === 0
    ) {
      // If switching to multiple-choice, add default options
      questions[qIndex].options = ["", ""];
    }
    setNewPoll({ ...newPoll, questions });
  };

  // Admin: Add option to a question
  const addOption = (qIndex) => {
    const questions = [...newPoll.questions];
    questions[qIndex].options.push("");
    setNewPoll({ ...newPoll, questions });
  };

  // Admin: Remove option from a question
  const removeOption = (qIndex, oIndex) => {
    const questions = [...newPoll.questions];
    if (questions[qIndex].options.length > 2) {
      questions[qIndex].options.splice(oIndex, 1);
      setNewPoll({ ...newPoll, questions });
    }
  };

  // Admin: Update option text
  const updateOption = (qIndex, oIndex, text) => {
    const questions = [...newPoll.questions];
    questions[qIndex].options[oIndex] = text;
    setNewPoll({ ...newPoll, questions });
  };

  // Admin: Create a new poll
  const handleCreatePoll = async (e) => {
    if (e) e.preventDefault();

    if (!newPoll.title.trim()) {
      alert("Please enter a poll title");
      return;
    }

    // Validate questions
    for (let i = 0; i < newPoll.questions.length; i++) {
      const q = newPoll.questions[i];
      if (!q.text.trim()) {
        alert(`Question ${i + 1} is empty`);
        return;
      }
      if (q.type === "multiple-choice") {
        const validOptions = q.options.filter((o) => o.trim());
        if (validOptions.length < 2) {
          alert(`Question ${i + 1} needs at least 2 options`);
          return;
        }
      }
    }

    try {
      // Clean up questions - remove empty options
      const cleanedQuestions = newPoll.questions.map((q) => {
        const cleaned = {
          text: q.text.trim(),
          type: q.type || "multiple-choice",
        };

        if (q.type === "multiple-choice") {
          cleaned.options = q.options
            .filter((o) => o.trim())
            .map((o) => o.trim());
        }

        return cleaned;
      });

      const pollData = {
        title: newPoll.title.trim(),
        description: newPoll.description.trim() || "",
        questionType: newPoll.questionType,
        questions: cleanedQuestions,
        responses: [],
        createdBy: user.id,
      };

      console.log("Creating poll with data:", pollData);

      await pb.collection("polls").create(pollData);

      // Reset form
      setNewPoll({
        title: "",
        description: "",
        questionType: "single",
        questions: [{ text: "", type: "multiple-choice", options: ["", ""] }],
      });

      alert("Poll created successfully!");
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Error creating poll: " + (error.message || "Unknown error"));
    }
  };

  // Admin: Start editing a poll
  const handleEditPoll = (poll) => {
    setEditingPoll(poll);
    setNewPoll({
      title: poll.title,
      description: poll.description || "",
      questionType: poll.questionType || "single",
      questions: poll.questions.map((q) => ({
        text: q.text,
        type: q.type || "multiple-choice",
        options: q.options ? [...q.options] : [],
      })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Admin: Cancel editing
  const handleCancelEdit = () => {
    setEditingPoll(null);
    setNewPoll({
      title: "",
      description: "",
      questionType: "single",
      questions: [{ text: "", type: "multiple-choice", options: ["", ""] }],
    });
  };

  // Admin: Update poll
  const handleUpdatePoll = async (e) => {
    if (e) e.preventDefault();

    if (!newPoll.title.trim()) {
      alert("Please enter a poll title");
      return;
    }

    // Validate questions
    for (let i = 0; i < newPoll.questions.length; i++) {
      const q = newPoll.questions[i];
      if (!q.text.trim()) {
        alert(`Question ${i + 1} is empty`);
        return;
      }
      if (q.type === "multiple-choice") {
        const validOptions = q.options.filter((o) => o.trim());
        if (validOptions.length < 2) {
          alert(`Question ${i + 1} needs at least 2 options`);
          return;
        }
      }
    }

    try {
      const cleanedQuestions = newPoll.questions.map((q) => {
        const cleaned = {
          text: q.text.trim(),
          type: q.type || "multiple-choice",
        };

        if (q.type === "multiple-choice") {
          cleaned.options = q.options
            .filter((o) => o.trim())
            .map((o) => o.trim());
        }

        return cleaned;
      });

      await pb.collection("polls").update(editingPoll.id, {
        title: newPoll.title.trim(),
        description: newPoll.description.trim() || "",
        questionType: newPoll.questionType,
        questions: cleanedQuestions,
      });

      alert("Poll updated successfully!");
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating poll:", error);
      alert("Error updating poll: " + (error.message || "Unknown error"));
    }
  };

  // Admin: Delete poll
  const handleDeletePoll = async (pollId) => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to delete this poll?")) {
      try {
        await pb.collection("polls").delete(pollId);
        alert("Poll deleted successfully!");
      } catch (error) {
        console.error("Error deleting poll:", error);
        alert("Error deleting poll");
      }
    }
  };

  // Student: Submit vote
  const handleVote = async (poll, answers) => {
    if (!isStudent) {
      alert(
        "Only students can vote on polls. Please contact an administrator.",
      );
      return;
    }

    try {
      const existingResponses = poll.responses || [];

      // Check if user already voted
      const existingResponseIndex = existingResponses.findIndex(
        (r) => r.userId === user.id,
      );

      const newResponse = {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        answers: answers,
        timestamp: new Date().toISOString(),
      };

      let updatedResponses;
      if (existingResponseIndex !== -1) {
        // Update existing response
        updatedResponses = [...existingResponses];
        updatedResponses[existingResponseIndex] = newResponse;
      } else {
        // Add new response
        updatedResponses = [...existingResponses, newResponse];
      }

      await pb.collection("polls").update(poll.id, {
        responses: updatedResponses,
      });

      // Update local state immediately
      setUserResponses((prev) => ({
        ...prev,
        [poll.id]: newResponse,
      }));

      alert("Vote submitted successfully!");
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Error submitting vote: " + (error.message || "Unknown error"));
    }
  };

  // Calculate results for a poll with voter details
  const calculateResults = (poll) => {
    if (
      !poll.responses ||
      poll.responses.length === 0 ||
      !poll.questions ||
      poll.questions.length === 0
    ) {
      return null;
    }

    console.log("Calculating results for poll:", poll.id);
    console.log("Responses:", poll.responses);

    const results = poll.questions.map((question, qIndex) => {
      // For text questions, collect all text responses
      if (question.type === "text") {
        const textResponses = [];

        poll.responses.forEach((response) => {
          if (response.answers && response.answers[qIndex] !== undefined) {
            textResponses.push({
              text: response.answers[qIndex],
              userName: response.userName,
              userEmail: response.userEmail,
              userId: response.userId,
            });
          }
        });

        return {
          question: question.text,
          type: "text",
          textResponses: textResponses,
          totalVotes: poll.responses.length,
        };
      }

      // For multiple choice questions
      const optionVoters = {};

      // Initialize arrays for each option
      question.options.forEach((option) => {
        optionVoters[option] = [];
      });

      // Collect voters for each option
      poll.responses.forEach((response) => {
        if (response.answers && response.answers[qIndex] !== undefined) {
          const answerIndex = response.answers[qIndex];
          const selectedOption = question.options[answerIndex];

          if (selectedOption !== undefined) {
            optionVoters[selectedOption].push({
              name: response.userName,
              email: response.userEmail,
              userId: response.userId,
            });
          }
        }
      });

      const totalVotes = poll.responses.length;
      const optionsWithDetails = question.options.map((option) => {
        const voters = optionVoters[option] || [];
        const count = voters.length;
        const percentage =
          totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;

        return {
          text: option,
          count: count,
          percentage: percentage,
          voters: voters,
        };
      });

      return {
        question: question.text,
        type: "multiple-choice",
        options: optionsWithDetails,
        totalVotes,
      };
    });

    console.log("Final results:", results);
    return results;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="mb-4 text-xl font-semibold">Please Log In</h2>
        <p className="text-gray-600">You need to be logged in to view polls.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Sect"ion */}
      <Navbar title="Polls" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Admin Create/Edit Poll Form */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-xl font-semibold text-blue-800">
                  {editingPoll ? "Edit Poll" : "Create New Poll"}
                </h3>

                {editingPoll && (
                  <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-800">
                        ✏️ Editing: {editingPoll.title}
                      </span>
                      <button
                        onClick={handleCancelEdit}
                        className="text-xs text-blue-600 underline hover:text-blue-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Poll Title *
                    </label>
                    <input
                      type="text"
                      value={newPoll.title}
                      onChange={(e) =>
                        setNewPoll({ ...newPoll, title: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      placeholder="Enter poll title"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={newPoll.description}
                      onChange={(e) =>
                        setNewPoll({ ...newPoll, description: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      placeholder="Enter poll description"
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Poll Type
                    </label>
                    <select
                      value={newPoll.questionType}
                      onChange={(e) =>
                        setNewPoll({ ...newPoll, questionType: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    >
                      <option value="single">Single Question</option>
                      <option value="multiple">Multiple Questions</option>
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Questions
                      </label>
                      {newPoll.questionType === "multiple" && (
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Question
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 space-y-4 overflow-y-auto">
                      {newPoll.questions.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Question {qIndex + 1}
                            </span>
                            {newPoll.questionType === "multiple" &&
                              newPoll.questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(qIndex)}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              )}
                          </div>

                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) =>
                              updateQuestionText(qIndex, e.target.value)
                            }
                            className="mb-2 w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Enter question text"
                          />

                          <div className="mb-2">
                            <label className="text-xs font-medium text-gray-600">
                              Question Type:
                            </label>
                            <select
                              value={question.type || "multiple-choice"}
                              onChange={(e) =>
                                updateQuestionType(qIndex, e.target.value)
                              }
                              className="mt-1 w-full rounded border border-gray-300 p-1 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="multiple-choice">
                                Multiple Choice
                              </option>
                              <option value="text">Text Response</option>
                            </select>
                          </div>

                          {question.type !== "text" && (
                            <div className="space-y-1">
                              <div className="mb-1 text-xs font-medium text-gray-600">
                                Options:
                              </div>
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex gap-1">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(
                                        qIndex,
                                        oIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="flex-1 rounded border border-gray-300 p-1 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder={`Option ${oIndex + 1}`}
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeOption(qIndex, oIndex)
                                      }
                                      className="px-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                + Add Option
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={editingPoll ? handleUpdatePoll : handleCreatePoll}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    {editingPoll ? "Update Poll" : "Create Poll"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Polls List */}
          <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="space-y-6">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading polls...</p>
                </div>
              ) : polls.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center shadow-md">
                  <p className="text-gray-500">No polls yet.</p>
                  {isAdmin && (
                    <p className="mt-2 text-sm text-gray-400">
                      Create a new poll to get started!
                    </p>
                  )}
                </div>
              ) : (
                polls.map((poll) => {
                  if (
                    !poll.questions ||
                    !Array.isArray(poll.questions) ||
                    poll.questions.length === 0
                  ) {
                    return null;
                  }

                  const hasVoted = userResponses[poll.id];
                  const results =
                    isAdmin || hasVoted ? calculateResults(poll) : null;

                  return (
                    <div
                      key={poll.id}
                      className="rounded-lg bg-white p-6 shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-2 text-xl font-semibold text-gray-900">
                            {poll.title}
                          </h3>
                          {poll.description && (
                            <p className="text-sm text-gray-600">
                              {poll.description}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            {poll.responses?.length || 0} vote(s)
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() => handleEditPoll(poll)}
                              className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePoll(poll.id)}
                              className="rounded bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {!isAdmin && !hasVoted && isStudent ? (
                        <PollVotingForm poll={poll} onSubmit={handleVote} />
                      ) : !isAdmin && !isStudent ? (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 py-4 text-center text-sm text-gray-500">
                          You must be a registered student to vote on this poll
                        </div>
                      ) : results ? (
                        <PollResults
                          results={results}
                          hasVoted={hasVoted}
                          isAdmin={isAdmin}
                        />
                      ) : (
                        <div className="py-4 text-center text-sm text-gray-500">
                          Vote to see results
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for voting on a poll
function PollVotingForm({ poll, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (qIndex, value) => {
    setAnswers({
      ...answers,
      [qIndex]: value,
    });
  };

  const handleSubmit = () => {
    for (let i = 0; i < poll.questions.length; i++) {
      if (answers[i] === undefined || answers[i] === "") {
        alert(`Please answer question ${i + 1}`);
        return;
      }
    }
    onSubmit(poll, answers);
  };

  return (
    <div className="space-y-6">
      {poll.questions.map((question, qIndex) => (
        <div key={qIndex} className="border-t pt-4">
          <h4 className="mb-3 font-medium text-gray-900">
            {poll.questions.length > 1 && `${qIndex + 1}. `}
            {question.text}
          </h4>

          {question.type === "text" ? (
            <textarea
              value={answers[qIndex] || ""}
              onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="Type your answer here..."
              rows="4"
            />
          ) : (
            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 transition-colors hover:bg-blue-50"
                >
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    checked={answers[qIndex] === oIndex}
                    onChange={() => handleAnswerChange(qIndex, oIndex)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Submit Vote
      </button>
    </div>
  );
}

// Component for displaying poll results with voter details
function PollResults({ results, hasVoted, isAdmin }) {
  if (!results) return null;

  return (
    <div className="space-y-6">
      {hasVoted && !isAdmin && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          ✓ You have voted on this poll
        </div>
      )}
      {results.map((result, qIndex) => (
        <div key={qIndex} className="border-t pt-4">
          <h4 className="mb-3 font-medium text-gray-900">
            {results.length > 1 && `${qIndex + 1}. `}
            {result.question}
          </h4>

          {result.type === "text" ? (
            // Display text responses
            <div className="space-y-2">
              {result.textResponses && result.textResponses.length > 0 ? (
                result.textResponses.map((response, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <p className="mb-1 text-gray-800">{response.text}</p>
                    {isAdmin && (
                      <p className="text-xs text-gray-500">
                        — {response.userName} ({response.userEmail})
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No responses yet</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Total responses: {result.textResponses?.length || 0}
              </div>
            </div>
          ) : (
            // Display multiple choice results
            <div className="space-y-3">
              {result.options &&
                result.options.map((option, oIndex) => {
                  const isWinning =
                    option.count ===
                      Math.max(...result.options.map((o) => o.count)) &&
                    option.count > 0;

                  return (
                    <div key={oIndex} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`font-medium ${isWinning ? "text-blue-600" : "text-gray-700"}`}
                        >
                          {option.text}
                          {isWinning && result.totalVotes > 0 && " 🏆"}
                        </span>
                        <span className="text-gray-600">
                          {option.count} ({option.percentage}%)
                        </span>
                      </div>
                      <div className="h-6 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`flex h-full items-center justify-end pr-2 text-xs font-semibold text-white transition-all ${
                            isWinning ? "bg-blue-600" : "bg-blue-400"
                          }`}
                          style={{ width: `${option.percentage}%` }}
                        >
                          {option.percentage > 10 && `${option.percentage}%`}
                        </div>
                      </div>

                      {/* Show voters (admin only) */}
                      {isAdmin && option.voters && option.voters.length > 0 && (
                        <div className="mt-1 pl-4 text-xs text-gray-600">
                          <details className="cursor-pointer">
                            <summary className="hover:text-blue-600">
                              View {option.voters.length} voter
                              {option.voters.length !== 1 ? "s" : ""}
                            </summary>
                            <ul className="mt-1 space-y-1 pl-4">
                              {option.voters.map((voter, vIdx) => (
                                <li key={vIdx}>
                                  • {voter.name} ({voter.email})
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })}
              <div className="mt-2 text-xs text-gray-500">
                Total votes: {result.totalVotes}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
