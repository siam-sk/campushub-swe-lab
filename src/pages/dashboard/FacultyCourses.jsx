import { useEffect, useState } from 'react';
import { auth } from '../../firebase';

export default function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Tab state inside Course Details
  const [activeTab, setActiveTab] = useState('assignments');

  // Attendance-related states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Results-related states
  const [resultsStudents, setResultsStudents] = useState([]);
  const [resultsStudentsLoading, setResultsStudentsLoading] = useState(false);
  const [publishSemester, setPublishSemester] = useState('Semester 4');
  const [finalScores, setFinalScores] = useState({});
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState('');
  const [publishError, setPublishError] = useState('');

  // Create Assignment Modal state
  const [showModal, setShowModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit Assignment Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Assignment Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // View Submissions Modal state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingStatus, setGradingStatus] = useState({});
  const [gradingError, setGradingError] = useState({});

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
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setCourses(payload.courses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const loadAssignments = async (courseId) => {
    setAssignmentsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/assignments?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setAssignments(payload.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const loadStudents = async (courseId) => {
    setStudentsLoading(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);

        const initial = {};
        (data.students || []).forEach((s) => {
          initial[s.email] = 'Present';
        });
        setAttendanceRecords(initial);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadResultsStudents = async (courseId) => {
    setResultsStudentsLoading(true);
    setPublishError('');
    setPublishSuccess('');
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/courses/${courseId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setResultsStudents(data.students || []);

        const initial = {};
        (data.students || []).forEach((s) => {
          initial[s.studentEmail] = s.finalScore !== null ? s.finalScore : '';
        });
        setFinalScores(initial);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResultsStudentsLoading(false);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setActiveTab('assignments');
    setStudents([]);
    setResultsStudents([]);
    loadAssignments(course.id);
  };

  const handleBackToList = () => {
    setSelectedCourse(null);
    setAssignments([]);
    setStudents([]);
    setResultsStudents([]);
    setActiveTab('assignments');
    loadCourses();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'attendance' && students.length === 0) {
      loadStudents(selectedCourse.id);
    } else if (tab === 'results' && resultsStudents.length === 0) {
      loadResultsStudents(selectedCourse.id);
    }
  };

  const handleStatusChange = (email, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [email]: status,
    }));
  };

  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const handleOpenEditModal = (assignment) => {
    setEditingAssignment({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      deadline: formatDateTimeLocal(assignment.deadline),
    });
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (assignment) => {
    setDeletingAssignment(assignment);
    setDeleteError('');
    setDeleteSuccess('');
    setShowDeleteModal(true);
  };

  const handleSaveEditAssignment = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editingAssignment.title.trim() || !editingAssignment.description.trim() || !editingAssignment.deadline) {
      setEditError('All fields are required');
      return;
    }

    setEditSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingAssignment.title.trim(),
          description: editingAssignment.description.trim(),
          deadline: editingAssignment.deadline,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update assignment');
      }

      setEditSuccess('Assignment updated successfully!');
      await loadAssignments(selectedCourse.id);
      setTimeout(() => {
        setShowEditModal(false);
        setEditingAssignment(null);
      }, 1500);
    } catch (err) {
      setEditError(err.message || 'An error occurred');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    setDeleteError('');
    setDeleteSuccess('');
    setDeleteSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch(`/api/assignments/${deletingAssignment.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete assignment');
      }

      setDeleteSuccess('Assignment deleted successfully!');
      await loadAssignments(selectedCourse.id);
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeletingAssignment(null);
      }, 1500);
    } catch (err) {
      setDeleteError(err.message || 'An error occurred');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignmentForSubmissions(assignment);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    setSubmissions([]);
    setGradingStatus({});
    setGradingError({});
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setSubmissions(payload.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleUpdateSubmissionGrade = async (submissionId, marks, feedback) => {
    setGradingStatus((prev) => ({ ...prev, [submissionId]: 'saving' }));
    setGradingError((prev) => ({ ...prev, [submissionId]: '' }));

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch(`/api/assignments/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marks: Number(marks),
          feedback: feedback || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save grade');
      }

      setGradingStatus((prev) => ({ ...prev, [submissionId]: 'saved' }));
      setTimeout(() => {
        setGradingStatus((prev) => ({ ...prev, [submissionId]: '' }));
      }, 3000);
    } catch (err) {
      setGradingStatus((prev) => ({ ...prev, [submissionId]: 'error' }));
      setGradingError((prev) => ({ ...prev, [submissionId]: err.message || 'Failed' }));
    }
  };

  const handleSubmissionFieldChange = (submissionId, field, value) => {
    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((sub) => {
        if (sub.id === submissionId) {
          return { ...sub, [field]: value };
        }
        return sub;
      })
    );
  };

  const handleSaveAttendance = async () => {
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');

      const recordsArray = Object.entries(attendanceRecords).map(([email, status]) => ({
        studentEmail: email,
        status,
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          date: attendanceDate,
          records: recordsArray,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save attendance');
      }

      setSaveSuccess('Attendance saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.message || 'An error occurred');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePublishResults = async () => {
    setPublishError('');
    setPublishSuccess('');

    const unsetMarks = Object.entries(finalScores).filter(
      ([, marks]) => marks === '' || marks === undefined
    );
    if (unsetMarks.length > 0) {
      setPublishError('Please enter final marks for all students before publishing.');
      return;
    }

    setPublishLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');

      const resultsArray = Object.entries(finalScores).map(([email, marks]) => ({
        studentEmail: email,
        marks: Number(marks),
      }));

      const response = await fetch('/api/results/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          semester: publishSemester,
          results: resultsArray,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to publish results');
      }

      setPublishSuccess('Results published and transcripts updated successfully!');
      setTimeout(() => setPublishSuccess(''), 3000);

      await loadResultsStudents(selectedCourse.id);
    } catch (err) {
      setPublishError(err.message || 'An error occurred');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newAssignment.title.trim() || !newAssignment.description.trim() || !newAssignment.deadline) {
      setFormError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Auth token missing');

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: newAssignment.title.trim(),
          description: newAssignment.description.trim(),
          deadline: newAssignment.deadline,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to create assignment');
      }

      setFormSuccess('Assignment created successfully!');
      setNewAssignment({ title: '', description: '', deadline: '' });

      await loadAssignments(selectedCourse.id);

      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <span>Loading courses...</span>
      </div>
    );
  }

  // COURSE DETAIL VIEW
  if (selectedCourse) {
    return (
      <div className="dashboard-view">
        <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <button
              onClick={handleBackToList}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-color, #f05a28)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '8px',
              }}
            >
              &larr; Back to Teaching Courses
            </button>
            <h1>{selectedCourse.title}</h1>
            <p style={{ margin: '4px 0 0 0', color: '#667085' }}>
              {selectedCourse.code} &bull; {selectedCourse.dept} &bull; {selectedCourse.students} Enrolled Students
            </p>
          </div>
        </header>

        {/* Course detail view sub tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eaecf0', marginBottom: '20px' }}>
          <button
            onClick={() => handleTabChange('assignments')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'assignments' ? '2px solid var(--accent-color, #f05a28)' : '2px solid transparent',
              color: activeTab === 'assignments' ? 'var(--accent-color, #f05a28)' : '#667085',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            Assignments
          </button>
          <button
            onClick={() => handleTabChange('attendance')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'attendance' ? '2px solid var(--accent-color, #f05a28)' : '2px solid transparent',
              color: activeTab === 'attendance' ? 'var(--accent-color, #f05a28)' : '#667085',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            Attendance
          </button>
          <button
            onClick={() => handleTabChange('results')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'results' ? '2px solid var(--accent-color, #f05a28)' : '2px solid transparent',
              color: activeTab === 'results' ? 'var(--accent-color, #f05a28)' : '#667085',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            Results
          </button>
        </div>

        <section className="dashboard-grid">
          <div className="dashboard-column dashboard-column-main" style={{ flex: '1 1 65%' }}>
            {activeTab === 'assignments' && (
              // ASSIGNMENTS TAB PANEL
              <div className="panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Course Assignments</h2>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent-color, #f05a28)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                    }}
                  >
                    + Add Assignment
                  </button>
                </div>

                {assignmentsLoading ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                    <span>Loading assignments...</span>
                  </div>
                ) : assignments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {assignments.map((assignment) => (
                      <article
                        key={assignment.id}
                        style={{
                          padding: '16px',
                          border: '1px solid #eaecf0',
                          borderRadius: '8px',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#101828' }}>
                            {assignment.title}
                          </h4>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              padding: '4px 8px',
                              backgroundColor: '#ecfdf3',
                              color: '#027a48',
                              borderRadius: '12px',
                            }}
                          >
                            {assignment.submissionsCount} Submissions
                          </span>
                        </div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475467', lineHeight: '1.5' }}>
                          {assignment.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#667085', fontWeight: '500' }}>
                            📅 Deadline: {new Date(assignment.deadline).toLocaleString()}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleViewSubmissions(assignment)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #d0d5dd',
                                borderRadius: '4px',
                                backgroundColor: '#f9fafb',
                                color: '#101828',
                                cursor: 'pointer',
                                fontWeight: '600',
                              }}
                            >
                              View Submissions
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(assignment)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #d0d5dd',
                                borderRadius: '4px',
                                backgroundColor: '#fff',
                                color: '#344054',
                                cursor: 'pointer',
                                fontWeight: '600',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(assignment)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #fda29b',
                                borderRadius: '4px',
                                backgroundColor: '#fef3f2',
                                color: '#b54708',
                                cursor: 'pointer',
                                fontWeight: '600',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, padding: '30px 0', textAlign: 'center', color: '#667085' }}>
                    No assignments created for this course yet.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              // ATTENDANCE TAB PANEL
              <div className="panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Mark Attendance</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="attendance-date" style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }}>Date:</label>
                    <input
                      id="attendance-date"
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d0d5dd',
                        outline: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                {saveSuccess && (
                  <div style={{ color: '#027a48', backgroundColor: '#ecfdf3', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {saveSuccess}
                  </div>
                )}

                {saveError && (
                  <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {saveError}
                  </div>
                )}

                {studentsLoading ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                    <span>Loading student roster...</span>
                  </div>
                ) : students.length > 0 ? (
                  <div>
                    <div style={{ overflowX: 'auto', border: '1px solid #eaecf0', borderRadius: '8px', marginBottom: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #eaecf0', color: '#475467', fontWeight: '600' }}>
                            <th style={{ padding: '12px 16px' }}>Student Name</th>
                            <th style={{ padding: '12px 16px' }}>Email</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '280px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.email} style={{ borderBottom: '1px solid #eaecf0', color: '#344054' }}>
                              <td style={{ padding: '12px 16px', fontWeight: '600' }}>{student.name}</td>
                              <td style={{ padding: '12px 16px' }}>{student.email}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.email, 'Present')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d0d5dd',
                                      backgroundColor: attendanceRecords[student.email] === 'Present' ? '#ecfdf3' : '#fff',
                                      color: attendanceRecords[student.email] === 'Present' ? '#027a48' : '#344054',
                                      borderColor: attendanceRecords[student.email] === 'Present' ? '#027a48' : '#d0d5dd',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.email, 'Late')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d0d5dd',
                                      backgroundColor: attendanceRecords[student.email] === 'Late' ? '#fef0c7' : '#fff',
                                      color: attendanceRecords[student.email] === 'Late' ? '#b54708' : '#344054',
                                      borderColor: attendanceRecords[student.email] === 'Late' ? '#b54708' : '#d0d5dd',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Late
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.email, 'Absent')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid #d0d5dd',
                                      backgroundColor: attendanceRecords[student.email] === 'Absent' ? '#fef3f2' : '#fff',
                                      color: attendanceRecords[student.email] === 'Absent' ? '#d92d20' : '#344054',
                                      borderColor: attendanceRecords[student.email] === 'Absent' ? '#d92d20' : '#d0d5dd',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleSaveAttendance}
                        disabled={saveLoading}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--accent-color, #f05a28)',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '15px',
                        }}
                      >
                        {saveLoading ? 'Saving...' : 'Save Attendance'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, padding: '30px 0', textAlign: 'center', color: '#667085' }}>
                    No students currently enrolled in this course.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              // RESULTS TAB PANEL
              <div className="panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Publish Student Results</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="publish-semester" style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }}>Semester:</label>
                    <select
                      id="publish-semester"
                      value={publishSemester}
                      onChange={(e) => setPublishSemester(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d0d5dd',
                        outline: 'none',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                      }}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                    </select>
                  </div>
                </div>

                {publishSuccess && (
                  <div style={{ color: '#027a48', backgroundColor: '#ecfdf3', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {publishSuccess}
                  </div>
                )}

                {publishError && (
                  <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {publishError}
                  </div>
                )}

                {resultsStudentsLoading ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                    <span>Loading student records...</span>
                  </div>
                ) : resultsStudents.length > 0 ? (
                  <div>
                    <div style={{ overflowX: 'auto', border: '1px solid #eaecf0', borderRadius: '8px', marginBottom: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #eaecf0', color: '#475467', fontWeight: '600' }}>
                            <th style={{ padding: '12px 16px' }}>Student Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Assignments</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Attendance</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '180px' }}>Final Marks (0-100)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultsStudents.map((student) => (
                            <tr key={student.studentEmail} style={{ borderBottom: '1px solid #eaecf0', color: '#344054' }}>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontWeight: '600' }}>{student.studentName}</div>
                                <div style={{ fontSize: '12px', color: '#667085' }}>{student.studentEmail}</div>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>
                                {student.assignmentScore}%
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>
                                {student.attendanceScore}%
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={finalScores[student.studentEmail] ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFinalScores((prev) => ({
                                        ...prev,
                                        [student.studentEmail]: val === '' ? '' : Math.min(100, Math.max(0, Number(val))),
                                      }));
                                    }}
                                    placeholder="Enter marks"
                                    style={{
                                      width: '100px',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      border: '1px solid #d0d5dd',
                                      outline: 'none',
                                      fontSize: '14px',
                                      textAlign: 'center',
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handlePublishResults}
                        disabled={publishLoading}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--accent-color, #f05a28)',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '15px',
                        }}
                      >
                        {publishLoading ? 'Publishing...' : 'Publish Results'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, padding: '30px 0', textAlign: 'center', color: '#667085' }}>
                    No students currently enrolled in this course.
                  </p>
                )}
              </div>
            )}
          </div>

          <aside className="dashboard-column dashboard-column-side" style={{ flex: '1 1 30%' }}>
            <div className="panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>Course Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <small style={{ color: '#667085', display: 'block', fontSize: '11px', fontWeight: '500' }}>COURSE CODE</small>
                  <strong style={{ fontSize: '14px', color: '#344054' }}>{selectedCourse.code}</strong>
                </div>
                <div>
                  <small style={{ color: '#667085', display: 'block', fontSize: '11px', fontWeight: '500' }}>DEPARTMENT</small>
                  <strong style={{ fontSize: '14px', color: '#344054' }}>{selectedCourse.dept}</strong>
                </div>
                <div>
                  <small style={{ color: '#667085', display: 'block', fontSize: '11px', fontWeight: '500' }}>SEMESTER/TERM</small>
                  <strong style={{ fontSize: '14px', color: '#344054' }}>{selectedCourse.footer || 'Spring 2026'}</strong>
                </div>
                <div>
                  <small style={{ color: '#667085', display: 'block', fontSize: '11px', fontWeight: '500' }}>ENROLLED STUDENTS</small>
                  <strong style={{ fontSize: '14px', color: '#344054' }}>{selectedCourse.students} Enrolled</strong>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* CREATE ASSIGNMENT MODAL OVERLAY */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '500px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#101828' }}>Create Assignment</h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#667085',
                    padding: '4px',
                  }}
                >
                  &times;
                </button>
              </div>

              {formError && (
                <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div style={{ color: '#027a48', backgroundColor: '#ecfdf3', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleCreateAssignment}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="assignment-title">
                      Assignment Title
                    </label>
                    <input
                      id="assignment-title"
                      type="text"
                      placeholder="e.g., Midterm Project Proposal"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, title: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d0d5dd',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="assignment-desc">
                      Description
                    </label>
                    <textarea
                      id="assignment-desc"
                      placeholder="Outline instructions, criteria, and requirements..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, description: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d0d5dd',
                        fontSize: '15px',
                        outline: 'none',
                        minHeight: '100px',
                        resize: 'vertical',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="assignment-deadline">
                      Submission Deadline
                    </label>
                    <input
                      id="assignment-deadline"
                      type="datetime-local"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, deadline: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d0d5dd',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: '10px 16px',
                        border: '1px solid #d0d5dd',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#344054',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'var(--accent-color, #f05a28)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      {submitting ? 'Creating...' : 'Create Assignment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT ASSIGNMENT MODAL OVERLAY */}
        {showEditModal && editingAssignment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '500px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#101828' }}>Edit Assignment</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#667085',
                    padding: '4px',
                  }}
                >
                  &times;
                </button>
              </div>

              {editError && (
                <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div style={{ color: '#027a48', backgroundColor: '#ecfdf3', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {editSuccess}
                </div>
              )}

              <form onSubmit={handleSaveEditAssignment}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="edit-title">
                      Assignment Title
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      placeholder="e.g., Midterm Project Proposal"
                      value={editingAssignment.title}
                      onChange={(e) => setEditingAssignment((prev) => ({ ...prev, title: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d0d5dd',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="edit-desc">
                      Description
                    </label>
                    <textarea
                      id="edit-desc"
                      placeholder="Outline instructions, criteria, and requirements..."
                      value={editingAssignment.description}
                      onChange={(e) => setEditingAssignment((prev) => ({ ...prev, description: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d0d5dd',
                        fontSize: '15px',
                        outline: 'none',
                        minHeight: '100px',
                        resize: 'vertical',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="edit-deadline">
                      Submission Deadline
                    </label>
                    <input
                      id="edit-deadline"
                      type="datetime-local"
                      value={editingAssignment.deadline}
                      onChange={(e) => setEditingAssignment((prev) => ({ ...prev, deadline: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d0d5dd',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      style={{
                        padding: '10px 16px',
                        border: '1px solid #d0d5dd',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#344054',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      style={{
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'var(--accent-color, #f05a28)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      {editSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL OVERLAY */}
        {showDeleteModal && deletingAssignment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '440px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#b54708' }}>Delete Assignment</h3>

              {deleteError && (
                <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {deleteError}
                </div>
              )}

              {deleteSuccess && (
                <div style={{ color: '#027a48', backgroundColor: '#ecfdf3', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {deleteSuccess}
                </div>
              )}

              <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475467', lineHeight: '1.5' }}>
                This will permanently delete:
                <strong style={{ display: 'block', margin: '8px 0', color: '#101828' }}>&bull; {deletingAssignment.title}</strong>
                <strong style={{ display: 'block', margin: '4px 0', color: '#101828' }}>&bull; All student submissions</strong>
                This action cannot be undone. Do you wish to proceed?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#344054',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAssignment}
                  disabled={deleteSubmitting}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#d92d20',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {deleteSubmitting ? 'Deleting...' : 'Delete Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMISSIONS LIST & GRADING MODAL OVERLAY */}
        {showSubmissionsModal && selectedAssignmentForSubmissions && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '800px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#101828' }}>
                    Submissions: {selectedAssignmentForSubmissions.title}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#667085' }}>
                    Review, grade, and write feedback for student submissions.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissionsModal(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#667085',
                    padding: '4px',
                  }}
                >
                  &times;
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
                {submissionsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                    <span>Loading submissions...</span>
                  </div>
                ) : submissions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {submissions.map((sub) => {
                      const status = gradingStatus[sub.id] || '';
                      const errorMsg = gradingError[sub.id] || '';
                      return (
                        <div
                          key={sub.id}
                          style={{
                            padding: '16px',
                            border: '1px solid #eaecf0',
                            borderRadius: '8px',
                            backgroundColor: '#f9fafb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <strong style={{ fontSize: '15px', color: '#101828' }}>{sub.studentName}</strong>
                              <span style={{ fontSize: '13px', color: '#667085', marginLeft: '8px' }}>({sub.studentEmail})</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#667085' }}>
                              Submitted: {new Date(sub.submittedAt).toLocaleString()}
                            </span>
                          </div>

                          <div style={{ backgroundColor: '#fff', border: '1px solid #eaecf0', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#344054', whiteSpace: 'pre-wrap' }}>
                            {sub.submissionText}
                          </div>

                          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#344054' }}>Marks (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={sub.marks ?? ''}
                                onChange={(e) => handleSubmissionFieldChange(sub.id, 'marks', e.target.value)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #d0d5dd',
                                  fontSize: '14px',
                                  outline: 'none',
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 300px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#344054' }}>Feedback</label>
                              <input
                                type="text"
                                placeholder="Good analysis, check details..."
                                value={sub.feedback ?? ''}
                                onChange={(e) => handleSubmissionFieldChange(sub.id, 'feedback', e.target.value)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #d0d5dd',
                                  fontSize: '14px',
                                  outline: 'none',
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateSubmissionGrade(sub.id, sub.marks, sub.feedback)}
                                disabled={status === 'saving'}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: 'var(--accent-color, #f05a28)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                }}
                              >
                                {status === 'saving' ? 'Saving...' : 'Save Grade'}
                              </button>
                              
                              {status === 'saved' && (
                                <span style={{ color: '#027a48', fontSize: '13px', fontWeight: '500' }}>✓ Saved</span>
                              )}
                              
                              {status === 'error' && (
                                <span style={{ color: '#d92d20', fontSize: '13px', fontWeight: '500' }}>⚠ {errorMsg || 'Failed'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ padding: '40px 0', textAlign: 'center', color: '#667085', margin: 0 }}>
                    No student submissions found for this assignment yet.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, borderTop: '1px solid #eaecf0', paddingTop: '16px' }}>
                <button
                  onClick={() => setShowSubmissionsModal(false)}
                  style={{
                    padding: '10px 18px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    color: '#344054',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT: COURSE LIST VIEW
  return (
    <div className="dashboard-view">
      <header className="page-header">
        <h1>Teaching Courses</h1>
        <p>Manage the courses you are teaching this semester.</p>
      </header>

      <section className="dashboard-grid">
        <div className="dashboard-column dashboard-column-main" style={{ flex: '1 1 100%' }}>
          <div className="course-list">
            {courses.length > 0 ? (
              courses.map((course) => (
                <article key={course.id} className={`course-card accent-${course.accent || 'blue'}`}>
                  <div className="course-head">
                    <div>
                      <h3>{course.title}</h3>
                      <p>
                        {course.code} &bull; {course.dept}
                      </p>
                    </div>
                    <span>{course.students} Students</span>
                  </div>
                  <div className="course-meta">Term: {course.footer || 'Spring 2026'}</div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
                    <button
                      className="primary"
                      onClick={() => handleSelectCourse(course)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'var(--accent-color, #f05a28)',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Manage Course
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p style={{ padding: '16px', color: '#667085' }}>No teaching courses found.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
