require('dotenv').config();
const { initializeDatabase } = require('./db/db.connect');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 3000;

const Team = require('./models/team.model');
const Project = require('./models/project.model');
const Owner = require('./models/owner.model');
const ProjectTag = require('./models/tag.model');
const Task = require('./models/task.model');

const app = express();

const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

initializeDatabase();
app.listen(PORT, () => console.log(`Server is listening on port ${PORT} `));

app.get('/', (req, res) => res.send('Hello, Express'));

//team
app.post('/teams', async (req, res) => {
  const { name, description } = req.body;
  try {
    const newTeam = new Team({ name, description });
    await newTeam.save();
    res.status(201).json(newTeam);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/teams', async (req, res) => {
  try {
    const allTeams = await Team.find();
    res.status(200).json(allTeams);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//project
app.post('/projects', async (req, res) => {
  const { name, description } = req.body;
  try {
    const newProject = new Project({ name, description });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/projects', async (req, res) => {
  try {
    const allProjects = await Project.find();
    res.status(200).json(allProjects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//owner
app.post('/owners', async (req, res) => {
  const { name, email } = req.body;
  try {
    const newOwner = new Owner({ name, email });
    await newOwner.save();
    res.status(201).json(newOwner);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/owners', async (req, res) => {
  try {
    const allOwners = await Owner.find();
    res.status(200).json(allOwners);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//tag
app.post('/tags', async (req, res) => {
  const { name } = req.body;
  try {
    const newTag = new ProjectTag({ name });
    await newTag.save();
    res.status(201).json(newTag);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/tags', async (req, res) => {
  try {
    const allTags = await ProjectTag.find();
    res.status(200).json(allTags);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//task
app.post('/tasks', async (req, res) => {
  const { name, project, team, owners, tags, timeToComplete, status } =
    req.body;
  try {
    const newTask = new Task({
      name,
      project,
      team,
      owners,
      tags,
      timeToComplete,
      status,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/tasks', async (req, res) => {
  const { name, project, team, owners, tags, status } = req.query;
  try {
    console.log(name, project, team, owners, tags, status);
    const filter = {};
    if (name) {
      filter.name = name;
    }
    if (project) {
      filter.project = project;
    }
    if (status) {
      filter.status = status;
    }
    if (owners) {
      filter.owners = owners;
    }
    if (tags) {
      filter.tags = tags;
    }
    if (team) {
      filter.team = team;
    }
    const allTasks = await Task.find(filter)
      .populate('project')
      .populate('team')
      .populate('owners');
    res.status(200).json(allTasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const dataToUpdate = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(taskId, dataToUpdate, {
      new: true,
    });

    if (!updatedTask) {
      res.status(404).json({ error: `Task with ID ${taskId} not found.` });
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    const deleteTask = await Task.findByIdAndDelete(taskId);

    if (!deleteTask) {
      res.status(404).json({ error: `Task with ID ${taskId} not found.` });
    }

    res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
