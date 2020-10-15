const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const fs = require('fs-extra');
const fileUpload = require('express-fileupload');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vss5k.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(express.static('serviceIcon'));
app.use(fileUpload());

const port = 5000;

app.get('/', (req, res) => {
  res.send('Hello, Creative Agency !')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const creativeFeedbacks = client.db("CreativeDB").collection("feedbacks");
  const creativeOrders = client.db("CreativeDB").collection("orders");
  const creativeServices = client.db("CreativeDB").collection("services");

  app.post('/addFeedbacks', (req, res) => {
    const feedback = req.body;
    creativeFeedbacks.insertOne(feedback)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  });
  app.get('/feedbacks', (req, res) => {
    creativeFeedbacks.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });


  app.post('/addOrder', (req, res) => {
    const order = req.body;
    creativeOrders.insertOne(order)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  });
  app.get('/orders', (req, res) => {
    creativeOrders.find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      })
  });
  app.get('/allOrders', (req, res) => {
    creativeOrders.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });



  app.post('/addService', (req, res) => {
    const icon = req.files.icon;
    const title = req.body.title;
    const description = req.body.description;

    const filePath = `${__dirname}/serviceIcon/${icon.name}`;
    icon.mv(filePath, err => {
      if(err){
        console.log(err);
      }
    })

    const newImg = icon.data;
    const encImg = newImg.toString('base64');
    const image = {
      ContentType: icon.mimetype,
      size: icon.size,
      img: Buffer.from(encImg, 'base64')
    }
    
    creativeServices.insertOne({title, description, image})        // icon
    .then(result => {
      fs.remove(filePath, error => {
        if(error){
          console.log(error);
        }
        res.send(result.insertedCount > 0);
      })
    })
  });



  app.get('/services', (req, res) => {
    creativeServices.find({})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

});



app.listen(process.env.PORT || port)