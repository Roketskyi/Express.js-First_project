const express = require('express');
const { MongoClient } = require('mongodb');
const mongodb = require('mongodb');
const app = express();

const IP = 'localhost';
const PORT = 3000;

const url = "mongodb+srv://romanroketskiy05:Roman080805MLP@reynes.73bphty.mongodb.net/?retryWrites=true&w=majority";
const dbName = 'myProject';
const client = new MongoClient(url);

async function connectToDb() {
  await client.connect();
  console.log('Connected to MongoDB server');
}

connectToDb().catch(console.error);

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello world!');
})

app.post('/add-array', async (req, res) => {
  const data = req.body;
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');
  
  try {
    const result = await collection.insertMany(data);

    res.status(201).send(`${JSON.stringify(data)}`);
  } catch (err) {
    console.error(err);
    
    res.status(500).send(err.message);
  }
});

app.get('/base/:_id?', async (req, res) => {
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');

  try {
      if (req.params.id) {
          const document = await collection.findOne({ _id: req.params.id });
          if (document) {
              res.json(document);
          } else {
              res.status(404).send('There is no information');
          }
      } else {
          const documents = await collection.find().toArray();
          res.status(201).json(documents);
      }
  } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
  }
});

app.delete('/clean-array/:id?', async (req, res) => {
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');

  try {
    if (req.params.id) {
      const result = await collection.deleteOne({ id: +req.params.id });
      console.log(`Deleted document with id ${req.params.id}`);
      
      res.json(result);
    } else {
      const result = await collection.drop();
      console.log(`Dropped collection ${collection.collectionName}`);

      res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


app.listen(3000, () => {
  console.log(`Server listening on http://${IP}:${PORT}/`);
});
