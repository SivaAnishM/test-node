const { MongoClient } = require('mongodb');

const URL = process.env.DB_URL;

const collectionCheck = async (req, res) => {
    const client = new MongoClient(URL);
    const collectionName = req.body.collectionName.toLowerCase()
    try {
        await client.connect();
        const database = client.db();
        const collections = await database.listCollections().toArray();
        const collectionNames = collections.map(collection => collection.name);
        const isPresnt = collectionNames.includes(collectionName)
        res.status(200).send({
            isPresnt
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        client.close();
    }
};

module.exports = { collectionCheck }