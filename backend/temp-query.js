// temp-query.js
const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin',
      database: 'herbario_heaa'
    });
    
    console.log('Conexión establecida correctamente');
    
    // Mostrar estructura de la tabla
    console.log('\nEstructura de la tabla sugerencias:');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'herbario_heaa' AND TABLE_NAME = 'suggestions'
    `);
    
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}): ${col.IS_NULLABLE === 'YES' ? 'Nullable' : 'Not Null'} ${col.COLUMN_KEY === 'PRI' ? '[PK]' : ''}`);
    });
    
    // Contar total de sugerencias
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM suggestions');
    console.log('Total de sugerencias en la base de datos:', rows[0].total);
    
    // Detallar por estado
    console.log('\nDetalle por estado:');
    const [statusCounts] = await connection.execute('SELECT status, COUNT(*) as count FROM suggestions GROUP BY status');
    statusCounts.forEach(row => {
      console.log(`- ${row.status}: ${row.count}`);
    });
    
    // Mostrar algunas sugerencias de ejemplo
    console.log('\nEjemplos de sugerencias:');
    const [examples] = await connection.execute('SELECT id, type, title, status FROM suggestions LIMIT 5');
    examples.forEach(row => {
      console.log(`ID: ${row.id}, Tipo: ${row.type}, Estado: ${row.status}, Título: ${row.title}`);
    });
    
    await connection.end();
    
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
  }
}

main();
