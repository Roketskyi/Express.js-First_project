const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();

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
    res.send('hello');
})

app.post('/temperature', async (req, res) => {
  const data = req.body;
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');
  
  try {
    const result = await collection.insertMany(data);

    console.log(`${result.insertedCount} documents were inserted`);
    res.status(201).send.json('good');

  } catch (err) {
    console.error(err);
    
    res.status(500).send(err.message);
  }
});

app.get('/base', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('temperatureData');

    try {
        const documents = await collection.find().toArray();
        res.json(documents);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.get('/base/:id', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection('temperatureData');
    console.log(req.params.id)
    try {
        const document = await collection.find({ id: +req.params.id}).toArray();
        res.json(document);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


app.listen(3000, () => {
  console.log('Server listening on port http://localhost:3000/');
});
