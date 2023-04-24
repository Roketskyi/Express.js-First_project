const express = require('express');
const { MongoClient } = require('mongodb');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const Joi = require('joi');

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


const itemSchema = Joi.object({
  serialNumber: Joi.string().required(),
  temperature: Joi.number().required(),
  date: Joi.string().pattern(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}:[0-9]{2}:[0-9]{2}$/).required(),
});

const schema = Joi.array().items(itemSchema);

const errorText = 'The parameters are entered incorrectly, they should look like this: [{"serialNumber": "123", "temperature": 1234.5, "date": "2023-01-01-12:34:56"}]';

app.post('/add-array', async (req, res) => {
  const data = req.body;
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');

  try {
    await schema.validateAsync(data);
    const result = await collection.insertMany(data);
    const id = result.insertedIds[0];

    res.status(200).send(`The data array is added to the temperatureData collection with an _id: ${id}`);;
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

app.get('/temperatureData/average/:from/:to', async (req, res) => {
  const db = client.db(dbName);
  const collection = db.collection('temperatureData');
  const from = req.params.from;
  const to = req.params.to;

  try {
    const result = await collection.aggregate([
      {
        $match: {
          date: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTemperature: {
            $avg: '$temperature',
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]).toArray();

    res.status(200).json(result);
  } catch (err) {
    console.error(err);

    res.status(500).send(err.message);
  }
});

app.get('/sensor_data/:id', async (req, res) => {
  const db = client.db(dbName);
  const collection = db.collection('sensorData');

  const query = { _id: new ObjectId(req.params.id) };
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  if (startDate && endDate) {
    query.data = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  try {
    const documents = await collection.find(query).toArray();

    if (documents.length > 0) {
      res.json(documents);
    } else {
      res.status(404).send('No information found for this sensor and time period.');
    }
  } catch (err) {
    console.error(err);

    res.status(500).send(err.message);
  }
});


app.listen(3000, () => {
  console.log(`Server listening on http://${IP}:${PORT}/`);
});