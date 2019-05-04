'use strict';

// [START app]

//SETUP SHIT
const express = require('express');
const pg = require('pg');
const bodyParser = require('body-parser');
const app = express();
require('@google-cloud/debug-agent').start();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const connectionName =
  process.env.INSTANCE_CONNECTION_NAME || 'hackathon-239523:australia-southeast1:hackathon-db';
const dbUser = process.env.SQL_USER || 'postgres';
const dbPassword = process.env.SQL_PASSWORD || '12345';
const dbName = process.env.SQL_NAME || 'hdb';

const pgConfig = {
  max: 1,
  user: dbUser,
  password: dbPassword,
  database: dbName,
};

if (process.env.NODE_ENV === 'production') {
  pgConfig.host = `/cloudsql/${connectionName}`;
}

// Connection pools reuse connections between invocations,
// and handle dropped or expired connections automatically.
let pgPool;

// Initialize the pool lazily, in case SQL access isn't needed for this
// GCF instance. Doing so minimizes the number of active SQL connections,
// which helps keep your GCF instances under SQL connection limits.
if (!pgPool) {
  pgPool = new pg.Pool(pgConfig);
}

//HELPER FUNCTIONS
function post_time_to(req, res) {
  //TODO
  const qry = 'INSERT INTO time_to(att_id, minutes_to_dest,time_created) SELECT att_id , $1, now() FROM attendees WHERE event_id = $2 AND person_id = $3;';
  pgPool.query(qry, [req.query.minutes_to_dest, req.params.event_id, req.params.person_id], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.status(201).send("Sent timestamp");
    }
  })
}
function ret_results_or_err(err, results, res) {
  if (err) {
    console.error(err);
    res.status(500).send(err);
  } else {
    res.send(JSON.stringify(results.rows));
  }
}

//ROUTES

app.post('/events/:event_id/people/:person_id/time_to', post_time_to);
app.post('/people/:person_id/events/:event_id/time_to', post_time_to);

app.post('/events/:event_id/people', (req, res) => {
  const qry = "INSERT INTO attendees(event_id, person_id) VALUES($1,$2) RETURNING att_id";
  pgPool.query(qry, [req.params.event_id, req.query.person_id], (err, results) => { ret_results_or_err(err, results, res) })
})

app.post('/people/', (req, res) => {
  const qry = 'INSERT INTO people(person_name) VALUES($1) RETURNING person_id;'
  pgPool.query(qry, [req.query.person_id], (err, results) => { ret_results_or_err(err, results, res) });
});

app.get('/events/:event_id/people', (req, res) => {
  const qry = `
  SELECT minutes_to_dest, age(now(),time_created) as age, people.person_id, person_name 
  FROM time_to 
    INNER JOIN attendees on time_to.att_id = attendees.att_id 
    INNER JOIN people on attendees.person_id = people.person_id
    INNER JOIN events on attendees.event_id = events.event_id;`
  pgPool.query(qry, (err, results) => { ret_results_or_err(err, results, res) });
})

app.get('/people/:person', (req, res) => {
  let qry = ''
  if (isFinite(req.params.person)) {
    qry = 'SELECT * FROM people WHERE person_id = $1';
  } else {
    qry = 'SELECT * FROM people WHERE person_name like $1';
  }
  pgPool.query(qry, [req.params.person], (err, results) => { ret_results_or_err(err, results, res) });
});

app.get('/events/:event_id', (req, res) => {
  const qry = 'SELECT * FROM events WHERE event_id = $1';
  pgPool.query(qry, [req.params.event_id], (err, results) => { ret_results_or_err(err, results, res) });
});

app.get('/events/', (req, res) => {
  const qry = 'SELECT * FROM events';
  pgPool.query(qry, (err, results) => { ret_results_or_err(err, results, res) });
});

app.post('/events/', (req, res) => {
  const qry = 'INSERT INTO events(event_name, event_description, lat, long, start_time) VALUES($1,$2,$3,$4, now())';
  pgPool.query(qry, [req.query.event.event_name, req.query.event.event_description, req.query.event.lat, req.query.event.long], (err, results) => { ret_results_or_err(err, results, res) });
});

app.get('/now', (req, res) => {
  pgPool.query('SELECT NOW() as now', (err, results) => {
    res.send(JSON.stringify(results.rows));
  });
});

app.get('test', (req, res) => {
  res.send('Hello from App Engine!');
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});



// [END app]


module.exports = app;
