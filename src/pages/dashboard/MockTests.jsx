import { useEffect, useState, useMemo } from 'react';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

const fallbackTests = [
  {
    title: 'Data Structures & Algorithms',
    courseCode: 'CSE 201',
    questions: 3,
    durationMinutes: 60,
    difficulty: 'Medium',
    avgScore: 72,
    participants: 245,
  },
  {
    title: 'Database Management Systems',
    courseCode: 'CSE 301',
    questions: 3,
    durationMinutes: 45,
    difficulty: 'Easy',
    avgScore: 78,
    participants: 189,
  },
];

export default function MockTestsPage() {
  const { profile } = useProfile();
  const [tests, setTests] = useState(fallbackTests);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'history'

  // Quiz taking state
  const [activeAttempt, setActiveAttempt] = useState(null); // attempt object from API
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
  const [quizResult, setQuizResult] = useState(null); // completed attempt object

  // History state
  const [historyAttempts, setHistoryAttempts] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadTests = async () => {
    setLoadingTests(true);
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) {
        throw new Error('Unable to load tests');
      }
      const payload = await response.json();
      setTests(payload.tests || fallbackTests);
    } catch (err) {
      console.error(err);
      setTests(fallbackTests);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/tests/history', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!response.ok) {
        throw new Error('Unable to load history');
      }
      const payload = await response.json();
      setHistoryAttempts(payload.attempts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadTests();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleStart = async (testId) => {
    if (!testId) return;

    try {
      const token = await getToken();
      if (!token) {
        alert('Please log in first to start a mock test.');
        return;
      }

      // 1. Create a TestAttempt document on the backend
      const response = await fetch('/api/tests/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize test attempt');
      }

      const data = await response.json();
      const attempt = data.attempt;

      setActiveAttempt(attempt);
      setSelectedAnswers({});
      setCurrentIdx(0);
      setQuizResult(null);

      // 2. Fetch the questions list securely
      setLoadingQuestions(true);
      const qResponse = await fetch(`/api/tests/questions?testId=${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!qResponse.ok) {
        throw new Error('Failed to load questions list');
      }

      const qData = await qResponse.json();
      setQuestions(qData.test.questionsList || []);
    } catch (err) {
      console.error('Start test failed:', err);
      alert(err.message || 'Error starting mock test');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleSubmit = async () => {
    if (!activeAttempt) return;
    
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    let confirmMsg = 'Are you sure you want to submit your test?';
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Are you sure you want to submit?`;
    }

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      // Format answers for Mongoose schema
      const formattedAnswers = Object.keys(selectedAnswers).map((k) => ({
        questionIndex: Number(k),
        selectedOptionIndex: selectedAnswers[k],
      }));

      const response = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          attemptId: activeAttempt._id,
          answers: formattedAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit attempt');
      }

      const data = await response.json();
      setQuizResult(data.attempt);
      loadTests();
    } catch (err) {
      console.error(err);
      alert('Error submitting mock test: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTest = () => {
    if (window.confirm('Are you sure you want to exit? Your progress on this attempt will be lost.')) {
      setActiveAttempt(null);
      setQuestions([]);
      setQuizResult(null);
    }
  };

  const handleBackToBrowse = () => {
    setActiveAttempt(null);
    setQuestions([]);
    setQuizResult(null);
  };

  // Derive stats dynamically from history
  const calculatedStats = useMemo(() => {
    const completed = historyAttempts.filter((a) => a.status === 'completed');
    const totalCount = completed.length;
    if (totalCount === 0) {
      return { completed: 0, avgScore: '0%' };
    }
    const sum = completed.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return {
      completed: totalCount,
      avgScore: `${Math.round(sum / totalCount)}%`,
    };
  }, [historyAttempts]);

  return (
    <div className="dashboard-view mock-tests-view">
      <section className="mock-tests-hero">
        <span className="feature-pill">Dynamic Module</span>
        <h1>Mock Tests & Assessments</h1>
        <p>Practice with auto-graded tests and track your progress</p>
      </section>

      {/* Stats Summary cards (hidden if inside an active quiz) */}
      {!activeAttempt ? (
        <section className="mock-tests-stats">
          <div className="mock-stat-card">
            <strong>{tests.length}</strong>
            <span>Available Tests</span>
          </div>
          <div className="mock-stat-card">
            <strong>{calculatedStats.completed}</strong>
            <span>Completed</span>
          </div>
          <div className="mock-stat-card">
            <strong>{calculatedStats.avgScore}</strong>
            <span>Your Avg Score</span>
          </div>
          <div className="mock-stat-card">
            <strong>{profile?.profile?.gpa ? profile.profile.gpa.toFixed(2) : '3.75'}</strong>
            <span>Current GPA</span>
          </div>
        </section>
      ) : null}

      {/* Main Content Area */}
      {!activeAttempt ? (
        <>
          {/* Navigation Tabs */}
          <div className="notice-filter-tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className={`notice-filter-pill ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Mock Tests
            </button>
            <button
              type="button"
              className={`notice-filter-pill ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                loadHistory();
              }}
            >
              My Attempts History
            </button>
          </div>

          {activeTab === 'browse' ? (
            <section className="mock-tests-grid">
              {loadingTests ? (
                <div className="dashboard-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading tests...</span>
                </div>
              ) : tests.length ? (
                tests.map((test) => (
                  <article key={test._id || test.title} className="mock-test-card">
                    <div className="mock-test-head">
                      <div>
                        <h3>{test.title}</h3>
                        <span>{test.courseCode}</span>
                      </div>
                      <span className="mock-badge">{test.difficulty || 'General'}</span>
                    </div>
                    <div className="mock-test-metrics">
                      <div>
                        <small>Questions</small>
                        <strong>{test.questions}</strong>
                      </div>
                      <div>
                        <small>Duration</small>
                        <strong>{test.durationMinutes} min</strong>
                      </div>
                      <div>
                        <small>Difficulty</small>
                        <strong>{test.difficulty}</strong>
                      </div>
                      <div>
                        <small>Avg Score</small>
                        <strong>{test.avgScore}%</strong>
                      </div>
                    </div>
                    <p style={{ margin: '1rem 0', fontSize: '13px', color: '#667085' }}>
                      🔥 {test.participants || 0} students attempted this test
                    </p>
                    <button
                      type="button"
                      className="primary-pill"
                      disabled={test.questions === 0}
                      onClick={() => handleStart(test._id)}
                    >
                      {test.questions === 0 ? 'No Questions' : 'Start Test'}
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-state">No mock tests available yet.</div>
              )}
            </section>
          ) : (
            // Attempts History list
            <section className="notice-list-board">
              {loadingHistory ? (
                <div className="dashboard-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading attempts history...</span>
                </div>
              ) : historyAttempts.length ? (
                historyAttempts.map((attempt) => (
                  <article key={attempt._id} className="notice-card" style={{ padding: '1.25rem' }}>
                    <div className="notice-content" style={{ width: '100%' }}>
                      <div className="notice-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>{attempt.testId?.title || 'Mock Test'}</h3>
                        <span
                          className={`priority-pill ${attempt.status === 'completed' ? 'low' : 'high'}`}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {attempt.status}
                        </span>
                      </div>
                      <p style={{ margin: '0.5rem 0', fontSize: '14px', color: '#475467' }}>
                        Course: <strong>{attempt.testId?.courseCode || 'N/A'}</strong> · Finished on:{' '}
                        {new Date(attempt.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="notice-meta" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '13px' }}>
                        <span>📊 Score: <strong>{attempt.score}%</strong></span>
                        <span>✅ Correct: <strong>{attempt.correctAnswers} / {attempt.totalQuestions}</strong></span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="notice-empty">
                  <strong>No mock test attempts recorded yet.</strong>
                  <span>Attempts will show up here after you complete a test.</span>
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        // ACTIVE QUIZ INTERFACE
        <section className="quiz-container" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          {loadingQuestions ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
              <span>Preparing questions...</span>
            </div>
          ) : quizResult ? (
            // Result View Summary
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: quizResult.score >= 70 ? '#ecfdf3' : '#fef3f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: `4px solid ${quizResult.score >= 70 ? '#d1fadf' : '#fee4e2'}`,
                }}
              >
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: quizResult.score >= 70 ? '#039855' : '#d92d20' }}>
                  {quizResult.score}%
                </span>
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>Test Completed!</h2>
              <p style={{ color: '#475467', marginBottom: '1.5rem' }}>
                You scored <strong>{quizResult.score}%</strong> on this assessment.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  fontSize: '14px',
                }}
              >
                <div>
                  <span style={{ color: '#667085', display: 'block' }}>Correct Answers</span>
                  <strong style={{ fontSize: '18px' }}>
                    {quizResult.correctAnswers} / {quizResult.totalQuestions}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#667085', display: 'block' }}>Result Status</span>
                  <strong style={{ fontSize: '18px', color: quizResult.score >= 70 ? '#039855' : '#d92d20' }}>
                    {quizResult.score >= 70 ? 'PASS' : 'FAIL'}
                  </strong>
                </div>
              </div>
              <button type="button" className="primary-pill" onClick={handleBackToBrowse} style={{ padding: '0.75rem 2rem' }}>
                Back to Mock Tests
              </button>
            </div>
          ) : questions.length > 0 ? (
            // Active Question Panel
            <div className="card" style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f2f4f7',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <h3 style={{ margin: 0 }}>Question {currentIdx + 1} of {questions.length}</h3>
                <span style={{ fontSize: '14px', color: '#667085', fontWeight: '500' }}>
                  ⏳ time Limit: {activeAttempt.testId?.durationMinutes || 60}m
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', backgroundColor: '#f2f4f7', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--accent-color, #f05a28)',
                    width: `${((currentIdx + 1) / questions.length) * 100}%`,
                    transition: 'width 0.3s ease',
                  }}
                ></div>
              </div>

              {/* Question Text */}
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#101828' }}>
                {questions[currentIdx].questionText}
              </h2>

              {/* Options Listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                {questions[currentIdx].options.map((option, oIdx) => {
                  const isChecked = selectedAnswers[currentIdx] === oIdx;
                  return (
                    <label
                      key={oIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        border: `1.5px solid ${isChecked ? 'var(--accent-color, #f05a28)' : '#eaecf0'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: isChecked ? '#fffafd' : '#fff',
                        fontWeight: isChecked ? '600' : '400',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${currentIdx}`}
                        checked={isChecked}
                        onChange={() => handleSelectOption(currentIdx, oIdx)}
                        style={{
                          accentColor: 'var(--accent-color, #f05a28)',
                          width: '18px',
                          height: '18px',
                        }}
                      />
                      <span style={{ fontSize: '15px', color: '#344054' }}>{option}</span>
                    </label>
                  );
                })}
              </div>

              {/* Footer controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCancelTest}
                  style={{ border: '1px solid #d0d5dd', color: '#344054' }}
                >
                  Exit Test
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((i) => i - 1)}
                  >
                    Previous
                  </button>
                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      className="primary-pill"
                      onClick={() => setCurrentIdx((i) => i + 1)}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary-pill"
                      disabled={submitting}
                      onClick={handleSubmit}
                      style={{ backgroundColor: '#12b76a', border: 'none' }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">No questions found in this test.</div>
          )}
        </section>
      )}
    </div>
  );
}
