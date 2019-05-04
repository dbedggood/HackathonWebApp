'use strict';

// [START app]
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

app.get('/', (req, res) => {
  res.send('Hello from App Engine!');
});

app.get('/now', (req, res) => {
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

  pgPool.query('SELECT NOW() as now', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.send(req.route);
      res.send(JSON.stringify(results[0]));
    }
  });

});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// [END app]

module.exports = app;
