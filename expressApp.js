import express from 'express';

const PORT = 4000;
const app = express();

app.use(express.json());

let vehicles = [
  { id: 1, vehicleName: 'Hyundai Creta', vehicleNumber: 'HR26AB1234', type: 'SUV', price: 1500000 },
  { id: 2, vehicleName: 'Honda City', vehicleNumber: 'DL3CAB4567', type: 'Sedan', price: 1200000 },
  { id: 3, vehicleName: 'Tata Nexon', vehicleNumber: 'UP14CD9876', type: 'SUV', price: 1100000 }
];


const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const validateVehicle = (data) => {
  const missing = ['vehicleName', 'vehicleNumber', 'type', 'price'].filter((f) => isBlank(data[f]));
  if (missing.length > 0) return `Missing required fields: ${missing.join(', ')}`;
  if (!isPositiveNumber(data.price)) return 'Price must be a positive number';
  return null;
};


app.get('/vehicles', (req, res) => {
  res.json(vehicles);
});

app.get('/vehicles/:id', (req, res) => {
  const id = Number(req.params.id); 
  const vehicle = vehicles.find((v) => v.id === id);


  if (!vehicle) return res.status(404).json({ error: `Vehicle with id ${req.params.id} not found` });

  res.json(vehicle);
});


app.post('/vehicles', (req, res) => {
  const data = req.body || {};


  const error = validateVehicle(data);
  if (error) return res.status(400).json({ error });

  const id = isBlank(data.id) ? Math.max(0, ...vehicles.map((v) => v.id)) + 1 : Number(data.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }


  if (vehicles.some((v) => v.id === id)) {
    return res.status(409).json({ error: `Vehicle with id ${id} already exists` });
  }

  const vehicle = {
    id,
    vehicleName: data.vehicleName,
    vehicleNumber: data.vehicleNumber,
    type: data.type,
    price: data.price
  };
  vehicles.push(vehicle);


  res.status(201).json({ message: 'Vehicle added successfully', vehicle });
});


app.put('/vehicles/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = vehicles.findIndex((v) => v.id === id);


  if (index === -1) return res.status(404).json({ error: `Vehicle with id ${req.params.id} not found` });


  const data = req.body || {};
  const error = validateVehicle(data);
  if (error) return res.status(400).json({ error });


  vehicles[index] = {
    id,
    vehicleName: data.vehicleName,
    vehicleNumber: data.vehicleNumber,
    type: data.type,
    price: data.price
  };
  res.json({ message: 'Vehicle updated successfully', vehicle: vehicles[index] });
});


app.delete('/vehicles/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = vehicles.findIndex((v) => v.id === id);

  if (index === -1) return res.status(404).json({ error: `Vehicle with id ${req.params.id} not found` });
  const [deleted] = vehicles.splice(index, 1);
  res.json({ message: 'Vehicle deleted successfully', vehicle: deleted });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});
