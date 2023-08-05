const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const secretKey = "your-secret-key";
const port = 7000;

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://munna:I5l3XBblNYwiI1bt@cluster0.dpihtss.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const userCollection = client.db("main").collection("user-collection");
const productCollection = client.db("main").collection("product-collection");
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const generateToken = (userData) => {
      return jwt.sign(userData, secretKey, { expiresIn: "1h" }); // Token will expire in 1 hour
    };
    // Middleware to verify JWT
    const verifyToken = (req, res, next) => {
      const token = req.headers["authorization"];
      if (!token) {
        return res.status(403).send("Access denied. No token provided.");
      }

      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return res.status(401).send("Invalid token.");
        }
        req.user = decoded;
        next();
      });
    };
    app.get("/", (req, res) => {
      res.send("Hello, world!");
    });

    app.post("/user/create", async (req, res) => {
      const { email, address, zipCode, isSeller, isAdmin, userName } = req.body;
      const new_user = {
        email: email,
        address: address,
        zipCode: zipCode,
        isSeller: isSeller,
        isAdmin: isAdmin,
        userName: userName,
      };

      try {
        const checkDuplicate = await userCollection.findOne({ email: email });

        if (checkDuplicate) {
          const errorMessage = "User already exists";
          res.status(400).send(errorMessage);
        } else {
          const result = await userCollection.insertOne(new_user);
          res.send(result);
          console.log(new_user);
        }
      } catch (error) {
        console.error("Error inserting user into the database:", error);
        res.status(500).send("Server error");
      }
    });
    app.post("/create/product", async (req, res) => {
      const {
        productName,
        description,
        price,
        discountPercent,
        colorVariation,
        selectedImages,
        discountedPrice,
        categories,
        seller,
        type,
      } = req.body;

      const result = await productCollection.insertOne({
        productName,
        description: description,
        price: price,
        discountPercent: discountPercent,
        colorVariation: colorVariation,
        selectedImages: selectedImages,
        discountedPrice: discountedPrice,
        categories: categories,
        seller: seller,
        type: type,
      });
      res.send(result);
    });
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const collection = await userCollection.findOne({ email: email });
      res.send(collection);
    });

    app.get("/products", async (req, res) => {
      const collection = await productCollection.find().toArray();
      res.send(collection);
    });
    app.get("/products/featured", async (req, res) => {
      const collection = await productCollection
        .find({ categories: "Featured" })
        .toArray();
      res.send(collection);
    });
    app.get("/products/newarrival", async (req, res) => {
      const collection = await productCollection
        .find({ categories: "New Arrival" })
        .toArray();
      res.send(collection);
    });
    app.delete("/delete/product/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = productCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/products/hotdeal", async (req, res) => {
      const collection = await productCollection
        .find({ categories: "Hot Deal" })
        .toArray();
      res.send(collection);
    });
    app.get("/products/search", async (req, res) => {
      const query = req.query.query;
      const regex = new RegExp(query, "i");
      const collection = await productCollection
        .find({
          productName: { $regex: regex },
        })
        .toArray();
      res.send(collection);
    });
    app.put("/product/update/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const existingProduct = await productCollection.findOne(query);

        if (!existingProduct) {
          return res.status(404).json({ error: "Product not found." });
        }

        const updateFields = {};
        const {
          productName,
          description,
          price,
          discountPercent,
          discountedPrice,
          colorVariation,
        } = req.body;

        if (productName) {
          updateFields.productName = productName;
        }

        if (description) {
          updateFields.description = description;
        }

        if (price) {
          updateFields.price = price;
        }

        if (discountPercent) {
          updateFields.discountPercent = discountPercent;
        }

        if (discountedPrice) {
          updateFields.discountedPrice = discountedPrice;
        }

        if (colorVariation) {
          updateFields.colorVariation = colorVariation;
        }

        const result = await productCollection.updateOne(query, {
          $set: updateFields,
        });

        if (result.modifiedCount > 0) {
          return res.json({ message: "Product updated successfully." });
        } else {
          return res.json({ message: "No changes made to the product." });
        }
      } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
      }
    });

    app.get("/products/recomended", async (req, res) => {
      const type = req.query.type;
      const collection = await productCollection.find({ type: type }).toArray();
      res.send(collection);
    });
    app.get("/seller/products", async (req, res) => {
      const email = req.query.email;
      const collection = await productCollection
        .find({ "seller.email": email })
        .toArray();
      res.send(collection);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Create a route for the home page

// Listen on the port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
