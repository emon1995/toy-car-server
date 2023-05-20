const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.idgt1xz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // db
    const toyCollection = client.db("carsToyDB").collection("cars");
    // indexing
    const indexKeys = { toy_name: 1 };
    const indexOptions = { name: "toy_name" };
    // const result = await toyCollection.createIndex(indexKeys, indexOptions);
    // console.log(result);
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // all toys get
    app.get("/allToys", async (req, res) => {
      const query = {};
      const options = {
        projection: {
          price: 1,
          quantity: 1,
          seller_name: 1,
          sub_Category: 1,
          toy_name: 1,
          photo: 1,
        },
      };
      const toys = await toyCollection
        .find(query, options)
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      res.send(toys);
    });

    // single toy get
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { category: 0, sub_Category: 0 },
      };
      const toy = await toyCollection.findOne(query, options);
      res.send(toy);
    });

    // search toy get
    app.get("/searchToy/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toyCollection
        .find({ toy_name: { $regex: text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    // user email toy get
    app.get("/myToys/:email", async (req, res) => {
      const email = req.params.email;
      const price = req.query.sort;
      const query = { seller_email: email };
      const options = {
        projection: {
          price: 1,
          quantity: 1,
          seller_name: 1,
          seller_email: 1,
          toy_name: 1,
        },
      };

      if (price === "asc") {
        const result = await toyCollection
          .find(query, options)
          .sort({ price: 1 })
          .toArray();
        return res.send(result);
      } else if (price === "dsc") {
        const result = await toyCollection
          .find(query, options)
          .sort({ price: -1 })
          .toArray();
        return res.send(result);
      }

      // const toys = await toyCollection.find(query, options).toArray();
      // res.send(toys);
    });

    // category & sub category get
    app.get("/allToysSubCategory/:subCategory", async (req, res) => {
      const subCategory = req.params.subCategory;
      if (subCategory) {
        const result = await toyCollection
          .find({ sub_category: subCategory })
          .toArray();
        return res.send(result);
      } else {
        return res.status(404).send({
          message: "can not get try again later",
          status: false,
        });
      }
    });

    // sub category get
    // app.get("/allToysSubCategory", async (req, res) => {
    //   const { filterBy, name } = req.query;
    //   //   console.log(filterBy, name);
    //   let query = {
    //     sub_Category: {
    //       $elemMatch: { value: name },
    //     },
    //   };
    //   const result = await toyCollection.find(query).toArray();
    //   res.send(result);
    // });

    // add toy post
    app.post("/addToy", async (req, res) => {
      const toy = req.body;
      toy.createdAt = new Date();
      //   console.log(toy);
      const result = await toyCollection.insertOne(toy);
      if (result?.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not insert try again later",
          status: false,
        });
      }
    });

    // toy delete
    app.delete("/deleteToy/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    // update toy
    app.patch("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const {
        toy_name,
        price,
        quantity,
        rating,
        photo,
        seller_email,
        seller_name,
        description,
      } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          toy_name,
          price,
          quantity,
          rating,
          photo,
          seller_email,
          seller_name,
          description,
        },
      };
      const result = await toyCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// primary route
app.get("/", (req, res) => {
  res.send("toy cars server ");
});

app.listen(port, () => {
  console.log(`Toy Cars Server is running on port ${port}`);
});
