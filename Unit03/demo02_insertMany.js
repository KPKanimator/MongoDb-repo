let client = require('mongodb').MongoClient;
const connectionString = "mongodb://localhost:27017";

(async () => {
    let connection = await client.connect(connectionString);
    let db = connection.db('usersdb');

    try{
        let users = [{name: 'Ivan', age: 25}, {name:'Anna', age:24}, {name: 'Taras', age: 34}];
        const result = await db.collection('users').insertMany(users);
        console.log(JSON.stringify(result));
    }finally{
        connection.close();
    }
})().catch(error => console.log(error));

