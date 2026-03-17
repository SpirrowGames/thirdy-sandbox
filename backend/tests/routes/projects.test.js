'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');

jest.mock('../../src/services/ProjectService');
jest.mock('../../src/middlewares/authenticate', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 1, role: 'owner' };
    next();
  },
}));

const ProjectService = require('../../src/services/ProjectService');
const app = createApp();

describe('GET /api/v1/projects', () => {
  it('プロジェクト一覧を返す', async () => {
    ProjectService.listProjects.mockResolvedValue([
      { id: 1, name: 'プロジェクトA', owner_id: 1 },
    ]);

    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer dummy');

    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
  });
});

describe('POST /api/v1/projects', () => {
  it('プロジェクトを作成して201を返す', async () => {
    const newProject = { id: 2, name: '新プロジェクト', owner_id: 1 };
    ProjectService.createProject.mockResolvedValue(newProject);

    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', 'Bearer dummy')
      .send({ name: '新プロジェクト' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('新プロジェクト');
  });

  it('nameが空の場合422を返す', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', 'Bearer dummy')
      .send({});

    expect(res.status).toBe(422);
  });
});