const express = require('express')
const app = express()
const cors = require('cors')

const bodyparser = require('body-parser');
const crypto = require('crypto');
const { log, error } = require('console');

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const users = {};
const logs = {};
const listUser = [];


function generateId(){
  return crypto.randomBytes(3).toString('hex');
}

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.post('/api/users', (req, res)=>{
  const username = req.body.username;
  const _id = generateId();
  users[_id] = {username};
  logs[_id] = [];
  listUser.push({username, _id});
  res.json({username: username, _id: _id});
})

app.post('/api/users/:_id/exercises', (req, res)=>{
  const _id = req.params._id;
  const user = users[_id];

  if(!user){
    return res.status(400).json({error: 'User not found'});
  }

  const username = user.username;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date;

  if(!description ||isNaN(duration)){
    return res.json({error: 'Missing required fields'});
  }

  const exercisesDate = date ? new Date(date) : new Date();

  const exercises = {
    date: exercisesDate.toDateString(),
    duration,
    description
  }
  
  logs[_id].push(exercises);
  
  res.json({
    _id,
    username,
    date: exercises.date,
    duration: exercises.duration,
    description: exercises.description
  })
});

app.get('/api/users', (req, res)=>{
  res.json(listUser);
});

app.get('/api/users/:_id/logs', (req, res)=>{
  const _id = req.params._id;
  const user = users[_id];
  const userLogs = logs[_id];
  const {from, to, limit} = req.query;
  if(!user || !userLogs){
    return res.status(400).json({error: 'user not found'});
  }

  let filterLogs = userLogs;

  if(from){
    const fromDate = new Date(from);
    filterLogs = filterLogs.filter(log => new Date(log.date) >= fromDate);
  }

  if(to){
    const toDate = new Date(to);
    filterLogs = filterLogs.filter(log => new Date(log.date) <= toDate);
  }

  if(limit){
    filterLogs = filterLogs.slice(0, parseInt(limit));
  }
  
  res.json({
    username: user.username,
    count: filterLogs.length,
    _id: _id,
    log: filterLogs,
    from,
    to,
    limit: limit ? parseInt(limit) : undefined
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
