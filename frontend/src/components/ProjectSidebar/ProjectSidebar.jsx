import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, selectProject } from '../../store/projectsSlice';

function ProjectSidebar() {
  const dispatch = useDispatch();
  const { items, selected, status } = useSelector((state) => state.projects);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProjects());
  }, [dispatch, status]);

  return (
    <nav aria-label="プロジェクト一覧">
      <h2>プロジェクト</h2>
      {status === 'loading' && <p>読み込み中...</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((project) => (
          <li key={project.id}>
            <button
              onClick={() => dispatch(selectProject(project))}
              style={{
                fontWeight: selected?.id === project.id ? 'bold' : 'normal',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                width: '100%',
                textAlign: 'left',
              }}
            >
              {project.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default ProjectSidebar;