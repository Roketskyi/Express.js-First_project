// Library
const express = require('express');
const { MongoClient } = require('mongodb');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const Joi = require('joi');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Express.js
const app = express();

const IP = 'localhost';
const PORT = 3000;

// MongoDB
const url = "mongodb+srv://romanroketskiy05:Roman080805MLP@reynes.73bphty.mongodb.net/?retryWrites=true&w=majority";
const dbName = 'myProject';
const client = new MongoClient(url);

const db = client.db(dbName); // Підключення до бази даних
const collection = db.collection('temperatureData'); // Отримання колекції temperatureData

async function connectToDb() {
  await client.connect();
  console.log('Connected to MongoDB server');
}

connectToDb().catch(console.error);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());

// Code
const dateRegex = /^(?:[0-9]{4})-(?:(?:0[1-9])|(?:1[0-2]))-(?:(?:0[1-9])|(?:[1-2][0-9])|(?:3[0-1]))-(?:(?:[0-1][0-9])|(?:2[0-3])):(?:(?:[0-5][0-9])|(?:59)):(?:(?:[0-5][0-9])|(?:59))$/;

const itemSchema = Joi.object({
  serialNumber: Joi.string().required(),
  temperature: Joi.number().required(),
  date: Joi.string()
    .regex(dateRegex)
    .required(),
});

app.post('/add-array', async (req, res) => {
  const errorMessage = 'The parameters are entered incorrectly, they should look like this:';
  const errorExample = [{"serialNumber": "123", "temperature": 1234.5, "date": "2023-01-01-12:34:56"}];
  
  try {
    const data = req.body;

    const schema = Joi.array().items(itemSchema);
    await schema.validateAsync(data);
    

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const date = new Date(item.date.replace(/-/g, '/'));

      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format for item with index ${i}`);
      }
    }

    const result = await collection.insertMany(data);
    
    res.status(200).json({
      Successfully: `The data array is added to the temperatureData collection`,
      Result: data
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      Error: errorMessage,
      Example: errorExample
    });
  }
});

// Example: http://localhost:3000/base || http://localhost:3000/base/15
app.get('/base/:id?', async (req, res) => { 
  try {
    if (req.params.id) {
      
      const document = await collection.findOne({ serialNumber: req.params.id });
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

// Example: http://localhost:3000/clean-array/ || http://localhost:3000/clean-array/18
app.delete('/clean-array/:id?', async (req, res) => {
  try {
    if (req.params.id) {
      const doc = await collection.findOne({ serialNumber: req.params.id });

      if (!doc) return res.status(404).send(`Document with serialNumber "${req.params.id}" not found`);

      await collection.deleteOne({ serialNumber: req.params.id });      
      res.send(`Deleted document with serialNumber "${req.params.id}"`);
    } else {
      await collection.drop();
      
      res.send(`Dropped collection ${collection.collectionName}`);
    }
  } catch (err) {
    console.error(err);

    res.status(500).send(err.message);
  }
});

// Example: http://localhost:3000/average?from=2020-04-05-18:59:04&to=2024-04-05-18:59:59
app.get('/average', async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;

  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return res.status(400).send('Date entered incorrectly. Example: http://localhost:3000/average?from=2020-04-05-18:59:04&to=2024-04-05-18:59:59');
  }

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

// Example: http://localhost:3000/sensor_data/41244124463634?startDate=2020-01-01-11:00:00&endDate=2024-01-01-23:59:59
app.get('/sensor_data/:id', async (req, res) => {
  const query = { serialNumber: req.params.id };
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    if (startDate && endDate) {
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        throw new Error('Incorrect date format');
      }

      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (!endDate || !startDate) {
      throw new Error(`Date entered incorrectly. Example: "http://localhost:3000/sensor_data/1?startDate=2023-01-11-11:12:59&endDate=2023-12-15-14:12:59"`);
    }

    const documents = await collection.find(query).toArray();

    if (documents.length > 0) {
      res.json(documents);
    } else {
      res.status(404).send('No information was found for this sensor for the specified time period');
    }
  } catch (err) {
    console.error(err);

    if (err.message === 'Incorrect date format') {
      res.status(400).send('Date entered incorrectly. Example: http://localhost:3000/sensor_data/14?startDate=2020-01-01-11:00:00&endDate=2024-01-01-23:59:59');
    } else if (err.message === 'Missing endDate') {
      res.status(400).send('Missing endDate');
    } else {
      res.status(500).send(err.message);
    }
  }
});

app.listen(3000, () => {
  console.log(`Server listening on http://${IP}:${PORT}/`);
});