import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
  backgroundColor: '#ffffff',
  padding: '28px',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '550px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  boxSizing: 'border-box',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const formGroupStyle = {
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#344054',
};

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d0d5dd',
  fontSize: '15px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function AdminHome() {
  const navigate = useNavigate();

  // Navigation states
  const [activeMenuTab, setActiveMenuTab] = useState('overview'); // 'overview', 'users', 'courses'
  const [activeUserRole, setActiveUserRole] = useState('student'); // 'student' or 'faculty'

  // Users Directory states
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Selected User Actions states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: '',
    year: '',
    semester: '',
    phone: '',
    bio: '',
  });

  // Courses Module states
  const [coursesList, setCoursesList] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showAssignFacultyModal, setShowAssignFacultyModal] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: '',
    code: '',
    dept: 'Computer Science and Engineering',
    footer: '',
    accent: 'blue',
  });
  const [assignForm, setAssignForm] = useState({ facultyEmail: '' });

  // Roster and Enrollment states
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterList, setRosterList] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [enrollForm, setEnrollForm] = useState({ studentId: '' });
  const [enrolling, setEnrolling] = useState(false);

  // Simulated Dashboard states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', role: 'student' });
  const [addingUser, setAddingUser] = useState(false);
  const [activities, setActivities] = useState([
    { id: 1, text: 'New Faculty Registered - Dr. Rahman joined the CS Department' },
    { id: 2, text: 'System Maintenance - Database backup completed' },
    { id: 3, text: 'Notice Board - Final exams schedule published' },
  ]);

  const [perms, setPerms] = useState({
    adminAccess: true,
    facultyAccess: true,
    studentAccess: true,
    writeAccess: true,
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const triggerReload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  // Fetch users (Triggered by directory views)
  useEffect(() => {
    let active = true;
    if (activeMenuTab === 'users') {
      const load = async () => {
        setLoadingUsers(true);
        try {
          const token = await getToken();
          if (!token) return;

          const res = await fetch(
            `/api/admin/users?role=${activeUserRole}&q=${encodeURIComponent(searchVal)}&dept=${encodeURIComponent(deptFilter)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok && active) {
            const data = await res.json();
            setUsersList(data.users || []);
          }
        } catch (err) {
          console.error('Failed to fetch users:', err);
        } finally {
          if (active) {
            setLoadingUsers(false);
          }
        }
      };
      load();
    }
    return () => {
      active = false;
    };
  }, [activeMenuTab, activeUserRole, searchVal, deptFilter, reloadTrigger]);

  // Fetch courses and faculty list (Triggered by courses view)
  useEffect(() => {
    let active = true;
    if (activeMenuTab === 'courses') {
      const load = async () => {
        setLoadingCourses(true);
        try {
          const token = await getToken();
          if (!token) return;

          const res = await fetch('/api/admin/courses', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok && active) {
            const data = await res.json();
            setCoursesList(data.courses || []);
          }
        } catch (err) {
          console.error('Failed to fetch courses:', err);
        } finally {
          if (active) {
            setLoadingCourses(false);
          }
        }
      };

      const loadFaculty = async () => {
        try {
          const token = await getToken();
          if (!token) return;

          const res = await fetch('/api/admin/users?role=faculty', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok && active) {
            const data = await res.json();
            setFacultyList(data.users || []);
          }
        } catch (err) {
          console.error('Failed to load faculty options:', err);
        }
      };

      load();
      loadFaculty();
    }
    return () => {
      active = false;
    };
  }, [activeMenuTab, reloadTrigger]);

  const handleEditOpen = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      department: user.department || '',
      year: user.year || '',
      semester: user.semester || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/users/${selectedUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        alert('User profile updated successfully.');
        setShowEditModal(false);
        triggerReload();
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.message || 'Failed to update user profile.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user details.');
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user profile?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/users/${user.uid}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        alert(`User is now ${newStatus}.`);
        triggerReload();
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseForm),
      });

      if (res.ok) {
        alert('Course created successfully.');
        setShowAddCourseModal(false);
        setCourseForm({
          title: '',
          code: '',
          dept: 'Computer Science and Engineering',
          footer: '',
          accent: 'blue',
        });
        triggerReload();
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.message || 'Failed to create course.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating course.');
    }
  };

  const handleEditCourseOpen = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title || '',
      code: course.code || '',
      dept: course.dept || 'Computer Science and Engineering',
      footer: course.footer || '',
      accent: course.accent || 'blue',
    });
    setShowEditCourseModal(true);
  };

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseForm),
      });

      if (res.ok) {
        alert('Course updated successfully.');
        setShowEditCourseModal(false);
        triggerReload();
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.message || 'Failed to update course.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating course details.');
    }
  };

  const handleAssignOpen = (course) => {
    setSelectedCourse(course);
    setAssignForm({ facultyEmail: course.facultyEmail || '' });
    setShowAssignFacultyModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/courses/${selectedCourse.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignForm),
      });

      if (res.ok) {
        alert('Faculty assignment updated.');
        setShowAssignFacultyModal(false);
        triggerReload();
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.message || 'Failed to assign faculty.');
      }
    } catch (err) {
      console.error(err);
      alert('Error assigning faculty.');
    }
  };

  const handleViewRosterOpen = async (course) => {
    setSelectedCourse(course);
    setRosterList([]);
    setRosterSearch('');
    setEnrollForm({ studentId: '' });
    setShowRosterModal(true);
    setLoadingRoster(true);

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/courses/${course.id}/roster`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRosterList(data.roster || []);
      } else {
        alert('Failed to load roster.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching course roster.');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollForm.studentId.trim()) {
      alert('Student ID is required.');
      return;
    }
    if (!selectedCourse) return;

    setEnrolling(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/courses/${selectedCourse.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: enrollForm.studentId.trim() })
      });

      if (res.ok) {
        alert('Student successfully enrolled.');
        setEnrollForm({ studentId: '' });
        // Reload roster and update main course list to refresh counts
        handleViewRosterOpen(selectedCourse);
        triggerReload();
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.message || 'Failed to enroll student.');
      }
    } catch (err) {
      console.error(err);
      alert('Error enrolling student.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email) return;
    setAddingUser(true);
    setTimeout(() => {
      setAddingUser(false);
      setActivities((prev) => [
        {
          id: Date.now(),
          text: `User Added - ${newUser.fullName} registered as ${newUser.role}`,
        },
        ...prev,
      ]);
      alert(`User ${newUser.fullName} successfully registered!`);
      setNewUser({ fullName: '', email: '', role: 'student' });
      setShowAddUserModal(false);
    }, 1000);
  };

  const handlePermsSave = (e) => {
    e.preventDefault();
    alert('Permissions updated successfully!');
    setShowPermsModal(false);
  };

  return (
    <div className="dashboard-content">
      <header className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Admin Control Panel</h1>
            <p>Manage users, course allocation, and system permissions.</p>
          </div>
          <div className="tab-menu" style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveMenuTab('overview')}
              className={`btn ${activeMenuTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveMenuTab('users')}
              className={`btn ${activeMenuTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            >
              Users Directory
            </button>
            <button
              onClick={() => setActiveMenuTab('courses')}
              className={`btn ${activeMenuTab === 'courses' ? 'btn-primary' : 'btn-outline'}`}
            >
              Courses
            </button>
          </div>
        </div>
      </header>

      {activeMenuTab === 'overview' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">1,245</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Courses</div>
              <div className="stat-value">84</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">System Status</div>
              <div className="stat-value" style={{ color: 'var(--success-color, green)' }}>
                Healthy
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-section col-span-2">
              <h2>Recent Activity</h2>
              <div className="card">
                <ul className="activity-list" style={{ listStyle: 'none', padding: 0 }}>
                  {activities.map((act) => (
                    <li key={act.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                      <strong>{act.text}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="dashboard-section">
              <h2>Quick Actions</h2>
              <div className="quick-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  + Add New User
                </button>
                <button
                  onClick={() => navigate('/dashboard/notice-board', { state: { openCreateModal: true } })}
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  + Create Global Notice
                </button>
                <button
                  onClick={() => setShowPermsModal(true)}
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  Manage Permissions
                </button>
              </div>
            </section>
          </div>
        </>
      ) : activeMenuTab === 'users' ? (
        <section className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${activeUserRole === 'student' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setActiveUserRole('student');
                  setUsersList([]);
                }}
              >
                Students
              </button>
              <button
                type="button"
                className={`btn ${activeUserRole === 'faculty' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setActiveUserRole('faculty');
                  setUsersList([]);
                }}
              >
                Faculty
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search name, ID or email..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d0d5dd',
                  fontSize: '14px',
                  width: '220px',
                }}
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d0d5dd',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">All Departments</option>
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="English Literature">English Literature</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Economics">Economics</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner" style={{ margin: 'auto' }}></div>
                <p style={{ marginTop: '10px', color: '#667085' }}>Loading user directory...</p>
              </div>
            ) : usersList.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #eaecf0' }}>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>
                      {activeUserRole === 'student' ? 'Student ID' : 'Faculty ID'}
                    </th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Full Name</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Department</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.uid} style={{ borderBottom: '1px solid #f2f4f7' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#344054' }}>
                        {activeUserRole === 'student' ? user.studentId : user.facultyId}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#344054' }}>{user.fullName}</td>
                      <td style={{ padding: '12px 16px', color: '#475467' }}>{user.department || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#475467' }}>{user.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: user.status === 'active' ? '#ecfdf3' : '#fef3f2',
                            color: user.status === 'active' ? '#027a48' : '#b42318',
                          }}
                        >
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewModal(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleEditOpen(user)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: user.status === 'active' ? '#fef3f2' : '#ecfdf3',
                              color: user.status === 'active' ? '#b42318' : '#027a48',
                              border: 'none',
                            }}
                            onClick={() => handleStatusToggle(user)}
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#667085' }}>
                No records match the current filters.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Academic Course List</h2>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddCourseModal(true)}>
              + Create Course
            </button>
          </div>

          <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
            {loadingCourses ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner" style={{ margin: 'auto' }}></div>
                <p style={{ marginTop: '10px', color: '#667085' }}>Loading course list...</p>
              </div>
            ) : coursesList.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #eaecf0' }}>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Code</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Title</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Department</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Faculty</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Students</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>Assignments</th>
                    <th style={{ padding: '12px 16px', color: '#475467', fontWeight: '600', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coursesList.map((course) => (
                    <tr key={course.id} style={{ borderBottom: '1px solid #f2f4f7' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#344054' }}>{course.code}</td>
                      <td style={{ padding: '12px 16px', color: '#344054' }}>{course.title}</td>
                      <td style={{ padding: '12px 16px', color: '#475467' }}>{course.dept}</td>
                      <td style={{ padding: '12px 16px', color: '#475467' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: course.facultyEmail ? '#ecfdf3' : '#fffaeb',
                            color: course.facultyEmail ? '#027a48' : '#b54708',
                            fontWeight: '500',
                          }}
                        >
                          {course.facultyName || 'Unassigned'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>
                        {course.studentCount}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475467', fontWeight: '600' }}>
                        {course.assignments || 0}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleEditCourseOpen(course)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleAssignOpen(course)}
                          >
                            Assign Faculty
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleViewRosterOpen(course)}
                          >
                            View Roster
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#667085' }}>No courses registered yet.</div>
            )}
          </div>
        </section>
      )}

      {/* CREATE COURSE MODAL */}
      {showAddCourseModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Create New Course</h2>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCourseSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. CSE 101"
                  style={inputStyle}
                  value={courseForm.code}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to Programming"
                  style={inputStyle}
                  value={courseForm.title}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Department</label>
                <select
                  style={inputStyle}
                  value={courseForm.dept}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, dept: e.target.value }))}
                  required
                >
                  <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                  <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="English Literature">English Literature</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Economics">Economics</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Schedule details / Footer text</label>
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed 10:00 AM"
                  style={inputStyle}
                  value={courseForm.footer}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, footer: e.target.value }))}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Card Accent Style</label>
                <select
                  style={inputStyle}
                  value={courseForm.accent}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, accent: e.target.value }))}
                >
                  <option value="blue">Blue</option>
                  <option value="emerald">Green</option>
                  <option value="indigo">Purple</option>
                  <option value="amber">Yellow</option>
                  <option value="rose">Red</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {showEditCourseModal && selectedCourse && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Edit Course Metadata</h2>
              <button
                type="button"
                onClick={() => setShowEditCourseModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditCourseSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Course Code</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={courseForm.code}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Course Title</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={courseForm.title}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Department</label>
                <select
                  style={inputStyle}
                  value={courseForm.dept}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, dept: e.target.value }))}
                  required
                >
                  <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                  <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="English Literature">English Literature</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Economics">Economics</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Schedule details / Footer text</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={courseForm.footer}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, footer: e.target.value }))}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Card Accent Style</label>
                <select
                  style={inputStyle}
                  value={courseForm.accent}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, accent: e.target.value }))}
                >
                  <option value="blue">Blue</option>
                  <option value="emerald">Green</option>
                  <option value="indigo">Purple</option>
                  <option value="amber">Yellow</option>
                  <option value="rose">Red</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN FACULTY MODAL */}
      {showAssignFacultyModal && selectedCourse && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Assign Instructor</h2>
              <button
                type="button"
                onClick={() => setShowAssignFacultyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Select Faculty Member</label>
                <select
                  style={inputStyle}
                  value={assignForm.facultyEmail}
                  onChange={(e) => setAssignForm({ facultyEmail: e.target.value })}
                >
                  <option value="">-- Unassigned (No instructor) --</option>
                  {facultyList.map((fac) => (
                    <option key={fac.id} value={fac.email}>
                      {fac.fullName} ({fac.facultyId || fac.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignFacultyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ROSTER MODAL */}
      {showRosterModal && selectedCourse && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Course Roster: {selectedCourse.title} ({selectedCourse.code})</h2>
              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>

            {/* ENROLL STUDENT FORM */}
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #eaecf0' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#344054' }}>Enroll New Student</h3>
              <form onSubmit={handleEnrollSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475467' }}>Student ID</label>
                  <input
                    type="text"
                    placeholder="Enter Student ID (e.g. CSE-26-101)"
                    style={{ ...inputStyle, padding: '8px 12px', fontSize: '14px' }}
                    value={enrollForm.studentId}
                    onChange={(e) => setEnrollForm({ studentId: e.target.value })}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '14px', height: '38px' }}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </form>
            </div>

            {/* SEARCH BOX FOR ROSTER */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search roster by ID, name, dept or email..."
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '14px' }}
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
              />
            </div>

            {/* ROSTER TABLE */}
            <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
              {loadingRoster ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner" style={{ margin: 'auto' }}></div>
                  <p style={{ marginTop: '10px', color: '#667085' }}>Loading roster...</p>
                </div>
              ) : (
                (() => {
                  const filtered = rosterList.filter(stud => {
                    const query = rosterSearch.toLowerCase();
                    return (
                      (stud.studentId || '').toLowerCase().includes(query) ||
                      (stud.fullName || '').toLowerCase().includes(query) ||
                      (stud.department || '').toLowerCase().includes(query) ||
                      (stud.email || '').toLowerCase().includes(query)
                    );
                  });

                  return filtered.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #eaecf0' }}>
                          <th style={{ padding: '10px 12px', color: '#475467', fontWeight: '600' }}>Student ID</th>
                          <th style={{ padding: '10px 12px', color: '#475467', fontWeight: '600' }}>Full Name</th>
                          <th style={{ padding: '10px 12px', color: '#475467', fontWeight: '600' }}>Department</th>
                          <th style={{ padding: '10px 12px', color: '#475467', fontWeight: '600' }}>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((stud) => (
                          <tr key={stud.email} style={{ borderBottom: '1px solid #f2f4f7' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#344054' }}>{stud.studentId}</td>
                            <td style={{ padding: '10px 12px', color: '#344054' }}>{stud.fullName}</td>
                            <td style={{ padding: '10px 12px', color: '#475467' }}>{stud.department}</td>
                            <td style={{ padding: '10px 12px', color: '#475467' }}>{stud.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#667085' }}>
                      {rosterList.length > 0 ? 'No matching students found.' : 'No students enrolled in this course yet.'}
                    </div>
                  );
                })()
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowRosterModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW USER MODAL */}
      {showViewModal && selectedUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>User Profile Details</h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>ID:</strong> {selectedUser.role === 'student' ? selectedUser.studentId : selectedUser.facultyId}
              </div>
              <div>
                <strong>Full Name:</strong> {selectedUser.fullName}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedUser.role}</span>
              </div>
              <div>
                <strong>Department:</strong> {selectedUser.department || 'N/A'}
              </div>
              {selectedUser.role === 'student' && (
                <>
                  <div>
                    <strong>Year/Semester:</strong> {selectedUser.year} - {selectedUser.semester}
                  </div>
                  <div>
                    <strong>GPA:</strong> {selectedUser.gpa || '0.0'}
                  </div>
                  <div>
                    <strong>Completed Credits:</strong> {selectedUser.completedCredits || '0'}
                  </div>
                </>
              )}
              <div>
                <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
              </div>
              <div>
                <strong>Bio:</strong> {selectedUser.bio || 'N/A'}
              </div>
              <div>
                <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedUser.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Edit User Details</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Department</label>
                <select
                  style={inputStyle}
                  value={editForm.department}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                  required
                >
                  <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                  <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="English Literature">English Literature</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Economics">Economics</option>
                </select>
              </div>

              {selectedUser.role === 'student' && (
                <>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Academic Year</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.year}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Academic Semester</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm.semester}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, semester: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div style={formGroupStyle}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  style={{ ...inputStyle, height: '80px', fontFamily: 'inherit' }}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Add New User</h2>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="user-name">Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  placeholder="Enter full name"
                  style={inputStyle}
                  value={newUser.fullName}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="user-email">Email Address</label>
                <input
                  id="user-email"
                  type="email"
                  placeholder="Enter email address"
                  style={inputStyle}
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="user-role">System Role</label>
                <select
                  id="user-role"
                  style={inputStyle}
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#344054',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--accent-color, #f05a28)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {addingUser ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PERMISSIONS MODAL */}
      {showPermsModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Manage Permissions</h2>
              <button
                type="button"
                onClick={() => setShowPermsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePermsSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={perms.adminAccess}
                    onChange={(e) => setPerms((prev) => ({ ...prev, adminAccess: e.target.checked }))}
                  />
                  <span>Allow Administrator Portal Access</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={perms.facultyAccess}
                    onChange={(e) => setPerms((prev) => ({ ...prev, facultyAccess: e.target.checked }))}
                  />
                  <span>Allow Faculty Dashboard Tools</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={perms.studentAccess}
                    onChange={(e) => setPerms((prev) => ({ ...prev, studentAccess: e.target.checked }))}
                  />
                  <span>Allow Student Dashboard Tools</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={perms.writeAccess}
                    onChange={(e) => setPerms((prev) => ({ ...prev, writeAccess: e.target.checked }))}
                  />
                  <span>Allow Database Mutation Operations</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowPermsModal(false)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d0d5dd',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#344054',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--accent-color, #f05a28)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
