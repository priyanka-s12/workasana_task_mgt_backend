require('dotenv').config();
const { initializeDatabase } = require('./db/db.connect');
const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Team = require('./models/team.model');
const Project = require('./models/project.model');
const Owner = require('./models/owner.model');
const ProjectTag = require('./models/tag.model');
const Task = require('./models/task.model');
const UserData = require('./models/user.model');

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

//add members to team
// app.put('/teams/:id/owners', async (req, res) => {
//   const team = req.params.id;
//   const members = req.body;
//   console.log(team, members);
//   try {
//     const updatedTeam = await Team.findByIdAndUpdate(team, members, {
//       new: true,
//     });
//     // console.log(updatedTeam);

//     res.status(200).json(updatedTeam);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.get('/teams/:id/owners', async (req, res) => {
//   const team = req.params.id;
//   try {
//     console.log(team);
//     const allMembers = await Team.findOne({ _id: team }).populate('members');
//     // console.log(allMembers);
//     res.status(200).json(allMembers);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

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
    // console.log(name, project, team, owners, tags, status);
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
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...dataToUpdate, updatedAt: new Date() },
      {
        new: true,
      }
    );

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

//reporting
app.get('/report/last-week-completed', async (req, res) => {
  try {
    const completedTasks = await Task.find({ status: 'Completed' });

    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    console.log(sevenDaysAgoDate);

    const lastWeekCompletedTasks = completedTasks.filter(
      (task) => task.updatedAt >= sevenDaysAgoDate
    );
    console.log(lastWeekCompletedTasks);
    res.status(200).json(lastWeekCompletedTasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// app.get('/report/pending', async (req, res) => {
//   try {
//     const allTasks = await Task.find().populate('project');

//     const projects = allTasks.reduce((acc, curr) => {
//       const projectName = curr.project.name;
//       if (curr.status !== 'Completed') {
//         if (!acc[projectName]) {
//           acc[projectName] = 0;
//         }
//         acc[projectName] = acc[projectName] + curr.timeToComplete;
//       }
//       return acc;
//     }, {});
//     console.log(projects);

//     res.status(200).json(projects);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.get('/report/pending', async (req, res) => {
  try {
    const allTasks = await Task.find();
    const pendingWork = allTasks.reduce(
      (acc, curr) => acc + curr.timeToComplete,
      0
    );
    console.log(pendingWork);

    const completedTasks = await Task.find({ status: 'Completed' });
    console.log(completedTasks.length);
    // res.status(200).json(pendingWork);
    res.status(200).json({
      daysOfPendingWork: pendingWork,
      totalCompletedTasks: completedTasks.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/report/closed-by-team', async (req, res) => {
  try {
    const completedTasks = await Task.find({ status: 'Completed' }).populate(
      'team'
    );
    const totalTasks = completedTasks.reduce((acc, curr) => {
      const teamName = curr.team.name;
      acc[teamName] = (acc[teamName] || 0) + 1;
      return acc;
    }, {});
    console.log(totalTasks);
    res.status(200).json(totalTasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/report/closed-by-owner', async (req, res) => {
  try {
    const completedTasks = await Task.find({ status: 'Completed' }).populate(
      'owners'
    );

    const totalTasks = completedTasks.reduce((acc, curr) => {
      // console.log(curr);
      curr.owners.forEach((owner) => {
        const onweName = owner.name;
        acc[onweName] = (acc[onweName] || 0) + 1;
      });
      // console.log('acc:', acc);
      return acc;
    }, {});

    // console.log(totalTasks);
    res.status(200).json(totalTasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//register
app.post('/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
    } else {
      const existingUser = await UserData.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'Email is already registered.' });
      } else {
        const newUser = new UserData({ username, email, password });
        newUser.password = await bcrypt.hash(password, 10);
        await newUser.save();
        res
          .status(201)
          .json({ message: 'Registration Successful!!!', newUser });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      res.status(400).json({ message: 'All fields are required' });
    } else {
      const existingUser = await UserData.findOne({ email });

      if (
        !existingUser ||
        !(await bcrypt.compare(password, existingUser.password))
      ) {
        res.status(400).json({
          message: 'Invalid Credentials - either email or password is wrong.',
        });
      } else {
        const token = jwt.sign(
          {
            id: existingUser._id,
            email: existingUser.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Login Successful!!!', token });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const allUsers = await UserData.find();
    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//middleware to validate jwt token for protected routes
const verifyJWT = (req, res, next) => {
  //checks req headers has authorization or not
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    console.log(token);

    //verify jwt token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    //attached user information that pass to token while login to req object
    console.log('decoded token: ', decodedToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: 'Invalid token or token is expired.' });
  }
};

//protected route
app.get('/auth/me', verifyJWT, async (req, res) => {
  // const userDetails = req.user;
  // console.log(userDetails);
  const userId = req.user.id;

  try {
    const user = await UserData.findOne({ _id: userId });
    console.log(user);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
