let client = require('mongodb').MongoClient;
const connectionString = "mongodb://localhost:27017";

(async () => {
    let connection = await client.connect(connectionString);
    let db = connection.db('usersdb');

    try{
        
        const result = await db.collection('users').updateOne({age:34}, {$set:{age:35}}, {upsert:true});
        console.log(JSON.stringify(result));
    }finally{
        connection.close();
    }
})().catch(error => console.log(error));


