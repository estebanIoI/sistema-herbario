const db = require('./src/config/database');

async function checkDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Consultar plantas con sus campos de descripción, hábitat, usos y cuidados
    const [plants] = await db.query(`
      SELECT 
        id, 
        scientific_name, 
        description, 
        habitat, 
        uses, 
        care_instructions,
        CASE 
          WHEN description IS NOT NULL THEN 'Tiene descripción'
          ELSE 'SIN descripción'
        END as estado_descripcion,
        CASE 
          WHEN habitat IS NOT NULL THEN 'Tiene hábitat'
          ELSE 'SIN hábitat'
        END as estado_habitat,
        CASE 
          WHEN uses IS NOT NULL THEN 'Tiene usos'
          ELSE 'SIN usos'
        END as estado_usos,
        CASE 
          WHEN care_instructions IS NOT NULL THEN 'Tiene cuidados'
          ELSE 'SIN cuidados'
        END as estado_cuidados
      FROM plants 
      LIMIT 10
    `);

    console.log('\n=== ESTADO DE LOS DATOS EN LA BASE DE DATOS ===');
    plants.forEach(plant => {
      console.log(`\nID: ${plant.id} - ${plant.scientific_name}`);
      console.log(`  📝 Descripción: ${plant.estado_descripcion}`);
      console.log(`  🌿 Hábitat: ${plant.estado_habitat}`);
      console.log(`  💊 Usos: ${plant.estado_usos}`);
      console.log(`  🌱 Cuidados: ${plant.estado_cuidados}`);
      
      if (plant.description) console.log(`    Descripción: "${plant.description}"`);
      if (plant.habitat) console.log(`    Hábitat: "${plant.habitat}"`);
      if (plant.uses) console.log(`    Usos: "${plant.uses}"`);
      if (plant.care_instructions) console.log(`    Cuidados: "${plant.care_instructions}"`);
    });

    // Contar cuántas plantas tienen datos en cada campo
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_plantas,
        SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) as con_descripcion,
        SUM(CASE WHEN habitat IS NOT NULL AND habitat != '' THEN 1 ELSE 0 END) as con_habitat,
        SUM(CASE WHEN uses IS NOT NULL AND uses != '' THEN 1 ELSE 0 END) as con_usos,
        SUM(CASE WHEN care_instructions IS NOT NULL AND care_instructions != '' THEN 1 ELSE 0 END) as con_cuidados
      FROM plants
    `);

    console.log('\n=== ESTADÍSTICAS GENERALES ===');
    const stat = stats[0];
    console.log(`📊 Total de plantas: ${stat.total_plantas}`);
    console.log(`📝 Con descripción: ${stat.con_descripcion} (${((stat.con_descripcion/stat.total_plantas)*100).toFixed(1)}%)`);
    console.log(`🌿 Con hábitat: ${stat.con_habitat} (${((stat.con_habitat/stat.total_plantas)*100).toFixed(1)}%)`);
    console.log(`💊 Con usos: ${stat.con_usos} (${((stat.con_usos/stat.total_plantas)*100).toFixed(1)}%)`);
    console.log(`🌱 Con cuidados: ${stat.con_cuidados} (${((stat.con_cuidados/stat.total_plantas)*100).toFixed(1)}%)`);

    await db.end();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
