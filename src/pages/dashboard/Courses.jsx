const courses = [
  {
    id: 'cse-3411',
    title: 'Data Structures & Algorithms',
    code: 'CSE 3411',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 3411/CSI 311 (H): Data Structures & Algo',
    accent: 'orange',
  },
  {
    id: 'cse-2123',
    title: 'Fall 25 CSE 123/EEE 2123 (E): Electronics',
    code: 'CSE 2123',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 123/EEE 2123 (E): Electronics',
    accent: 'blue',
  },
  {
    id: 'cse-3412',
    title: 'Fall 25 CSE 3412/CSI 312 (A): System Analysis',
    code: 'CSE 3412',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 3412/CSI 312 (A): System Analysis',
    accent: 'sunset',
  },
  {
    id: 'cse-4165',
    title: 'Fall 25 CSE 4165/CSE 465 (K): Web Programming',
    code: 'CSE 4165',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 4165/CSE 465 (K): Web Programming',
    accent: 'amber',
  },
  {
    id: 'math-2205',
    title: 'Fall 25 MATH 2205/STAT 205 (D): Probability',
    code: 'CSE 2205',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 MATH 2205/STAT 205 (D): Probability',
    accent: 'gold',
  },
  {
    id: 'cse-3412-lab',
    title: 'Data Structures & Algorithms Lab',
    code: 'CSE 3412',
    dept: 'Dept. of CSE',
    footer: 'Fall 25 CSE 3412/CSI 312 (Lab): DS&A Lab',
    accent: 'gold',
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
  return (
    <div className="dashboard-view courses-view">
      <section className="courses-hero">
        <h1>My Course&apos;s</h1>
        <div className="courses-toolbar">
          <div className="courses-search">
            <span aria-hidden="true">🔍</span>
            <input type="search" placeholder="Search course ...." />
          </div>
          <button type="button" className="courses-filter">
            Filter ....
          </button>
        </div>
      </section>

      <section className="courses-list-header">
        <h2>Showing Course&apos;s</h2>
      </section>

      <section className="courses-grid">
        {courses.map((course) => (
          <article
            key={course.id}
            className={`course-card-large ${accentClassMap[course.accent] || ''}`}
          >
            <div className="course-card-top">
              <div className="course-card-title">
                <span className="course-icon">📁</span>
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.code}</span>
                </div>
              </div>
              <button type="button" className="course-options" aria-label="Course options">
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
