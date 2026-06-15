import { useState, useMemo, useEffect } from 'react';
import { auth } from '../../firebase';


const accentClassMap = {
  orange: 'course-accent-orange',
  blue: 'course-accent-blue',
  sunset: 'course-accent-sunset',
  amber: 'course-accent-amber',
  gold: 'course-accent-gold',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState(null);

  const [courseAssignments, setCourseAssignments] = useState([]);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [submissionText, setSubmissionText] = useState('');

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/courses', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (courseId) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/assignments?courseId=${courseId}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load assignments');
      }
      const data = await response.json();
      setCourseAssignments(data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadCourses();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(course => 
        course.title.toLowerCase().includes(lowerQuery) ||
        course.code.toLowerCase().includes(lowerQuery) ||
        course.dept.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [courses, searchQuery]);

  const handleCourseClick = async (course) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/courses?id=${course.id}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load course details');
      }
      const data = await response.json();
      setActiveCourse(data);
      await loadAssignments(course.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeCourseView = () => {
    setActiveCourse(null);
    setCourseAssignments([]);
    setSubmittingAssignmentId(null);
    setSubmissionText('');
  };

  const handleDownloadMaterial = () => {
    alert('Downloading course materials...');
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    if (!submissionText.trim()) {
      alert('Submission text cannot be empty');
      return;
    }
    try {
      const token = await getToken();
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          assignmentId,
          submissionText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit assignment');
      }

      alert('Assignment submitted successfully!');
      setSubmittingAssignmentId(null);
      setSubmissionText('');
      if (activeCourse) {
        await loadAssignments(activeCourse.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && !activeCourse) {
    return (
      <div className="dashboard-loading" style={{ padding: '40px 0', textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <span>Loading courses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state" style={{ padding: '40px 0', textAlign: 'center', color: '#d92d20' }}>
        {error}
      </div>
    );
  }

  if (activeCourse) {
    return (
      <div className="dashboard-view course-detail-view">
        <button type="button" onClick={closeCourseView} style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#0052cc', fontWeight: 'bold' }}>
          ← Back to Courses
        </button>
        <div className={`course-card-large ${accentClassMap[activeCourse.accent] || ''}`} style={{ marginBottom: '30px' }}>
          <div className="course-card-top">
            <div className="course-card-title">
              <span className="course-icon">📁</span>
              <div>
                <strong>{activeCourse.title}</strong>
                <span>{activeCourse.code}</span>
              </div>
            </div>
          </div>
          <span className="course-dept">{activeCourse.dept}</span>
          {activeCourse.progress !== undefined && (
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '13px', color: '#ffffff', opacity: 0.9 }}>Course Progress: {activeCourse.progress}%</span>
              <div style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '4px', height: '6px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${activeCourse.progress}%`, backgroundColor: '#ffffff', height: '100%' }} />
              </div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#101828' }}>
              Assignments ({courseAssignments.length})
            </h3>
            
            {courseAssignments.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {courseAssignments.map((assignment) => (
                  <div key={assignment.id} style={{ border: '1px solid #eaecf0', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#344054' }}>{assignment.title}</h4>
                        <span style={{ fontSize: '12px', color: '#667085' }}>
                          Due: {new Date(assignment.deadline).toLocaleString()}
                        </span>
                      </div>
                      
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: assignment.status === 'Submitted' ? '#ecfdf3' : '#fffaeb',
                        color: assignment.status === 'Submitted' ? '#027a48' : '#b54708',
                        border: `1px solid ${assignment.status === 'Submitted' ? '#abfcd3' : '#fec84b'}`,
                      }}>
                        {assignment.status}
                      </span>
                    </div>
                    
                    <p style={{ margin: 0, fontSize: '14px', color: '#475467' }}>{assignment.description}</p>
                    
                    {assignment.status === 'Submitted' && (
                      <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #12b76a', marginTop: '4px' }}>
                        <strong style={{ fontSize: '12px', color: '#344054', display: 'block', marginBottom: '4px' }}>Your Submission:</strong>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475467', whiteSpace: 'pre-wrap' }}>{assignment.submissionText}</p>
                        <span style={{ fontSize: '11px', color: '#667085', display: 'block', marginTop: '6px' }}>
                          Submitted on: {new Date(assignment.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {assignment.status === 'Pending' && submittingAssignmentId !== assignment.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittingAssignmentId(assignment.id);
                          setSubmissionText('');
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#ff7a00',
                          border: 'none',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginTop: '6px'
                        }}
                      >
                        Submit Answer
                      </button>
                    )}
                    
                    {submittingAssignmentId === assignment.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#344054' }}>
                          Enter submission text:
                          <textarea
                            rows="4"
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '1px solid #d0d5dd',
                              fontSize: '14px',
                              outline: 'none',
                              marginTop: '6px',
                              boxSizing: 'border-box'
                            }}
                            placeholder="Type your submission here..."
                          />
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleAssignmentSubmit(assignment.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#ff7a00',
                              border: 'none',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubmittingAssignmentId(null)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              border: '1px solid #d0d5dd',
                              color: '#344054',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#667085', fontSize: '14px' }}>No assignments posted for this course.</p>
            )}
          </div>
          
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#101828' }}>Course Materials</h3>
            <p style={{ margin: '0 0 16px 0', color: '#475467', fontSize: '14px' }}>Access syllabus, lecture slides, and reading materials.</p>
            <button type="button" className="primary-pill" onClick={handleDownloadMaterial}>View Materials</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view courses-view">
      <section className="courses-hero">
        <h1>My Course&apos;s</h1>
        <div className="courses-toolbar">
          <div className="courses-search">
            <span aria-hidden="true">🔍</span>
            <input 
              type="search" 
              placeholder="Search course ...." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="courses-filter" onClick={() => alert('Filter options: Department, Semester')}>
            Filter ....
          </button>
        </div>
      </section>

      <section className="courses-list-header">
        <h2>Showing Course&apos;s</h2>
      </section>

      <section className="courses-grid">
        {filteredCourses.length ? (
          filteredCourses.map((course) => (
            <article
              key={course.id}
              className={`course-card-large ${accentClassMap[course.accent] || ''}`}
              onClick={() => handleCourseClick(course)}
              style={{ cursor: 'pointer' }}
            >
              <div className="course-card-top">
                <div className="course-card-title">
                  <span className="course-icon">📁</span>
                  <div>
                    <strong>{course.title}</strong>
                    <span>{course.code}</span>
                  </div>
                </div>
                <button type="button" className="course-options" aria-label="Course options" onClick={(e) => { e.stopPropagation(); alert(`Options for ${course.title}`); }}>
                  ⋮
                </button>
              </div>
              <span className="course-dept">{course.dept}</span>
              <div className="course-footer-pill">{course.footer}</div>
            </article>
          ))
        ) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#667085' }}>
            No courses enrolled.
          </div>
        )}
      </section>
    </div>
  );
}
