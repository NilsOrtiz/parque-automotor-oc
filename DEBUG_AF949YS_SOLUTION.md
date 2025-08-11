# Debug Solution for Vehicle AF949YS Fuel Analysis Issue

## Problem Summary
The fuel analysis page was not showing all 32 fuel charge records for vehicle AF949YS despite the CSV containing all records. The issue was likely caused by mismatched placa values between the `vehiculos` and `cargas_combustible_ypf` tables.

## Root Cause
The original filtering logic in line 81 of the analysis page used strict equality (`===`):
```typescript
const cargasVehiculo = cargasData.filter(carga => carga.placa === vehiculo.Placa)
```

This can fail due to:
1. **Case sensitivity differences** - "AF949YS" vs "af949ys"
2. **Whitespace issues** - " AF949YS " vs "AF949YS"
3. **Character encoding differences** - invisible characters
4. **Data entry inconsistencies** between tables

## Solution Applied

### 1. Debug Logging Added
Added comprehensive debug logging in the analysis page to identify the exact data mismatch:
- Shows character-by-character comparison of placa values
- Displays exact match counts vs case-insensitive matches
- Reveals data inconsistencies between tables

### 2. Robust Matching Logic
Modified the filtering logic in both `cargarDatos()` and `cargarDatosGrafica()` functions to use a fallback approach:

```typescript
// Try multiple matching strategies to handle data inconsistencies
let cargasVehiculo = cargasData.filter(carga => carga.placa === vehiculo.Placa)

// If no exact matches, try case-insensitive
if (cargasVehiculo.length === 0) {
  cargasVehiculo = cargasData.filter(carga => 
    carga.placa && carga.placa.toLowerCase() === vehiculo.Placa.toLowerCase()
  )
}

// If still no matches, try trimmed comparison
if (cargasVehiculo.length === 0) {
  cargasVehiculo = cargasData.filter(carga => 
    carga.placa && carga.placa.trim() === vehiculo.Placa.trim()
  )
}

// If still no matches, try both case-insensitive and trimmed
if (cargasVehiculo.length === 0) {
  cargasVehiculo = cargasData.filter(carga => 
    carga.placa && 
    carga.placa.toLowerCase().trim() === vehiculo.Placa.toLowerCase().trim()
  )
}
```

### 3. Debug Tools Created

#### A. Debug Page
- Created `/src/app/debug-af949ys/page.tsx`
- Provides detailed analysis of data mismatches
- Can be accessed at `http://localhost:3000/debug-af949ys`

#### B. Standalone Debug Script  
- Created `debug-af949ys.js` in project root
- Can be run with Node.js to inspect database directly

## Files Modified

1. **`/src/app/vehiculos/analisis-combustible/page.tsx`**
   - Added debug logging (lines 78-116)
   - Enhanced filtering logic (lines 121-144 and 191-218)

2. **`/src/app/debug-af949ys/page.tsx`** (new file)
   - Comprehensive debugging interface

3. **`debug-af949ys.js`** (new file)
   - Standalone debugging script

## How to Test the Fix

### 1. Check Debug Output
1. Open the fuel analysis page
2. Open browser developer console (F12)
3. Look for debug messages starting with "🔍 DEBUG AF949YS:"
4. Review the matching results

### 2. Access Debug Page
Visit `http://localhost:3000/debug-af949ys` to see detailed data analysis

### 3. Expected Results
- Vehicle AF949YS should now show all 32 fuel charge records
- Debug logs will show which matching strategy succeeded
- The analysis page should display complete data

## Next Steps

### Immediate
1. Test the analysis page for vehicle AF949YS
2. Check browser console for debug output
3. Verify all 32 records are now visible

### Long-term Data Quality Improvements
1. **Standardize placa format** in database:
   ```sql
   UPDATE vehiculos SET Placa = UPPER(TRIM(Placa));
   UPDATE cargas_combustible_ypf SET placa = UPPER(TRIM(placa));
   ```

2. **Add database constraints** to ensure consistent formatting

3. **Remove debug code** once issue is confirmed fixed

### Clean-up
Once the issue is resolved, you can:
1. Remove debug logging code from the analysis page
2. Delete the debug files if no longer needed
3. Keep the robust matching logic for better data handling

## Prevention
To prevent similar issues in the future:
1. Implement data validation on CSV import
2. Use consistent case and trimming when storing placa values
3. Add database triggers to normalize placa format on insert/update