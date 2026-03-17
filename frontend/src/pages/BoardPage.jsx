import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../store/tasksSlice';
import { useSocket } from '../hooks/useSocket';
import KanbanBoard from '../components/KanbanBoard/KanbanBoard';
import ProjectSidebar from '../components/ProjectSidebar/ProjectSidebar';

function BoardPage() {
  const dispatch = useDispatch();
  const { items: tasks, status } = useSelector((state) => state.tasks);
  const selectedProject = useSelector((state) => state.projects.selected);
  const socketRef = useSocket(selectedProject?.id || null);

  useEffect(() => {
    if (selectedProject?.id) {
      dispatch(fetchTasks({ project_id: selectedProject.id }));
    }
  }, [dispatch, selectedProject?.id]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 220, padding: 16, borderRight: '1px solid #ddd' }}>
        <ProjectSidebar />
      </aside>
      <main style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {!selectedProject && <p>左のサイドバーからプロジェクトを選択してください</p>}
        {selectedProject && status === 'loading' && <p>読み込み中...</p>}
        {selectedProject && status === 'succeeded' && (
          <KanbanBoard tasks={tasks} socket={socketRef} />
        )}
      </main>
    </div>
  );
}

export default BoardPage;