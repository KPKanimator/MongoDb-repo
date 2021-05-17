# Working with MongoDB Transactions with C# and the .NET Framework

C# applications connected to a MongoDB database use the MongoDB .NET driver. To add the .NET driver to your Visual Studio Application, in the NuGet Package Manager, search for "MongoDB".

[Read more](https://developer.mongodb.com/how-to/transactions-c-dotnet/) :book: about the C# applications connected to a MongoDB. 

:arrow_right: Make sure you choose the latest version (>=2.7) of the driver, and press Install. 

Prior to MongoDB version 4.0, MongoDB was transactionally consistent at the document level. These existing atomic single-document operations provide the transaction semantics to meet the data integrity needs of the majority of applications. This is because the flexibility of the document model allows developers to easily embed related data for an entity as arrays and sub-documents within a single, rich document. That said, there are some cases where splitting the content into two or more collections would be appropriate, and for these cases, multi-document ACID transactions makes it easier than ever for developers to address the full spectrum of use cases with MongoDB. For a deeper discussion on MongoDB document model design, including how to represent one-to-many and many-to-many relationships, check out this article on data model design.

In the following code we will create a Product object and perform a MongoDB transaction that will insert some sample data into MongoDB then update the prices for all products by 10%.

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using System;
using System.Threading.Tasks;

namespace MongoDBTransaction
{
    public static class Program
    {
        public class Product
        {
            [BsonId]
            public ObjectId Id { get; set; }
            [BsonElement("SKU")]
            public int SKU { get; set; }
            [BsonElement("Description")]
            public string Description { get; set; }
            [BsonElement("Price")]
            public Double Price { get; set; }
        }

        // replace with your connection string if it is different
        const string MongoDBConnectionString = "mongodb://localhost";

        public static async Task Main(string[] args)
        {
            if (!await UpdateProductsAsync()) { Environment.Exit(1); }
            Console.WriteLine("Finished updating the product collection");
            Console.ReadKey();
        }

        private static async Task<bool> UpdateProductsAsync()
        {
            // Create client connection to our MongoDB database
            var client = new MongoClient(MongoDBConnectionString);

            // Create the collection object that represents the "products" collection
            var database = client.GetDatabase("MongoDBStore");
            var products = database.GetCollection<Product>("products");

            // Clean up the collection if there is data in there
            await database.DropCollectionAsync("products");

            // collections can't be created inside a transaction so create it first
            await database.CreateCollectionAsync("products");

            // Create a session object that is used when leveraging transactions
            using (var session = await client.StartSessionAsync())
            {
                // Begin transaction
                session.StartTransaction();

                try
                {
                    // Create some sample data
                    var tv = new Product { Description = "Television",
                                    SKU = 4001,
                                    Price = 2000 };
                    var book = new Product { Description = "A funny book",
                                    SKU = 43221,
                                    Price = 19.99 };
                    var dogBowl = new Product { Description = "Bowl for Fido",
                                    SKU = 123,
                                    Price = 40.00 };

                    // Insert the sample data
                    await products.InsertOneAsync(session, tv);
                    await products.InsertOneAsync(session, book);
                    await products.InsertOneAsync(session, dogBowl);

                    var resultsBeforeUpdates = await products
                                    .Find<Product>(session, Builders<Product>.Filter.Empty)
                                    .ToListAsync();
                    Console.WriteLine("Original Prices:\n");
                    foreach (Product d in resultsBeforeUpdates)
                    {
                        Console.WriteLine(
                                    String.Format("Product Name: {0}\tPrice: {1:0.00}",
                                        d.Description, d.Price)
                        );
                    }

                    // Increase all the prices by 10% for all products
                    var update = new UpdateDefinitionBuilder<Product>()
                            .Mul<Double>(r => r.Price, 1.1);
                    await products.UpdateManyAsync(session,
                            Builders<Product>.Filter.Empty,
                            update); //,options);

                    // Made it here without error? Let's commit the transaction
                    await session.CommitTransactionAsync();
                }
                catch (Exception e)
                {
                    Console.WriteLine("Error writing to MongoDB: " + e.Message);
                    await session.AbortTransactionAsync();
                    return false;
                }

                // Let's print the new results to the console
                Console.WriteLine("\n\nNew Prices (10% increase):\n");
                var resultsAfterCommit = await products
                        .Find<Product>(session, Builders<Product>.Filter.Empty)
                        .ToListAsync();
                foreach (Product d in resultsAfterCommit)
                {
                    Console.WriteLine(
                        String.Format("Product Name: {0}\tPrice: {1:0.00}",
                                                    d.Description, d.Price)
                    );
                }

                return true;
            }
        }
    }
}
```

##Key points:

- You don't have to match class properties to JSON objects - just define a class object and insert it directly into the database. There is no need for an Object Relational Mapper (ORM) layer.
- MongoDB transactions use snapshot isolation meaning only the client involved in the transactional session sees any changes until such time as the transaction is committed.
- The MongoDB .NET Driver makes it easy to leverage transactions and leverage LINQ based syntax for queries.

Additional information about using C# and the .NET driver can be found in the [C# and .NET MongoDB Driver ](https://docs.mongodb.com/drivers/csharp/) documentation.





