# Installing the driver and connecting to the database
The .NET framework and in particular the C # language, thanks to the presence of the driver, can also work with MongoDB. The source files of the driver, as well as various necessary information, for example, what was added in the new version, what improvements were made, etc., all this can be found on the page on the [github](https://github.com/mongodb/mongo-csharp-driver/releases). From there you can download the driver source code or its binaries.
But it is easier to use the NuGet package manager to install all the required driver files and libraries into the project:
  
The current driver version is version 2.4. The version should be taken into account when working, as the functionality of individual versions may differ.
So let's take a simple C # console project and install the MongoDB driver package into it via NuGet.
And after that a number of libraries will be added to the project: MongoDB.BSON.dll, MongoDB.Driver and MongoDB.Driver.Core:
- The MongoDB.BSON.dll library contains document code and BSON values, as well as code for mapping BSON documents to C # class objects.
- The MongoDB.Driver.Core.dll library contains functionality for connecting to the server.
- The MongoDB.Driver.dll library provides a lightweight wrapper for interoperating C # code with a MongoDB server.

Then, in the program code, we can include all the necessary namespaces:
```using MongoDB.Bson;
using MongoDB.Driver;
```
## MongoDB Database connection
To connect to the database, you need to use a number of classes:
```string connectionString = "mongodb://localhost:27017"; // адрес сервера
MongoClient client = new MongoClient(connectionString);
IMongoDatabase database = client.GetDatabase("test");
```
To establish a connection, first of all we need to use the MongoClient class, in the constructor of which we need to pass the connection string:
```string connectionString = "mongodb://localhost:27017"; // server address
MongoClient client = new MongoClient(connectionString);
```
The connection string looks like this: mongodb://[username:password@]hostname[:port][/[database][?options]]. 
For example, if all parameters were specified, the connection string might look like this: mongodb://user:pass@localhost/db1?authSource=userDb - here, a user with username user and password pass connects to the db1 database on the localhost host. In addition, an additional authSource parameter is also set with the value userDb.
If no port is specified, the default is 27017.
After receiving a client with his help, we can already directly access specific databases. To get the database, the GetDatabase method is used, into which the name of ```IMongoDatabase database = client.GetDatabase("test");```
In this case, we are getting a link to the test database, which is available in the mongodb package by default. Having received a database object, we can access specific collections and perform various operations with the data.
After completing all the necessary operations, we do not need to close the connection, as, for example, in the case of connections to other databases, since MongoDB itself will do all the work.

# Connection strings in configuration files
In addition to hard-coding connection strings in code, you can also define them in configuration files: app.config for desktop applications in the connectionString section:
```<connectionStrings>
    <add name="MongoDb" connectionString="mongodb://localhost/lab6db" />
</connectionStrings>
```
The connectionString attribute sets the connection parameters, in particular the server is the same localhost and the name of the database is lab6db.
Then, on the server side, getting the connection string from the file will look like this:
```
using System;
using System.Configuration;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace Lab6
{
  class Program
  {
    static void Main(string[] args)
    {
      //string connectionString = "mongodb://localhost:27017"; // адрес сервера
      //MongoClient client = new MongoClient(connectionString);
      string connectionString = ConfigurationManager.ConnectionStrings["MongoDb"].ConnectionString;
      var client = new MongoClient(connectionString);
      ...
```
To use the ConfigurationManager class, you need to add the System.Configuration.dll library to the project:
 
### Retrieving all databases from the server
Let's create a small console application that will display all the databases on the server:
```
using System;
using System.Configuration;
using System.Threading.Tasks;
using MongoDB.Driver;


namespace Lab6
{
  class Program
  {
    static void Main(string[] args)
    {
      string connectionString = ConfigurationManager.ConnectionStrings["MongoDb"].ConnectionString;
      var client = new MongoClient(connectionString);

      IMongoDatabase database = client.GetDatabase("test");
      GetDatabaseNames(client).GetAwaiter();
      Console.ReadKey();
    }
    private static async Task GetDatabaseNames(MongoClient client)
    {
      using (var cursor = await client.ListDatabasesAsync())
      {
        var databaseDocuments = await cursor.ToListAsync();
        foreach (var databaseDocument in databaseDocuments)
        {
          Console.WriteLine(databaseDocument["name"]);
        }
      }
    }
  }
}
```
In this case, the connection string definition must be written in the App.config file:
```
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <startup>
    <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.7.2" />
  </startup>
  <connectionStrings>
    <add name="MongoDb" connectionString="mongodb://localhost/lab6db" />
  </connectionStrings>
</configuration>
```
## Interacting with the collection. Documentation
Just as in conventional relational DBMS we go through several levels when interacting with the database server (DB server -> database -> table), so when interacting with MongoDB we also go through several levels:
  
