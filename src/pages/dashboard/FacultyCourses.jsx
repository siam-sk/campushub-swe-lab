export default function FacultyCourses() {
  const courses = [
    {
      id: 1,
      name: 'Data Structures & Algorithms',
      code: 'CSE 201',
      students: 55,
      department: 'CSE',
      term: 'Spring 2026',
      accent: 'blue',
    },
    {
      id: 2,
      name: 'Database Management Systems',
      code: 'CSE 301',
      students: 45,
      department: 'CSE',
      term: 'Spring 2026',
      accent: 'green',
    },
    {
      id: 3,
      name: 'Software Engineering',
      code: 'CSE 401',
      students: 45,
      department: 'CSE',
      term: 'Spring 2026',
      accent: 'purple',
    },
  ];

  return (
    <div className="dashboard-view">
      <header className="page-header">
        <h1>Teaching Courses</h1>
        <p>Manage the courses you are teaching this semester.</p>
      </header>
      
      <section className="dashboard-grid">
        <div className="dashboard-column dashboard-column-main" style={{ flex: '1 1 100%' }}>
          <div className="course-list">
            {courses.map((course) => (
              <article key={course.id} className={`course-card accent-${course.accent}`}>
                <div className="course-head">
                  <div>
                    <h3>{course.name}</h3>
                    <p>{course.code} • {course.department}</p>
                  </div>
                  <span>{course.students} Students</span>
                </div>
                <div className="course-meta">Term: {course.term}</div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
                  <button className="primary" style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>Manage Course</button>
                  <button style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>View Students</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
