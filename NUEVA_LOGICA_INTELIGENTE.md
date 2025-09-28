# 🧠 Nueva Lógica Inteligente de Pendientes

## 📋 Resumen de Cambios

**ANTES**: Sistema destructivo que borraba y recreaba todos los registros
**AHORA**: Sistema inteligente que preserva ediciones del taller y actualiza solo lo necesario

---

## 🔑 Identificación Única de Registros

### **Clave Única**: `interno + trasladar_a`

**Ejemplos de registros independientes:**
- `74 → Taller` ✅ (Registro automático)
- `74 → IDISA` ✅ (Registro manual del taller)
- `74 → Taller Externo` ✅ (Registro manual del taller)
- `45 → Taller` ✅ (Otro vehículo)

**Resultado**: El sistema puede manejar múltiples pendientes del mismo vehículo para diferentes destinos.

---

## 🔄 Nueva Lógica de Procesamiento

### **1. Para cada vehículo crítico detectado:**

#### **A) Si YA EXISTE registro `interno + "Taller"`:**
```sql
UPDATE pendientes_operaciones SET
  -- ✅ ACTUALIZAR (datos técnicos):
  porcentaje_vida_km = [nuevo_cálculo]
  porcentaje_vida_hr = [nuevo_cálculo]
  km_faltantes = [nuevo_cálculo]
  hr_faltantes = [nuevo_cálculo]
  criticidad = [nuevo_nivel]
  fecha_actualizacion = now()

  -- ✅ PRESERVAR (ediciones del taller):
  tiempo_estimado = [NO TOCAR]
  motivo = [NO TOCAR]
  estado = [NO TOCAR]
  trasladar_a = [NO TOCAR]

  -- 🤔 CONDICIONAL (observaciones):
  observaciones = SI es auto-generada → actualizar
                  SI fue editada → preservar
```

#### **B) Si NO EXISTE registro `interno + "Taller"`:**
```sql
INSERT nuevo registro CON:
  interno = [vehículo_crítico]
  trasladar_a = "Taller"
  tiempo_estimado = [según_urgencia]
  motivo = [según_urgencia]
  estado = "pendiente"
  es_automatico = true
  + todos los datos técnicos calculados
```

### **2. Al final del procesamiento:**

#### **Limpiar registros obsoletos:**
```sql
DELETE registros WHERE:
  es_automatico = true
  AND estado = "pendiente"
  AND trasladar_a = "Taller"
  AND interno NOT IN [lista_de_críticos_actuales]
```

---

## 🛡️ Protecciones Implementadas

### **✅ Se preservan SIEMPRE:**
- `tiempo_estimado` editado por taller
- `motivo` editado por taller
- `estado` cambiado a "programado"/"en_proceso"/"completado"
- `trasladar_a` cambiado a "IDISA"/"Taller Externo"
- `observaciones` editadas manualmente

### **🔄 Se actualizan automáticamente:**
- `porcentaje_vida_km` y `porcentaje_vida_hr`
- `km_faltantes` y `hr_faltantes`
- `criticidad` (siempre "critico" por ahora)
- `fecha_actualizacion`
- `observaciones` si son auto-generadas (formato "Crítico por...")

### **🚫 NUNCA se tocan:**
- Registros con `es_automatico = false` (manuales)
- Registros con `estado != "pendiente"` (ya procesados)
- Registros con `trasladar_a != "Taller"` (destinos especiales)

---

## 📊 Ejemplos Prácticos

### **Caso 1: Vehículo crítico nuevo**
```
Sistema detecta: Interno 85 crítico (2% vida útil)
Base de datos: No hay registros del interno 85
Acción: CREATE nuevo registro → interno=85, trasladar_a="Taller"
```

### **Caso 2: Vehículo crítico existente sin ediciones**
```
Sistema detecta: Interno 74 crítico (1.5% vida útil)
Base de datos: interno=74, trasladar_a="Taller", motivo="Service + revisión"
Acción: UPDATE solo datos técnicos → porcentaje_vida_km=1.5
```

### **Caso 3: Vehículo crítico existente CON ediciones del taller**
```
Sistema detecta: Interno 74 crítico (3% vida útil)
Base de datos: interno=74, trasladar_a="Taller", motivo="TRANSMISIÓN URGENTE", tiempo_estimado="2 días"
Acción: UPDATE datos técnicos, PRESERVAR motivo y tiempo editados
```

### **Caso 4: Múltiples destinos del mismo vehículo**
```
Sistema detecta: Interno 74 crítico
Base de datos:
  - interno=74, trasladar_a="Taller" (automático)
  - interno=74, trasladar_a="IDISA" (manual del taller)
Acción: UPDATE solo el registro "Taller", NO tocar el registro "IDISA"
```

### **Caso 5: Vehículo ya no es crítico**
```
Sistema detecta: Interno 90 ya NO es crítico (cambio de aceite)
Base de datos: interno=90, trasladar_a="Taller", estado="pendiente"
Acción: DELETE registro automático (ya no es necesario)
```

---

## 🔧 Comandos Útiles para Taller

### **Ver registros por estado de edición:**
```sql
-- Registros automáticos sin editar
SELECT * FROM pendientes_operaciones
WHERE es_automatico = true
AND (motivo = 'Service + revisión' OR motivo LIKE 'Service completo%');

-- Registros editados por taller
SELECT * FROM pendientes_operaciones
WHERE es_automatico = true
AND motivo NOT LIKE 'Service%';

-- Registros manuales
SELECT * FROM pendientes_operaciones
WHERE es_automatico = false;
```

### **Simular múltiples pendientes del mismo vehículo:**
```sql
-- Crear pendiente manual para IDISA
INSERT INTO pendientes_operaciones
(vehiculo_id, interno, placa, trasladar_a, tiempo_estimado, motivo, estado, es_automatico)
VALUES
(123, 74, 'ABC123', 'IDISA', '1 día', 'Revisión técnica anual', 'programado', false);
```

---

## ⚡ Beneficios de la Nueva Lógica

1. **✅ Preservación Total**: Las ediciones del taller NUNCA se pierden
2. **✅ Flexibilidad**: Múltiples pendientes por vehículo (diferentes destinos)
3. **✅ Actualización Inteligente**: Solo se actualizan datos técnicos relevantes
4. **✅ Limpieza Automática**: Registros obsoletos se eliminan automáticamente
5. **✅ Eficiencia**: No hay recreación masiva de datos
6. **✅ Trazabilidad**: Logs específicos de qué se actualiza vs. qué se crea

---

## 🔍 Monitoreo y Debugging

### **Logs que verás en Supabase:**
```
NOTICE: Nuevo vehículo crítico: interno 85 - KM: 2.1%, Horas: 15.0%
NOTICE: Actualizado vehículo interno 74 - KM: 1.5%, Horas: 8.2%
NOTICE: Actualización de pendientes_operaciones completada: 3 registros nuevos insertados
```

### **Para verificar el comportamiento:**
```sql
-- Ver qué se actualizó recientemente
SELECT interno, trasladar_a, motivo, tiempo_estimado, fecha_actualizacion,
       porcentaje_vida_km, observaciones
FROM pendientes_operaciones
WHERE fecha_actualizacion > now() - interval '1 hour'
ORDER BY fecha_actualizacion DESC;
```

---

**🎯 Resultado**: Un sistema que respeta el trabajo del taller mientras mantiene los datos técnicos actualizados automáticamente.