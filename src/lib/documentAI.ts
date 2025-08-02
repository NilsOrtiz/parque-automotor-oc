import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { supabase } from './supabase';
import type { 
  RevisionVehicular, 
  ItemRevision, 
  ObservacionRevision, 
  LogProcesamientoOCR 
} from './supabase';

// Configuración de Google Cloud Document AI
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID!;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us'; // us, eu, asia
const PROCESSOR_ID = process.env.GOOGLE_CLOUD_PROCESSOR_ID!;

// Cliente de Document AI
const client = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Ruta al archivo JSON de credenciales
});

// Nombre completo del procesador
const processorName = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

/**
 * Interfaz para el resultado del procesamiento OCR
 */
interface ResultadoOCR {
  checkboxes: ItemRevision[];
  observaciones: ObservacionRevision[];
  confianzaPromedio: number;
  tiempoProcesamiento: number;
  rawResponse: any;
}

/**
 * Configuración de secciones del formulario para mapeo automático
 */
const SECCION_MAPPING = {
  'INFORMACIÓN DEL VEHÍCULO': 'info_vehiculo',
  'MOTOR Y ACEITES': 'motor',
  'FILTROS': 'filtros',
  'SISTEMA DE FRENOS': 'frenos',
  'NEUMÁTICOS': 'neumaticos',
  'CORREAS Y TENSORES': 'correas',
  'SUSPENSIÓN': 'suspension',
  'EMBRAGUE': 'embrague',
  'BATERÍA Y SISTEMA ELÉCTRICO': 'electrico',
  'RESUMEN Y PRIORIDADES': 'resumen'
};

/**
 * Procesa un PDF de revisión vehicular con Google Cloud Document AI
 */
export async function procesarRevisionVehicular(
  pdfBuffer: Buffer,
  vehiculoId: number,
  tecnicoResponsable?: string
): Promise<RevisionVehicular> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Iniciando procesamiento OCR con Document AI...');
    
    // Preparar la solicitud para Document AI
    const request = {
      name: processorName,
      rawDocument: {
        content: pdfBuffer,
        mimeType: 'application/pdf',
      },
      processOptions: {
        ocrConfig: {
          premiumFeatures: {
            enableSelectionMarkDetection: true, // Para detectar checkboxes
            computeStyleInfo: true,             // Para información de estilo
            enableSymbol: true,                 // Para símbolos especiales
          },
          hints: {
            languageHints: ['es', 'en'], // Español e inglés
          },
        },
      },
    };

    // Procesar documento
    const [result] = await client.processDocument(request);
    const tiempoProcesamiento = Date.now() - startTime;
    
    console.log('✅ Documento procesado exitosamente');
    console.log(`⏱️ Tiempo de procesamiento: ${tiempoProcesamiento}ms`);
    
    // Extraer datos del resultado
    const resultadoOCR = await extraerDatosFormulario(result, tiempoProcesamiento);
    
    // Crear registro de revisión en la base de datos
    const revision = await crearRevisionEnDB(
      vehiculoId, 
      resultadoOCR, 
      tecnicoResponsable
    );

    console.log(`📝 Revisión creada con ID: ${revision.id}`);
    return revision;
    
  } catch (error) {
    console.error('❌ Error procesando revisión vehicular:', error);
    throw new Error(`Error en procesamiento OCR: ${error}`);
  }
}

/**
 * Extrae y estructura los datos del resultado de Document AI
 */
async function extraerDatosFormulario(
  result: any, 
  tiempoProcesamiento: number
): Promise<ResultadoOCR> {
  const checkboxes: ItemRevision[] = [];
  const observaciones: ObservacionRevision[] = [];
  const document = result.document;
  
  if (!document || !document.pages || document.pages.length === 0) {
    throw new Error('Documento vacío o sin páginas');
  }

  let totalConfianza = 0;
  let contadorConfianza = 0;

  // Procesar cada página
  for (const [pageIndex, page] of document.pages.entries()) {
    console.log(`📄 Procesando página ${pageIndex + 1}...`);
    
    // Extraer checkboxes/selection marks
    if (page.visualElements) {
      for (const element of page.visualElements) {
        if (element.type === 'filled_checkbox' || element.type === 'unfilled_checkbox') {
          const checkbox = await procesarCheckbox(element, page, pageIndex);
          if (checkbox) {
            checkboxes.push(checkbox);
            totalConfianza += checkbox.confianza_checkbox || 0;
            contadorConfianza++;
          }
        }
      }
    }

    // Extraer regiones de texto (observaciones manuscritas)
    if (page.blocks) {
      for (const block of page.blocks) {
        if (block.layout && block.layout.textAnchor) {
          const observacion = await procesarRegionTexto(block, document.text, pageIndex);
          if (observacion) {
            observaciones.push(observacion);
            if (observacion.confianza_texto) {
              totalConfianza += observacion.confianza_texto;
              contadorConfianza++;
            }
          }
        }
      }
    }

    // Extraer form fields si están disponibles
    if (page.formFields) {
      for (const field of page.formFields) {
        const fieldData = await procesarFormField(field, document.text, pageIndex);
        if (fieldData.checkbox) checkboxes.push(fieldData.checkbox);
        if (fieldData.observacion) observaciones.push(fieldData.observacion);
      }
    }
  }

  const confianzaPromedio = contadorConfianza > 0 ? totalConfianza / contadorConfianza : 0;
  
  console.log(`📊 Extraídos: ${checkboxes.length} checkboxes, ${observaciones.length} observaciones`);
  console.log(`🎯 Confianza promedio: ${confianzaPromedio.toFixed(2)}%`);

  return {
    checkboxes,
    observaciones,
    confianzaPromedio,
    tiempoProcesamiento,
    rawResponse: result,
  };
}