Earlier we looked at getting a reference to a database using the IMongoDatabase object. The data in the database is stored in collections, which are represented by an IMongoCollection object. For example, let's get all the collections of all databases that are available on the server:

```private static async Task GetCollectionsNamesAsync(MongoClient client)
{
  using (var cursor = await client.ListDatabasesAsync())
  {
    var dbs = await cursor.ToListAsync();
    foreach (var db in dbs)
    {
      Console.WriteLine("В базе данных {0} имеются следующие коллекции:", db["name"]);

      IMongoDatabase database = client.GetDatabase(db["name"].ToString());

      using (var collCursor = await database.ListCollectionsAsync())
      {
        var colls = await collCursor.ToListAsync();
        foreach (var col in colls)
        {
          Console.WriteLine(col["name"]);
        }
      }
      Console.WriteLine();
    }
  }
}
```
The screenshot shows that I have a test database that has a users collection. And to get this collection directly, you can use the GetCollection method, which returns an IMongoCollection object:
```MongoClient client = new MongoClient(connectionString);
IMongoDatabase database = client.GetDatabase("test");
IMongoCollection<BsonDocument> col = database.GetCollection<BsonDocument>("users");
```
Each IMongoCollection object is typed with the BsonDocument type, which is a document. And the collection itself can be thought of as a collection of BsonDocument documents.
### BsonDocument
Since MongoDB is a document-oriented database, all data in it is stored as documents. Thus, the database is made up of collections and the collection is made up of documents. Each document represents a set of key-value element pairs like a dictionary and is represented by the BsonDocument class from the MongoDB.BSON namespace.
The dataset in the document is in bson format, which is close to json format. For example, a standard document:
```{
    "name": "Bill",
    "surname": "Gates",
    "age": "48",
    "company": {
        "name" : "microsoft",
        "year" : "1974",
        "price" : "300000"
        }
}
```
Each key-value pair, that is, an individual element in the document, such as "name": "Bill", represents a BsonElement class, and each individual value (in this case, the string "Bill") represents a BsonValue class
Although, in fact, the work will be carried out directly through the inherited classes of BsonValue: BsonDouble, BsonString, BsonInt32, BsonBoolean and a number of others.
## Type conversion operations
The BsonValue class contains a number of properties that allow you to convert the type of its value to one of the C # types. All of these properties follow the As [Type] pattern. 
Some of them:
• AsByteArray: converts the type to a byte array []
• AsDateTime: converts the item to a DateTime object
• AsDouble: converts the element to a Double object
• AsGuid: converts the item to a Guid object
• AsInt32: converts an element to an int object
• AsInt64: converts an element to a long object
• AsString: converts the element to a string object
• AsObjectId: converts the item to an ObjectId
For example, let's make the transition from BsonInt32 to the standard int type:
```
BsonValue bv = new BsonInt32(20);
int i = bv.AsInt32;
```
At the same time, it is not always possible to carry out transformations, such as in the following case:
```
BsonValue bv = new BsonInt32(20);
ObjectId ob = bv.AsObjectId;
```
In this case, the environment will throw an InvalidCastException exception.
Before casting, you can use one of the properties to indicate whether the type of an object can be converted to another type. Such properties are formed by the Is [Type] template and, if it is possible to convert the object type to the [Type] type, return true. Some of these properties:
• IsDateTime: returns true if the element is of type DateTime
• IsDouble: returns true if the element is of type Double
• IsGuid: returns true if the element is of type Guid
• IsInt32: returns true if the element is of type int
• IsInt64: returns true if the element is of type long
• IsString: returns true if the element is of type string
• IsObjectId: returns true if the element is of type ObjectId
For example:
```
BsonValue bv = new BsonInt32(20);
int i=-1;
if(bv.IsInt32)
    i = bv.AsInt32;
 
ObjectId ob = new ObjectId();
if (bv.IsObjectId)
    ob= bv.AsObjectId;
```
### Create document
We can use one of the BsonDocument constructor forms to create the document. For example, let's create an empty document:
```
sonDocument doc = new BsonDocument();
Console.WriteLine(doc);
```
When outputting to the console, we get the following:
```
{ }
```
Now let's create a document with one element:
```
BsonDocument doc = new BsonDocument { {"name","Bill"}};
Console.WriteLine(doc);
```
And the console will display the following:
```{ "name" : "Bill"}```
Now let's print the value of the name field to the console:
```BsonDocument doc = new BsonDocument { { "name", "Bill" } };
 
Console.WriteLine(doc["name"]);
// изменим поле name
doc["name"] = "Tom";

Console.WriteLine(doc.GetValue("name"));
```
The methods of field output used in this case: doc ["name"] and doc.GetValue ("name") will be equivalent.
Since each such key-value pair represents a BsonElement, we could write it like this:
```	
BsonElement bel = new BsonElement("name","Bill");
BsonDocument doc = new BsonDocument(bel);
Console.WriteLine(doc);
```
Or use the Add method to add a new item:
```
BsonElement bel = new BsonElement("name","Bill");
BsonDocument doc = new BsonDocument();
doc.Add(bel);
Console.WriteLine(doc);
```
Now let's create a more complex element:
```      
BsonDocument doc = new BsonDocument
      {
          {"name","Bill"},
          {"surname", "Gates"},
          {"age", new BsonInt32(48)},
          { "company",
              new BsonDocument{
                  {"name" , "microsoft"},
                  {"year", new BsonInt32(1974)},
                  {"price", new BsonInt32(300000)},
              }
          }
      };
      Console.WriteLine(doc);
```
And the console will display the following:
```{
    "name": "Bill",
    "surname": "Gates",
    "age": 48,
    "company": {
        "name" : "microsoft",
        "year" : 1974,
        "price" : 300000
        }
}
```
And another example - let's add an array to the document:
```	
BsonDocument chemp = new BsonDocument();
chemp.Add("countries", new BsonArray(new[] { "Бразилия", "Аргентина", "Германия", "Нидерланды" }));
chemp.Add("finished", new BsonBoolean(true));
Console.WriteLine(chemp);
Консольный вывод:
{
    "countries": ["Бразилия", "Аргентина", "Германия", "Нидерланды"],
    "finished": true
}
```
## Data Models
Although the creation of documents can be done using the BsonDocument class, it would be much easier to work directly through the classes that represent the data. And the MongoDB driver for C # provides this capability. For example, let's create a data model:
```
using MongoDB.Bson;
using System.Collections.Generic;
 
namespace MongoDBApp
{
    class Person
    {
        public ObjectId Id { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public int Age { get; set; }
        public Company Company { get; set; }
        public List<string> Languages { get; set; }
    }
    class Company
    {
        public string Name { get; set; }
    }
}
```
It defines a Person class, which represents a person, and a Company class, which represents the company where the person works.
It is worth noting that an object of the ObjectId class, which is defined in the MongoDB.Bson.dll library, is used as the Id property in the Person class.
The MongoDB.Bson namespace adds a number of functionality to C # classes that allows objects of these classes to be used as documents:
```
using System;
using MongoDB.Bson;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
            p.Company = new Company { Name = "Microsoft"};
 
            Console.WriteLine(p.ToJson());
            Console.ReadLine();
        }
    }
}
```
The MongoDB.Bson.dll library adds a number of methods to classes, in particular the ToJson method, which converts an object to JSON format, and the object itself represents a document.
When creating a document, we can use both the standard C # class and the BsonDocument class, and, if necessary, move from one to the other. For example:
```using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            BsonDocument doc = new BsonDocument
            {
                {"Name","Bill"},
                {"Surname", "Gates"},
                {"Age", new BsonInt32(48)},
                { "Company",
                    new BsonDocument{
                        {"Name" , "Microsoft"}
                    }
                }
            };
            Person p = BsonSerializer.Deserialize<Person>(doc);
            Console.WriteLine(p.ToJson());
             
            Console.ReadLine();
        }
    }
}
```
Using the Deserialize () method of the BsonSerializer class from the MongoDB.Bson.Serialization namespace, we can deserialize from a document to a Person model object. In this case, it is important that the names of the properties of the model coincide with the names of the elements in the document (including the case), otherwise the program will not be able to match the elements and properties.
You can also perform the reverse operation to convert an object to a BsonDocument:
```
Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
p.Company = new Company { Name = "Microsoft"};
BsonDocument doc = p.ToBsonDocument();
Console.WriteLine(doc);
```
## Setting up a model using attributes
### Setting Id
Every object in the database has an \_id field, which acts as a unique identifier for the object. Using the BsonId attribute, we can explicitly set a property that will act as an identifier:
```
class Person
{
    [BsonId]
    public int PersonId { get; set; }
    public string Name { get; set; }
}
```
Although in this case the property is called PersonId and is of type int, when the document is created, this property will represent the \_id field in the document
Using attributes, we can control the customization of model classes and their serialization to mongodb documents. For example:
```using MongoDB.Bson.Serialization.Attributes;
........................................
class Person
{
    [BsonElement("First Name")]
    public string Name { get; set; }
    [BsonIgnore]
    public string Surname { get; set; }
    public int Age { get; set; }
    public Company Company {get;set;}
}
class Company
{
    public string Name { get; set; }
}
```
The BsonIgnore attribute allows you to ignore the Surname property when serializing an object to a document. And the BsonElement attribute allows you to set the element settings for this property. In particular, it changes the name of the element from Name to First Name. Therefore, when creating a document:
```Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };
p.Company = new Company { Name = "Microsoft"};
             
Console.WriteLine(p.ToJson());
```
Мы получим следующий вывод:
```{
    "First Name": "Bill",
    "Age": 48,
    "Company": {
        "Name" : "Microsoft"
        }
}
```
### Ignoring defaults
The example above sets the Person object to a Company object. However, in some situation for the Person object, this object may not be present. For example, a person does not work for any company. However, even if we do not specify the company, such a document will still contain this element, only it will have a null value. To avoid adding elements that have values to the document, you can use the BsonIgnoreIfNull attribute:
```class Person
{
    public string Name { get; set; }
    public string Surname { get; set; }
    [BsonIgnoreIfDefault]
    public int Age { get; set; }
    [BsonIgnoreIfNull]
    public Company Company {get;set;}
}
```
In this case, the object:
```Person p = new Person { Name = "Bill", Surname = "Gates", Age = 48 };```
will submit the following document:
```{
    "Name": "Bill",
    "Surname": "Gates",
    "Age": 48
}
```
Since this attribute works only for properties that can be null, that is, reference types, it is not suitable for objects of value types. For example, we don't know the age of a person: Person p = new Person {Name = "Bill", Surname = "Gates"} ;. But even if we did not specify the Age property, it will be present in the document with a value of 0 - that is, the default value. To avoid this, the BsonIgnoreIfDefault attribute is used for the Age property.
### BsonRepresentation
Another attribute, BsonRepresentation, is responsible for representing the property in the database. For example:
```
class Person
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }
    public string Name { get; set; }
    [BsonRepresentation(BsonType.String)]
    public int Age { get; set; }
}
```
In this case, for the Id property it is indicated that it will act as an identifier and in the database the corresponding field will have the ObjectId type. But the integer Age property in the database will correspond to the string field Age due to the use of the \[BsonRepresentation (BsonType.String)] attribute.
BsonClassMap
To customize the mapping of C # classes to MongoDB collections, you can use the BsonClassMap class, which registers the mapping principles. For example, let's take the same Person class:
```static void Main(string[] args)
{
    BsonClassMap.RegisterClassMap<Person>(cm =>
    {
        cm.AutoMap();
        cm.MapMember(p => p.Name).SetElementName("name");
    });
    Person person = new Person { Name = "Bill", Age = 48 };
    BsonDocument doc = person.ToBsonDocument();
    Console.WriteLine(doc);
 
    Console.ReadLine();
}
```
The RegisterClassMap () method defines a map of the mapping of Person and BsonDocument objects. Specifically, in this case, the Name property will be mapped to the name field.
### Conventions
Conventions, along with Attributes and BsonClassMap, provide another way to define a mapping between BsonDocument classes and objects. Conventions are defined as a set - a ConventionPack object. This object can contain a set of conventions. Each convention represents an object of a class derived from ConventionBase. For example, let's lowercase all keys in BsonDocument:
```
using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Conventions;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            var conventionPack = new ConventionPack();
            conventionPack.Add(new CamelCaseElementNameConvention());
            ConventionRegistry.Register("camelCase", conventionPack, t => true);
            Person person = new Person { Name = "Bill", Age = 48 };
             
            BsonDocument doc = person.ToBsonDocument();
            Console.WriteLine(doc);
 
            Console.ReadLine();
        }
    }
}
```
In this case, the CamelCaseElementNameConvention convention is used, which translates property names into camel case - names begin with a lowercase letter.
The convention is added using the Add () method of the ConventionPack class. And for it to work, you need to call the ConventionRegistry.Register () method, which will register the convention. The first parameter of the method is the name of the convention, the second is the ConventionPack object, and the third is the condition under which the convention is applied. Here, the condition is simply set to the keyword true, that is, the convention will apply to all properties.
As a result, when outputting to the console, the names of all keys in the document will be converted to lowercase:
```{"_id" : null, "name" : "Bill", "age" : 48}```

