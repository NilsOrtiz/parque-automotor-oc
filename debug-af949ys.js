// Debug script to check vehicle AF949YS data
// This is a standalone script to run with Node.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAF949YS() {
  console.log('🔍 Debugging vehicle AF949YS...\n');

  try {
    // 1. Check if vehicle exists in vehiculos table
    console.log('1. Checking vehiculos table for AF949YS:');
    const { data: vehiculos, error: vehiculosError } = await supabase
      .from('vehiculos')
      .select('*')
      .ilike('placa', '%AF949YS%');

    if (vehiculosError) {
      console.error('❌ Error querying vehiculos:', vehiculosError);
    } else {
      console.log(`Found ${vehiculos.length} vehicles with similar placa:`);
      vehiculos.forEach((v, i) => {
        console.log(`  ${i + 1}. ID: ${v.id}, Placa: "${v.Placa}", Marca: ${v.Marca}, Modelo: ${v.Modelo}`);
        // Show exact placa characters and length
        console.log(`     Placa details: Length=${v.Placa.length}, Chars=[${v.Placa.split('').join(', ')}]`);
      });
    }

    // 2. Check all vehicles that contain AF949YS (case insensitive)
    console.log('\n2. All vehicles containing "AF949YS" (case insensitive):');
    const { data: allVehiculos, error: allVehiculosError } = await supabase
      .from('vehiculos')
      .select('id, Placa, Marca, Modelo')
      .or('placa.ilike.%af949ys%,placa.ilike.%AF949YS%');

    if (allVehiculosError) {
      console.error('❌ Error:', allVehiculosError);
    } else {
      console.log(`Found ${allVehiculos.length} vehicles:`);
      allVehiculos.forEach((v, i) => {
        console.log(`  ${i + 1}. ID: ${v.id}, Placa: "${v.Placa}"`);
      });
    }

    // 3. Check cargas_combustible_ypf table for AF949YS
    console.log('\n3. Checking cargas_combustible_ypf table for AF949YS:');
    const { data: cargas, error: cargasError } = await supabase
      .from('cargas_combustible_ypf')
      .select('*')
      .ilike('placa', '%AF949YS%');

    if (cargasError) {
      console.error('❌ Error querying cargas:', cargasError);
    } else {
      console.log(`Found ${cargas.length} fuel charges:`);
      cargas.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i + 1}. ID: ${c.id}, Placa: "${c.placa}", Date: ${c.fecha_carga}, Liters: ${c.litros_cargados}`);
        // Show exact placa characters and length
        console.log(`     Placa details: Length=${c.placa.length}, Chars=[${c.placa.split('').join(', ')}]`);
      });
      if (cargas.length > 5) {
        console.log(`     ... and ${cargas.length - 5} more`);
      }
    }

    // 4. Check all cargas that contain AF949YS (case insensitive)
    console.log('\n4. All fuel charges containing "AF949YS" (case insensitive):');
    const { data: allCargas, error: allCargasError } = await supabase
      .from('cargas_combustible_ypf')
      .select('id, placa, fecha_carga, litros_cargados')
      .or('placa.ilike.%af949ys%,placa.ilike.%AF949YS%')
      .order('fecha_carga', { ascending: false });

    if (allCargasError) {
      console.error('❌ Error:', allCargasError);
    } else {
      console.log(`Found ${allCargas.length} fuel charges:`);
      allCargas.slice(0, 10).forEach((c, i) => {
        console.log(`  ${i + 1}. Placa: "${c.placa}", Date: ${c.fecha_carga}, Liters: ${c.litros_cargados}`);
      });
      if (allCargas.length > 10) {
        console.log(`     ... and ${allCargas.length - 10} more`);
      }
    }

    // 5. Check exact match
    console.log('\n5. Exact match tests:');
    
    // Get vehicle with exact placa
    const { data: exactVehiculo, error: exactVehiculoError } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('placa', 'AF949YS')
      .single();

    if (exactVehiculoError && exactVehiculoError.code !== 'PGRST116') {
      console.error('❌ Error getting exact vehicle:', exactVehiculoError);
    } else if (exactVehiculoError && exactVehiculoError.code === 'PGRST116') {
      console.log('❌ No vehicle found with exact placa "AF949YS"');
    } else {
      console.log(`✅ Found exact vehicle: ID=${exactVehiculo.id}, Placa="${exactVehiculo.Placa}"`);
      
      // Now check fuel charges for this exact placa
      const { data: exactCargas, error: exactCargasError } = await supabase
        .from('cargas_combustible_ypf')
        .select('*')
        .eq('placa', exactVehiculo.Placa);

      if (exactCargasError) {
        console.error('❌ Error getting exact fuel charges:', exactCargasError);
      } else {
        console.log(`✅ Found ${exactCargas.length} fuel charges for exact placa "${exactVehiculo.Placa}"`);
      }
    }

    // 6. Test the filtering logic from the analysis page
    console.log('\n6. Testing filtering logic from analysis page:');
    
    const { data: vehiculosData, error: vehiculosDataError } = await supabase
      .from('vehiculos')
      .select('*')
      .order('Nro_Interno');

    const { data: cargasData, error: cargasDataError } = await supabase
      .from('cargas_combustible_ypf')
      .select('*')
      .order('fecha_carga', { ascending: true });

    if (vehiculosDataError || cargasDataError) {
      console.error('❌ Error loading data:', vehiculosDataError || cargasDataError);
    } else {
      // Find vehicles with AF949YS in placa
      const af949ysVehiculos = vehiculosData.filter(v => 
        v.Placa && v.Placa.toLowerCase().includes('af949ys')
      );
      
      console.log(`Found ${af949ysVehiculos.length} vehicles containing "af949ys":`);
      
      af949ysVehiculos.forEach(vehiculo => {
        console.log(`\n  Vehicle: ID=${vehiculo.id}, Placa="${vehiculo.Placa}"`);
        
        // Apply the same filter as line 81
        const cargasVehiculo = cargasData.filter(carga => carga.placa === vehiculo.Placa);
        console.log(`    Fuel charges found: ${cargasVehiculo.length}`);
        
        if (cargasVehiculo.length > 0) {
          console.log('    Sample charges:');
          cargasVehiculo.slice(0, 3).forEach((carga, i) => {
            console.log(`      ${i + 1}. Date: ${carga.fecha_carga}, Liters: ${carga.litros_cargados}`);
          });
        }
        
        // Also test case-insensitive filtering
        const cargasVehiculoCaseInsensitive = cargasData.filter(carga => 
          carga.placa && carga.placa.toLowerCase() === vehiculo.Placa.toLowerCase()
        );
        console.log(`    Fuel charges (case-insensitive): ${cargasVehiculoCaseInsensitive.length}`);
        
        // Check for similar placas
        const similarCargas = cargasData.filter(carga => 
          carga.placa && carga.placa.toLowerCase().includes('af949ys')
        );
        console.log(`    All charges with similar placa: ${similarCargas.length}`);
        
        if (similarCargas.length > 0) {
          const uniquePlacas = [...new Set(similarCargas.map(c => c.placa))];
          console.log(`    Unique placas in fuel charges: ${uniquePlacas.map(p => `"${p}"`).join(', ')}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

debugAF949YS();