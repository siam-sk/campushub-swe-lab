import { useState, useMemo } from 'react';

const courses = [
  {
    id: 'cse-3411',
    title: 'Data Structures & Algorithms',
    code: 'CSE 3411',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 3411/CSI 311 (H): Data Structures & Algo',
    accent: 'orange',
    materials: 12,
    assignments: 3
  },
  {
    id: 'cse-2123',
    title: 'Fall 25 CSE 123/EEE 2123 (E): Electronics',
    code: 'CSE 2123',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 123/EEE 2123 (E): Electronics',
    accent: 'blue',
    materials: 8,
    assignments: 1
  },
  {
    id: 'cse-3412',
    title: 'Fall 25 CSE 3412/CSI 312 (A): System Analysis',
    code: 'CSE 3412',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 3412/CSI 312 (A): System Analysis',
    accent: 'sunset',
    materials: 5,
    assignments: 2
  },
  {
    id: 'cse-4165',
    title: 'Fall 25 CSE 4165/CSE 465 (K): Web Programming',
    code: 'CSE 4165',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 4165/CSE 465 (K): Web Programming',
    accent: 'amber',
    materials: 15,
    assignments: 4
  },
  {
    id: 'math-2205',
    title: 'Fall 25 MATH 2205/STAT 205 (D): Probability',
    code: 'CSE 2205',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 MATH 2205/STAT 205 (D): Probability',
    accent: 'gold',
    materials: 6,
    assignments: 1
  },
  {
    id: 'cse-3412-lab',
    title: 'Data Structures & Algorithms Lab',
    code: 'CSE 3412',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 3412/CSI 312 (Lab): DS&A Lab',
    accent: 'gold',
    materials: 4,
    assignments: 5
  },
];

const accentClassMap = {
  orange: 'course-accent-orange',
  blue: 'course-accent-blue',
  sunset: 'course-accent-sunset',
  amber: 'course-accent-amber',
  gold: 'course-accent-gold',
};

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState(null);

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
  }, [searchQuery]);

  const handleCourseClick = (course) => {
    setActiveCourse(course);
  };

  const closeCourseView = () => {
    setActiveCourse(null);
  };

  const handleDownloadMaterial = () => {
    alert('Downloading course materials...');
  };

  const handleSubmitAssignment = () => {
    alert('Assignment submission portal opened.');
  };

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
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Course Materials ({activeCourse.materials})</h3>
            <p>Syllabus, lecture slides, and reading materials.</p>
            <button type="button" className="primary-pill" onClick={handleDownloadMaterial} style={{ marginTop: '10px' }}>View Materials</button>
          </div>
          <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Assignments ({activeCourse.assignments})</h3>
            <p>Pending tasks, lab reports, and project submissions.</p>
            <button type="button" className="secondary-pill" onClick={handleSubmitAssignment} style={{ marginTop: '10px' }}>Submit Assignment</button>
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
        {filteredCourses.map((course) => (
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
        ))}
      </section>
    </div>
  );
}
