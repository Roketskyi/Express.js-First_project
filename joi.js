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

const ObjectId = require('mongodb').ObjectId;

connectToDb().catch(console.error);

app.use(express.json());

// app.post('/add-array', async (req, res) => {
//   const data = req.body;
//   const db = client.db(dbName);
//   const collection = db.collection('temperatureData');
  
//   try {
//     const result = await collection.insertMany(data);

//     res.status(201).send(`${JSON.stringify(result)}`);
//   } catch (err) {
//     console.error(err);
    
//     res.status(500).send(err.message);
//   }
// });

const Joi = require('joi');

const itemSchema = Joi.object({
  serialNumber: Joi.string().required(),
  temperature: Joi.number().required(),
  date: Joi.string().pattern(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}:[0-9]{2}:[0-9]{2}$/).required(),
});

const schema = Joi.array().items(itemSchema);

const errorText = 'Параметри введено не правильно, вони мають виглядати наступним чином: {"serialNumber": "112", "temperature": 3226.6, "date": "2023-04-05-18:59:04"}';

app.post('/add-array', async (req, res) => {
  const data = req.body;
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');

  try {
    await schema.validateAsync(data);
    const result = await collection.insertMany(data);

    res.status(201).send(`${JSON.stringify(result)}`);
  } catch (err) {
    console.error(err);

    res.status(400).send(errorText);
  }
});

app.get('/base/:id?', async (req, res) => { 
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');

  try {
    if (req.params.id) {
      
      const document = await collection.findOne({ _id: new ObjectId(req.params.id) });
      if (document) {
        res.json(document);
      } else {
        res.status(404).send('There is no information');
      }
    } else {
      const documents = await collection.find().toArray();
      res.status(200).json(documents);
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
      const doc = await collection.findOne({ _id: new mongodb.ObjectId(req.params.id) });

      if (!doc) return res.status(404).send(`Document with id "${req.params.id}" not found`);

      await collection.deleteOne({ _id: new mongodb.ObjectId(req.params.id) });      
      res.send(`Deleted document with id "${req.params.id}"`);
    } else {
      await collection.drop();
      
      res.send(`Dropped collection ${collection.collectionName}`);
    }
  } catch (err) {
    console.error(err);

    res.status(500).send(err.message);
  }
});


app.listen(3000, () => {
  console.log(`Server listening on http://${IP}:${PORT}/`);
});