'use strict';

const ProjectRepository = require('../repositories/ProjectRepository');

class ProjectService {
  async listProjects() {
    return ProjectRepository.findAll();
  }

  async createProject({ name }, userId) {
    return ProjectRepository.create({ name, owner_id: userId });
  }
}

module.exports = new ProjectService();