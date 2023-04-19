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

const { body, validationResult } = require('express-validator');

app.post('/my-route', [
  // Проверяем параметр param1
  body('param1').notEmpty().withMessage('Параметр param1 обязателен'),
  // Проверяем параметр param2
  body('param2').notEmpty().withMessage('Параметр param2 обязателен'),
  // Проверяем параметр param3
  body('param3').notEmpty().withMessage('Параметр param3 обязателен'),
  // Проверяем параметр param4
  body('param4').notEmpty().withMessage('Параметр param4 обязателен')
], (req, res) => {
  // Проверяем наличие ошибок валидации
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Если все параметры присутствуют, сохраняем данные в базе данных
  const collection = client.db('dbName').collection('temperatureData');
  const data = {
    param1: req.body.param1,
    param2: req.body.param2,
    param3: req.body.param3,
    param4: req.body.param4
  };
  collection.insertOne(data, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    return res.status(200).json({ message: 'Данные успешно сохранены' });
  });
});

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

app.get('/base/:id?', async (req, res) => {
  const ObjectId = require('mongodb').ObjectId;
  
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