## Saving documents to the database

To add data to the collection, use the InsertOneAsync method defined in the IMongoCollection interface. For example, let's add one document to the people collection:
```using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
 
namespace MongoDBApp
{
    class Program
    {
        static void Main(string[] args)
        {
            SaveDocs().GetAwaiter().GetResult();
          
            Console.ReadLine();
        }
 
        private static async Task SaveDocs()
        {
            string connectionString = "mongodb://localhost";
            var client = new MongoClient(connectionString);
            var database = client.GetDatabase("test");
            var collection = database.GetCollection<BsonDocument>("people");
            BsonDocument person1 = new BsonDocument 
            {
                {"Name", "Bill"},
                {"Age", 32},
                {"Languages", new BsonArray{"english", "german"}}
            };
            await collection.InsertOneAsync(person1);
        }
    }
}
```
In addition to the InsertOneAsync method, we can also use the InsertManyAsync () method to save documents, which takes a set of objects as a parameter:
```private static async Task SaveDocs()
{
    string connectionString = "mongodb://localhost";
    var client = new MongoClient(connectionString);
    var database = client.GetDatabase("test");
    var collection = database.GetCollection<BsonDocument>("people");
    BsonDocument person1 = new BsonDocument 
    {
        {"Name", "Bill"},
        {"Age", 32},
        {"Languages", new BsonArray{"english", "german"}}
    };
    BsonDocument person2 = new BsonDocument 
    {
        {"Name", "Steve"},
        {"Age", 31},
        {"Languages", new BsonArray{"english", "french"}}
    };
    await collection.InsertManyAsync(new []{person1,person2});
}
```
However, we can work not only with BsonDocument objects, but also with standard C # classes. Let's say we need to save objects of the following classes:
```using MongoDB.Bson;
using System.Collections.Generic;
 
namespace MongoDBApp
{
    class Person
    {
        public ObjectId Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
        public Company Company { get; set; }
        public List<string> Languages { get; set; }
    }
    class Company
    {
        public string Name { get; set; }
    }
}
```
Now let's add the Person object to the people collection:

```private static async Task SaveDocs()
{
    string connectionString = "mongodb://localhost";
    var client = new MongoClient(connectionString);
    var database = client.GetDatabase("test");
    var collection = database.GetCollection<Person>("people");
    Person person1 = new Person 
    {
        Name="Jack",
        Age = 29,
        Languages = new List<string>{"english", "german"},
        Company = new Company
        {
            Name="Google"
        }
    };
    await collection.InsertOneAsync(person1);
}
```
Since the collection will store data of type Person, it is typed by this type: MongoCollection <Person>. In this case, Person objects will act as documents.
When added, if the "_id" identifier is not set for the object, then it is automatically generated. And then we can get it:
```await collection.InsertOneAsync(person1);
Console.WriteLine(person1.Id);
```
 
  