/**
 * Procesa un checkbox detectado
 */
async function procesarCheckbox(
  element: any, 
  page: any, 
  pageIndex: number
): Promise<ItemRevision | null> {
  if (!element.layout || !element.layout.boundingPoly) return null;

  const bbox = element.layout.boundingPoly.normalizedVertices?.[0];
  if (!bbox) return null;

  // Intentar identificar la sección y subsección basándose en el contexto
  const contexto = await identificarContextoCheckbox(element, page);
  
  return {
    id: 0, // Se asignará en la DB
    revision_id: 0, // Se asignará después
    seccion: contexto.seccion,
    subseccion: contexto.subseccion,
    item_especifico: contexto.item,
    checkbox_marcado: element.type === 'filled_checkbox',
    confianza_checkbox: element.confidence ? element.confidence * 100 : 90,
    bbox_x1: Math.round(bbox.x * 1000),
    bbox_y1: Math.round(bbox.y * 1000),
    bbox_x2: Math.round((bbox.x + 0.02) * 1000), // Aproximación para checkbox
    bbox_y2: Math.round((bbox.y + 0.02) * 1000),
    created_at: new Date().toISOString(),
  };
}

/**
 * Procesa una región de texto (observaciones)
 */
async function procesarRegionTexto(
  block: any, 
  fullText: string, 
  pageIndex: number
): Promise<ObservacionRevision | null> {
  if (!block.layout || !block.layout.textAnchor) return null;

  const textAnchor = block.layout.textAnchor;
  const bbox = block.layout.boundingPoly?.normalizedVertices?.[0];
  
  if (!bbox || !textAnchor.textSegments) return null;

  // Extraer texto de la región
  let textoExtraido = '';
  for (const segment of textAnchor.textSegments) {
    const startIndex = parseInt(segment.startIndex) || 0;
    const endIndex = parseInt(segment.endIndex) || fullText.length;
    textoExtraido += fullText.substring(startIndex, endIndex);
  }

  // Filtrar solo regiones que parecen observaciones (contienen texto manuscrito)
  if (textoExtraido.length < 5 || /^[A-Z\s]{1,20}$/.test(textoExtraido)) {
    return null; // Probablemente es un header o texto impreso
  }

  const seccion = identificarSeccionPorTexto(textoExtraido);

  return {
    id: 0,
    revision_id: 0,
    seccion,
    texto_ocr: textoExtraido.trim(),
    confianza_texto: block.confidence ? block.confidence * 100 : 70,
    revisado_manualmente: false,
    bbox_x1: Math.round(bbox.x * 1000),
    bbox_y1: Math.round(bbox.y * 1000),
    bbox_x2: Math.round((bbox.x + (bbox.width || 0.2)) * 1000),
    bbox_y2: Math.round((bbox.y + (bbox.height || 0.05)) * 1000),
    created_at: new Date().toISOString(),
  };
}

/**
 * Procesa un form field detectado
 */
async function procesarFormField(
  field: any, 
  fullText: string, 
  pageIndex: number
): Promise<{ checkbox?: ItemRevision; observacion?: ObservacionRevision }> {
  const result: { checkbox?: ItemRevision; observacion?: ObservacionRevision } = {};

  // Si el field tiene un checkbox/selection mark
  if (field.fieldValue && field.fieldValue.type === 'selectionMark') {
    // Procesar como checkbox
    const checkbox = await procesarCheckbox(field.fieldValue, null, pageIndex);
    if (checkbox) result.checkbox = checkbox;
  }

  // Si el field tiene texto
  if (field.fieldValue && field.fieldValue.textAnchor) {
    const observacion = await procesarRegionTexto(field.fieldValue, fullText, pageIndex);
    if (observacion) result.observacion = observacion;
  }

  return result;
}

