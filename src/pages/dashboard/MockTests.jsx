import { useEffect, useState } from 'react';

const fallbackTests = [];

export default function MockTestsPage() {
  const [tests, setTests] = useState(fallbackTests);

  useEffect(() => {
    const controller = new AbortController();

    const loadTests = async () => {
      try {
        const response = await fetch('/api/tests', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load tests');
        }
        const payload = await response.json();
        setTests(payload.tests || fallbackTests);
      } catch {
        setTests(fallbackTests);
      }
    };

    loadTests();

    return () => controller.abort();
  }, []);

  const handleStart = async (testId) => {
    if (!testId) {
      return;
    }

    await fetch('/api/tests/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId, name: 'Student' }),
    });
  };

  return (
    <div className="dashboard-view mock-tests-view">
      <section className="mock-tests-hero">
        <span className="feature-pill">New Feature</span>
        <h1>Mock Tests & Assessments</h1>
        <p>Practice with auto-graded tests and track your progress</p>
      </section>

      <section className="mock-tests-stats">
        <div className="mock-stat-card">
          <strong>24</strong>
          <span>Total Tests</span>
        </div>
        <div className="mock-stat-card">
          <strong>12</strong>
          <span>Completed</span>
        </div>
        <div className="mock-stat-card">
          <strong>78%</strong>
          <span>Avg Score</span>
        </div>
        <div className="mock-stat-card">
          <strong>#12</strong>
          <span>Your Rank</span>
        </div>
      </section>

      <section className="mock-tests-grid">
        {tests.length ? (
          tests.map((test) => (
            <article key={test._id || test.title} className="mock-test-card">
              <div className="mock-test-head">
                <div>
                  <h3>{test.title}</h3>
                  <span>{test.courseCode}</span>
                </div>
                <span className="mock-badge">New</span>
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
              <p>{test.participants} students attempted this test</p>
              <button type="button" className="primary-pill" onClick={() => handleStart(test._id)}>
                Start Test
              </button>
            </article>
          ))
        ) : (
          <div className="empty-state">No mock tests available yet.</div>
        )}
      </section>
    </div>
  );
}
