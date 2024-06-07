const express = require('express');
const bodyParser = require('body-parser');
const cassandra = require('cassandra-driver');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors()); // Permitir todas las solicitudes CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'mykeyspace' // Cambia esto por tu keyspace real
});

client.connect()
  .then(() => console.log('Conectado a Cassandra'))
  .catch(err => console.error('Error al conectar a Cassandra', err));

app.get('/api/products', async (req, res) => {
  try {
    const query = 'SELECT * FROM products';
    const result = await client.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, description, price } = req.body;
  const query = 'INSERT INTO products (id, name, description, price) VALUES (?, ?, ?, ?)';
  const productId = uuidv4();

  console.log('Datos recibidos para nuevo producto:', { name, description, price });

  try {
    await client.execute(query, [productId, name, description, price], { prepare: true });
    res.status(201).json({ id: productId, name, description, price });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  const query = 'UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?';

  console.log('Datos recibidos para actualizar producto:', { id, name, description, price });

  try {
    await client.execute(query, [name, description, price, id], { prepare: true });
    res.json({ id, name, description, price });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = ?';

  console.log('ID del producto a eliminar:', id);

  try {
    await client.execute(query, [id], { prepare: true });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
