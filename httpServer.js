
import http from 'http';  
import fs from 'fs';       
import path from 'path';   
import { fileURLToPath } from 'url'; 

const PORT = 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const REQUIRED_FIELDS = ['id', 'vehicleName', 'vehicleNumber', 'type', 'price'];


const vehicles = [
  { id: 1, vehicleName: 'Hyundai Creta', vehicleNumber: 'HR26AB1234', type: 'SUV', price: 1500000 },
  { id: 2, vehicleName: 'Honda City', vehicleNumber: 'DL3CAB4567', type: 'Sedan', price: 1200000 },
  { id: 3, vehicleName: 'Tata Nexon', vehicleNumber: 'UP14CD9876', type: 'SUV', price: 1100000 }
];

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2)); 
};


const sendHtml = (res, statusCode, html) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(html);
};


const handleAddVehicle = (req, res) => {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    let vehicle;

    try {
      vehicle = JSON.parse(body);
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }

    if (vehicle === null || typeof vehicle !== 'object' || Array.isArray(vehicle)) {
      return sendJson(res, 400, { error: 'Request body must be a JSON object' });
    }

    const missing = REQUIRED_FIELDS.filter(
      (field) => vehicle[field] === undefined || vehicle[field] === null || vehicle[field] === ''
    );
    if (missing.length > 0) {
      return sendJson(res, 400, { error: 'Missing required fields', missingFields: missing });
    }

    if (vehicles.some((v) => v.id === vehicle.id)) {
      return sendJson(res, 409, { error: `Vehicle with id ${vehicle.id} already exists` });
    }

    const newVehicle = {
      id: vehicle.id,
      vehicleName: vehicle.vehicleName,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      price: vehicle.price
    };
    vehicles.push(newVehicle);
    sendJson(res, 201, { message: 'Vehicle added successfully', vehicle: newVehicle });
  });

  req.on('error', () => sendJson(res, 400, { error: 'Error reading request body' }));
};

const serveInfoPage = (res) => {
  const filePath = path.join(__dirname, 'public', 'info.html');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      return sendJson(res, 500, { error: 'Internal Server Error: unable to read info.html' });
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
};

const server = http.createServer((req, res) => {
  const { method } = req;

  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;

  if (pathname === '/' && method === 'GET') {
    return sendHtml(
      res,
      200,
      `<html><head><title>Vehicle Management</title></head>
       <body style="font-family: Arial, sans-serif; text-align:center; margin-top:60px;">
         <h1>Welcome to the Vehicle Management Application</h1>
         <p>Built with the Node.js HTTP module.</p>
         <p><a href="/vehicles">Vehicles</a> | <a href="/about">About</a> | <a href="/info">Info</a></p>
       </body></html>`
    );
  }

  if (pathname === '/vehicles' && method === 'GET') {
    return sendJson(res, 200, vehicles);
  }

  if (pathname === '/add-vehicle' && method === 'POST') {
    return handleAddVehicle(req, res);
  }

  if (pathname === '/about' && method === 'GET') {
    return sendJson(res, 200, {
      application: 'Vehicle Management Web Application',
      version: '1.0.0',
      description: 'Maintains vehicle records using the Node.js HTTP module with in-memory storage.',
      technologies: ['Node.js', 'HTTP Module', 'FS Module']
    });
  }

  if (pathname === '/info' && method === 'GET') {
    return serveInfoPage(res);
  }

  if (['/', '/vehicles', '/about', '/info', '/add-vehicle'].includes(pathname)) {
    return sendJson(res, 405, { error: `Method ${method} not allowed on ${pathname}` });
  }

  sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});
