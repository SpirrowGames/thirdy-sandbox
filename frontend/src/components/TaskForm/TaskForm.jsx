import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createTask } from '../../store/tasksSlice';

/**
 * タスク作成フォームコンポーネント。
 * @param {{ projectId: number, onClose: () => void }} props
 */
function TaskForm({ projectId, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    try {
      await dispatch(
        createTask({ ...form, project_id: projectId })
      ).unwrap();
      onClose?.();
    } catch (err) {
      setError(err?.message || '作成に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="タスク作成フォーム">
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      <div>
        <label htmlFor="title">タイトル *</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="description">説明</label>
        <textarea id="description" name="description" value={form.description} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="deadline">期限</label>
        <input id="deadline" name="deadline" type="datetime-local" value={form.deadline} onChange={handleChange} />
      </div>
      <button type="submit">作成</button>
      <button type="button" onClick={onClose}>キャンセル</button>
    </form>
  );
}

export default TaskForm;