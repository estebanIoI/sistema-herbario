const http = require('http');

async function testPlantAPI() {
  try {
    const postData = JSON.stringify({
      service: 'plants.getById',
      data: { id: 1 }
    });

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/service',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    const result = response.data;
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('\n=== DATOS DE LA PLANTA ===');
      console.log('ID:', result.data.id);
      console.log('Nombre científico:', result.data.scientific_name);
      console.log('Familia:', result.data.family);
      
      if (result.data.caracteristicas) {
        console.log('\n=== CARACTERÍSTICAS ===');
        console.log('Descripción:', result.data.caracteristicas.descripcion);
        console.log('Hábitat:', result.data.caracteristicas.habitat);
        console.log('Usos:', result.data.caracteristicas.usos);
        console.log('Cuidados:', result.data.caracteristicas.cuidados);
      } else {
        console.log('\n❌ NO HAY CARACTERÍSTICAS');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPlantAPI();