/**
 * Identifica el contexto de un checkbox (sección, subsección, item)
 */
async function identificarContextoCheckbox(
  element: any, 
  page: any
): Promise<{ seccion: string; subseccion?: string; item?: string }> {
  // Implementación simplificada - en producción sería más sofisticada
  // Buscaría texto cercano para determinar el contexto
  
  return {
    seccion: 'general',
    subseccion: 'revision',
    item: 'checkbox_detectado'
  };
}

/**
 * Identifica la sección basándose en el contenido del texto
 */
function identificarSeccionPorTexto(texto: string): string {
  const textoUpper = texto.toUpperCase();
  
  if (textoUpper.includes('ACEITE') || textoUpper.includes('MOTOR')) return 'motor';
  if (textoUpper.includes('FILTRO')) return 'filtros';
  if (textoUpper.includes('FRENO') || textoUpper.includes('PASTILLA')) return 'frenos';
  if (textoUpper.includes('NEUMATICO') || textoUpper.includes('LLANTA')) return 'neumaticos';
  if (textoUpper.includes('CORREA')) return 'correas';
  if (textoUpper.includes('SUSPENSION')) return 'suspension';
  if (textoUpper.includes('EMBRAGUE')) return 'embrague';
  if (textoUpper.includes('BATERIA') || textoUpper.includes('ELECTRICO')) return 'electrico';
  
  return 'general';
}

/**
 * Crea el registro de revisión en la base de datos
 */
async function crearRevisionEnDB(
  vehiculoId: number,
  resultadoOCR: ResultadoOCR,
  tecnicoResponsable?: string
): Promise<RevisionVehicular> {
  
  // 1. Crear registro principal de revisión
  const { data: revision, error: revisionError } = await supabase
    .from('revisiones_vehiculares')
    .insert({
      vehiculo_id: vehiculoId,
      fecha_revision: new Date().toISOString().split('T')[0],
      tecnico_responsable,
      procesado_con_ia: true,
      confianza_ocr: resultadoOCR.confianzaPromedio,
    })
    .select()
    .single();

  if (revisionError || !revision) {
    throw new Error(`Error creando revisión: ${revisionError?.message}`);
  }

  // 2. Insertar items de revisión (checkboxes)
  if (resultadoOCR.checkboxes.length > 0) {
    const itemsConRevisionId = resultadoOCR.checkboxes.map(item => ({
      ...item,
      revision_id: revision.id
    }));

    const { error: itemsError } = await supabase
      .from('items_revision')
      .insert(itemsConRevisionId);

    if (itemsError) {
      console.warn('⚠️ Error insertando items de revisión:', itemsError.message);
    }
  }

  // 3. Insertar observaciones
  if (resultadoOCR.observaciones.length > 0) {
    const observacionesConRevisionId = resultadoOCR.observaciones.map(obs => ({
      ...obs,
      revision_id: revision.id
    }));

    const { error: obsError } = await supabase
      .from('observaciones_revision')
      .insert(observacionesConRevisionId);

    if (obsError) {
      console.warn('⚠️ Error insertando observaciones:', obsError.message);
    }
  }

  // 4. Crear log de procesamiento
  const { error: logError } = await supabase
    .from('log_procesamiento_ocr')
    .insert({
      revision_id: revision.id,
      servicio_usado: 'google_document_ai',
      tiempo_procesamiento_ms: resultadoOCR.tiempoProcesamiento,
      total_checkboxes_detectados: resultadoOCR.checkboxes.length,
      total_texto_regiones: resultadoOCR.observaciones.length,
      confianza_promedio: resultadoOCR.confianzaPromedio,
      modelo_usado: 'form-parser',
      response_crudo: resultadoOCR.rawResponse,
    });

  if (logError) {
    console.warn('⚠️ Error creando log de procesamiento:', logError.message);
  }

  console.log('✅ Revisión guardada exitosamente en la base de datos');
  return revision;
}

/**
 * Función helper para subir PDF a Supabase Storage
 */
export async function subirPDFRevision(
  archivo: File, 
  vehiculoId: number
): Promise<string> {
  const timestamp = Date.now();
  const nombreArchivo = `revision_${vehiculoId}_${timestamp}.pdf`;
  
  const { data, error } = await supabase.storage
    .from('revisiones-pdfs')
    .upload(nombreArchivo, archivo, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Error subiendo PDF: ${error.message}`);
  }

  return data.path;
}

/**
 * Función para obtener URL pública del PDF
 */
export async function obtenerURLPublicaPDF(path: string): Promise<string> {
  const { data } = supabase.storage
    .from('revisiones-pdfs')
    .getPublicUrl(path);

  return data.publicUrl;
}