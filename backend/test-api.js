// test-api.js
const axios = require('axios');

const apiUrl = 'http://localhost:5001/api/service';

async function main() {
  try {
    console.log('🔍 Consultando sugerencias...');
    
    // Paso 1: Obtener token de autenticación
    const authResponse = await axios.post(apiUrl, {
      service: 'auth.login',
      data: {
        email: 'admin@herbario.edu',
        password: 'admin123'
      }
    });
    
    if (!authResponse.data.success) {
      throw new Error('Error de autenticación: ' + JSON.stringify(authResponse.data));
    }
    
    const token = authResponse.data.data.token;
    console.log('✅ Autenticación exitosa');
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    // Paso 2: Obtener sugerencias
    const suggestionsResponse = await axios.post(apiUrl, {
      service: 'suggestions.getAll',
      data: {
        page: 1,
        limit: 10
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (suggestionsResponse.data.success) {
      const { suggestions, pagination, summary } = suggestionsResponse.data.data;
      
      console.log('\n📊 Resumen:');
      console.log(`- Total: ${summary.total}`);
      console.log(`- Pendientes: ${summary.pending}`);
      console.log(`- Aprobadas: ${summary.approved}`);
      console.log(`- Rechazadas: ${summary.rejected}`);
      
      console.log('\n📋 Sugerencias obtenidas:');
      suggestions.forEach((item, index) => {
        console.log(`${index + 1}. [${item.suggestion_type}] ${item.title} - Estado: ${item.status}`);
      });
      
      console.log(`\nPágina ${pagination.page} de ${pagination.totalPages}, mostrando ${suggestions.length} de ${pagination.total} sugerencias`);
    } else {
      console.error('❌ Error al obtener sugerencias:', suggestionsResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

main();
