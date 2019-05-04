'use strict';

// [START app]

//SETUP SHIT
const express = require('express');
const pg = require('pg');
const app = express();
require('@google-cloud/debug-agent').start();


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



//ROUTES

//HELPER FUNCTIONS
function post_time_to(req, res) {
  const qry = 'INSERT INTO time_to(att_id, minutes_to_dest,time_created) SELECT att_id , $1, now() FROM attendees WHERE event_id = $2 AND person_id = $3;';
  pgPool.query(qry, [req.query.minutes_to_dest, req.query.event_id, req.query.person_id], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.status(201).send("Sent timestamp");
    }
  })
}
function ret_results_or_err(err, results) {
  if (err) {
    console.error(err);
    res.status(500).send(err);
  } else {
    res.send(JSON.stringify(results.rows));
  }
}

app.post('/events/:event_id/people/:person_id/time_to', post_time_to);
app.post('/people/:person_id/events/:event_id/time_to', post_time_to);

app.post('/events/:event_id', (req, res) => {
  const qry = "INSERT INTO attendees(event_id, person_id) VALUES($1,$2) RETURNING att_id";
  pgPool.query(qry, [req.params.event_id, req.query.person_id], ret_results_or_err)
})

app.post('/people/', (req, res) => {
  const qry = 'INSERT INTO people(person_name) VALUES($1)'
  pgPool.query(qry, [req.query.person], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.status(201).send("Person created");
    }
  });
});

app.get('/people/:person', (req, res) => {
  let qry = ''
  if (isFinite(req.params.person)) {
    qry = 'SELECT * FROM people WHERE person_id = $1';
  } else {
    qry = 'SELECT * FROM people WHERE person_name like $1';
  }
  pgPool.query(qry, [req.params.person], ret_results_or_err)
});

app.get('/events/:event_id', (req, res) => {
  const qry = 'SELECT * FROM events WHERE event_id = $1';
  pgPool.query(qry, [req.params.event_id], ret_results_or_err);
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
