import { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

const fallbackProfile = {
  tabs: [
    'Student Accounts',
    'Transport Registration',
    'Result',
    'Registration',
  ],
  stats: {
    cgpa: 3.44,
    completedCredits: 70,
    balance: 0,
  },
  advisor: {
    name: 'Akbor Ali',
    initials: 'AKI',
    email: 'sjsakjd@cse.uiu.ac.bd',
    room: '123 (D)',
    phone: 'xxxxxxxxxxxx',
  },
  resultSummary: {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
    scores: [2.8, 3.0, 3.2, 3.1, 3.4],
  },
  attendanceSummary: {
    label: 'No attendance data available',
  },
  profileInfo: {
    fullName: 'John Smith',
    studentId: '01122XXXX',
    dob: '',
    phone: '',
    bio: '',
    skills: [],
    linkedinUrl: '',
    avatarUrl: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
  },
};

export default function ProfilePage() {
  useProfile();
  const [profile, setProfile] = useState(fallbackProfile);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const [resultsData, setResultsData] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [editForm, setEditForm] = useState({
    phone: '',
    bio: '',
    dob: '',
    linkedinUrl: '',
    avatarUrl: '',
    skillsString: '',
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setProfile(fallbackProfile);
        return;
      }

      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Unable to load profile');
      }

      const payload = await response.json();
      const p = payload.profile || fallbackProfile;
      setProfile(p);

      // Populate form fields
      setEditForm({
        phone: p.profileInfo.phone || '',
        bio: p.profileInfo.bio || '',
        dob: p.profileInfo.dob || '',
        linkedinUrl: p.profileInfo.linkedinUrl || '',
        avatarUrl: p.profileInfo.avatarUrl || '',
        skillsString: (p.profileInfo.skills || []).join(', '),
      });

      if (p.role === 'student') {
        loadAttendance();
        loadResults();
      } else {
        setAttendanceLoading(false);
        setResultsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setProfile(fallbackProfile);
      setAttendanceLoading(false);
      setResultsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Unable to load attendance');
      }
      const data = await response.json();
      setAttendanceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadResults = async () => {
    setResultsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/results', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Unable to load results');
      }
      const data = await response.json();
      setResultsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadProfile();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token required');
      }

      const skillsArray = editForm.skillsString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: editForm.phone,
          bio: editForm.bio,
          dob: editForm.dob,
          linkedinUrl: editForm.linkedinUrl,
          avatarUrl: editForm.avatarUrl,
          skills: skillsArray,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student profile');
      }

      const payload = await response.json();
      setProfile(payload.profile);
      setEditMode(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-view profile-view">
      <section className="profile-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Profile</h1>
          {!editMode ? (
            <div className="profile-tabs">
              {profile.tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`profile-tab ${tab === profile.tabs[0] ? 'active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#667085' }}>Edit your contact and student profile detail</p>
          )}
        </div>

        {!editMode ? (
          <button
            type="button"
            className="primary-pill"
            onClick={() => setEditMode(true)}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-color, #f05a28)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Edit Profile
          </button>
        ) : null}
      </section>

      {successMsg ? (
        <div style={{ color: '#039855', backgroundColor: '#ecfdf3', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
          {successMsg}
        </div>
      ) : null}

      {errorMsg ? (
        <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
          {errorMsg}
        </div>
      ) : null}

      {!editMode ? (
        <>
          <section className="profile-stats">
            {profile.role === 'admin' ? (
              <>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Total Students:</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                    {profile.stats.totalStudents}
                  </strong>
                  <small>Active Directory</small>
                </article>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Total Faculty:</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                    {profile.stats.totalFaculty}
                  </strong>
                  <small>Academic Roster</small>
                </article>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Total Courses:</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                    {profile.stats.totalCourses}
                  </strong>
                  <small>Active Curriculum</small>
                </article>
                <article className="profile-stat-card profile-stat-red">
                  <span>Total Enrollments:</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                    {profile.stats.totalEnrollments}
                  </strong>
                  <small>Student course registrations</small>
                </article>
              </>
            ) : profile.role === 'faculty' ? (
              <>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Designation:</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                    {profile.stats.designation}
                  </strong>
                  <small>{profile.stats.department}</small>
                </article>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Office Room:</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>
                    {profile.stats.officeLocation}
                  </strong>
                  <small>Main Campus</small>
                </article>
                <article className="profile-stat-card profile-stat-red">
                  <span>Account Status</span>
                  <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>Active</strong>
                  <small>Faculty Portal</small>
                </article>
              </>
            ) : (
              <>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Transcript CGPA:</span>
                  <strong>
                    {resultsLoading ? '...' : (resultsData?.stats?.cgpa ?? profile.stats.cgpa).toFixed(2)}
                  </strong>
                  <small>Completed Credit: {resultsLoading ? '...' : (resultsData?.stats?.totalCredits ?? profile.stats.completedCredits)}</small>
                </article>
                <article className="profile-stat-card profile-stat-orange">
                  <span>Current Balance:</span>
                  <strong>{profile.stats.balance.toFixed(2)}</strong>
                  <small>Negative (-) balance means advance payment</small>
                </article>
                <article className="profile-stat-card profile-stat-red">
                  <span>For online payment</span>
                  <button type="button" className="profile-action">Click Here</button>
                </article>
              </>
            )}
          </section>

          <section className="profile-grid">
            {profile.role === 'admin' ? (
              // Admin does not have Advisor or Office panels
              null
            ) : profile.role === 'faculty' ? (
              <article className="profile-panel">
                <h2>Office & Academic Details:</h2>
                <div className="profile-info-row">
                  <span>Designation</span>
                  <strong>{profile.profileInfo.designation}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Office Location</span>
                  <strong>{profile.profileInfo.officeLocation}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Department</span>
                  <strong>{profile.profileInfo.department}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Contact Number</span>
                  <strong>{profile.profileInfo.phone || 'N/A'}</strong>
                </div>
              </article>
            ) : (
              <>
                <article className="profile-panel">
                  <h2>Advisor Information:</h2>
                  <div className="profile-info-row">
                    <span>Advisor Name</span>
                    <strong>{profile.advisor.name}</strong>
                  </div>
                  <div className="profile-info-row">
                    <span>Advisor Initial</span>
                    <strong>{profile.advisor.initials}</strong>
                  </div>
                  <div className="profile-info-row">
                    <span>Email Address</span>
                    <strong>{profile.advisor.email}</strong>
                  </div>
                  <div className="profile-info-row">
                    <span>Room No</span>
                    <strong>{profile.advisor.room}</strong>
                  </div>
                  <div className="profile-info-row">
                    <span>Contact Number</span>
                    <strong>{profile.advisor.phone}</strong>
                  </div>
                </article>

                <article className="profile-panel">
                  <h2>Result Summary:</h2>
                  <div className="profile-chart">
                    {resultsLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                        <div className="loading-spinner"></div>
                      </div>
                    ) : resultsData && resultsData.stats.semesters.length > 0 ? (
                      [...resultsData.stats.semesters]
                        .sort((a, b) => a.semester.localeCompare(b.semester))
                        .map((sem) => (
                          <div key={sem.semester} className="profile-chart-point">
                            <div style={{ height: `${sem.gpa * 18}px` }} title={`GPA: ${sem.gpa}`} />
                            <span>{sem.semester}</span>
                          </div>
                        ))
                    ) : (
                      profile.resultSummary.scores.map((score, index) => (
                        <div key={`${score}-${index}`} className="profile-chart-point">
                          <div style={{ height: `${score * 18}px` }} />
                          <span>{profile.resultSummary.labels[index]}</span>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </>
            )}

            <article className="profile-panel" style={profile.role === 'admin' ? { gridColumn: '1 / -1' } : {}}>
              <h2>Profile Information:</h2>
              <div className="profile-info-card">
                <div className="profile-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile.profileInfo.avatarUrl ? (
                    <img
                      src={profile.profileInfo.avatarUrl}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(profile.profileInfo.fullName)
                  )}
                </div>
                <div>
                  <strong>{profile.profileInfo.fullName}</strong>
                  {profile.role === 'admin' ? (
                    <>
                      <span>Role: Administrator</span>
                      <small>Email & Department</small>
                      <p>{profile.profileInfo.email} · {profile.profileInfo.department}</p>
                    </>
                  ) : profile.role === 'faculty' ? (
                    <>
                      <span>Designation: {profile.profileInfo.designation}</span>
                      <small>Department & Office</small>
                      <p>{profile.profileInfo.department} · {profile.profileInfo.officeLocation}</p>
                    </>
                  ) : (
                    <>
                      <span>ID: {profile.profileInfo.studentId}</span>
                      <small>Department & Year</small>
                      <p>{profile.profileInfo.department} · {profile.profileInfo.year}</p>
                    </>
                  )}
                  
                  {profile.profileInfo.dob ? (
                    <>
                      <small>DOB</small>
                      <p>{profile.profileInfo.dob}</p>
                    </>
                  ) : null}

                  {profile.profileInfo.phone ? (
                    <>
                      <small>Phone</small>
                      <p>{profile.profileInfo.phone}</p>
                    </>
                  ) : null}

                  {profile.profileInfo.linkedinUrl ? (
                    <>
                      <small>LinkedIn</small>
                      <p>
                        <a href={profile.profileInfo.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color, #f05a28)' }}>
                          View Profile
                        </a>
                      </p>
                    </>
                  ) : null}
                </div>
              </div>

              {profile.profileInfo.bio ? (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eaecf0', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '14px', color: '#667085', margin: '0 0 0.5rem' }}>Biography</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#344054', lineHeight: '1.5' }}>{profile.profileInfo.bio}</p>
                </div>
              ) : null}

              {profile.profileInfo.skills?.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '14px', color: '#667085', margin: '0 0 0.5rem' }}>Skills</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.profileInfo.skills.map((skill) => (
                      <span
                        key={skill}
                        style={{ padding: '4px 10px', backgroundColor: '#f2f4f7', borderRadius: '16px', fontSize: '12px', color: '#344054', fontWeight: '500' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>

            {profile.role === 'student' && (
              <>
                <article className="profile-panel" style={{ gridColumn: '1 / -1' }}>
                  <h2>Attendance Summary:</h2>
                  {attendanceLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                      <span>Loading attendance...</span>
                    </div>
                  ) : attendanceData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #eaecf0', textAlign: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#667085', fontWeight: '500' }}>Overall Attendance</span>
                          <strong style={{ display: 'block', fontSize: '24px', color: 'var(--accent-color, #f05a28)', marginTop: '8px' }}>
                            {attendanceData.stats.overall.percentage}%
                          </strong>
                        </div>
                        
                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #eaecf0', textAlign: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#667085', fontWeight: '500' }}>Classes Present</span>
                          <strong style={{ display: 'block', fontSize: '24px', color: '#027a48', marginTop: '8px' }}>
                            {attendanceData.stats.overall.present}
                          </strong>
                        </div>
                        
                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #eaecf0', textAlign: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#667085', fontWeight: '500' }}>Classes Late</span>
                          <strong style={{ display: 'block', fontSize: '24px', color: '#b54708', marginTop: '8px' }}>
                            {attendanceData.stats.overall.late}
                          </strong>
                        </div>
                        
                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #eaecf0', textAlign: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#667085', fontWeight: '500' }}>Classes Absent</span>
                          <strong style={{ display: 'block', fontSize: '24px', color: '#d92d20', marginTop: '8px' }}>
                            {attendanceData.stats.overall.absent}
                          </strong>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px solid #eaecf0', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#344054', margin: '0 0 12px 0' }}>Per Course Attendance</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {attendanceData.stats.courses.map((course) => (
                            <div key={course.courseCode} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#475467' }}>
                                  {course.courseCode} - {course.courseTitle}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-color, #f05a28)' }}>
                                  {course.percentage}%
                                </span>
                              </div>
                              
                              <div style={{ width: '100%', backgroundColor: '#f2f4f7', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${course.percentage}%`,
                                  backgroundColor: course.percentage >= 75 ? '#12b76a' : course.percentage >= 50 ? '#f79009' : '#f04438',
                                  height: '100%',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{ fontSize: '11px', color: '#667085' }}>
                                {course.present} Present, {course.late} Late, {course.absent} Absent (Total classes: {course.total})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p style={{ margin: 0, color: '#667085' }}>No attendance summary available.</p>
                  )}
                </article>

                <article className="profile-panel" style={{ gridColumn: '1 / -1' }}>
                  <h2>Results & Academic Transcript:</h2>
                  {resultsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                      <span>Loading transcript...</span>
                    </div>
                  ) : resultsData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#344054', margin: '0 0 12px 0' }}>Semester GPA Cards</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                          {resultsData.stats.semesters.map((sem) => (
                            <div key={sem.semester} style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #eaecf0', textAlign: 'center' }}>
                              <span style={{ fontSize: '13px', color: '#667085', fontWeight: '600' }}>{sem.semester}</span>
                              <strong style={{ display: 'block', fontSize: '24px', color: 'var(--accent-color, #f05a28)', marginTop: '8px' }}>
                                {sem.gpa.toFixed(2)}
                              </strong>
                              <span style={{ display: 'block', fontSize: '11px', color: '#667085', marginTop: '4px' }}>
                                Credits: {sem.earnedCredits} / {sem.attemptedCredits}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #eaecf0', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#344054', margin: '0 0 12px 0' }}>Transcript Table</h3>
                        <div style={{ overflowX: 'auto', border: '1px solid #eaecf0', borderRadius: '8px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #eaecf0', color: '#475467', fontWeight: '600' }}>
                                <th style={{ padding: '12px 16px' }}>Semester</th>
                                <th style={{ padding: '12px 16px' }}>Course Code</th>
                                <th style={{ padding: '12px 16px' }}>Course Title</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Credits</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Grade</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Grade Point</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resultsData.results.map((r) => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #eaecf0', color: '#344054' }}>
                                  <td style={{ padding: '12px 16px' }}>{r.semester}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{r.courseCode}</td>
                                  <td style={{ padding: '12px 16px' }}>{r.courseTitle}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{r.credit}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      backgroundColor: r.grade === 'F' ? '#fef3f2' : '#ecfdf3',
                                      color: r.grade === 'F' ? '#d92d20' : '#027a48'
                                    }}>
                                      {r.grade}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>{r.gradePoint.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: '#667085' }}>No result data available.</p>
                  )}
                </article>
              </>
            )}
          </section>
        </>
      ) : (
        // EDIT MODE INTERFACE FORM
        <section className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', borderRadius: '16px' }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="profile-avatar">Profile Image URL</label>
                <input
                  id="profile-avatar"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '15px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="profile-phone">Phone Number</label>
                  <input
                    id="profile-phone"
                    type="text"
                    placeholder="+880 17XX-XXXXXX"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '15px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="profile-dob">Date of Birth</label>
                  <input
                    id="profile-dob"
                    type="text"
                    placeholder="01 September, 2000"
                    value={editForm.dob}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '15px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="profile-linkedin">LinkedIn URL</label>
                <input
                  id="profile-linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={editForm.linkedinUrl}
                  onChange={(e) => setEditForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '15px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="profile-skills">Skills (Comma-separated)</label>
                <input
                  id="profile-skills"
                  type="text"
                  placeholder="JavaScript, Python, React, Database"
                  value={editForm.skillsString}
                  onChange={(e) => setEditForm(prev => ({ ...prev, skillsString: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '15px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="profile-bio">Biography</label>
                <textarea
                  id="profile-bio"
                  placeholder="Describe yourself..."
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '15px', outline: 'none', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  style={{ padding: '10px 16px', border: '1px solid #d0d5dd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#344054' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: 'var(--accent-color, #f05a28)', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          </form>
        </section>
      )}
    </div>
  );
}
