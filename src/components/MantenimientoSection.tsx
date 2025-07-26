'use client'

import { Vehiculo } from '@/lib/supabase'

interface Props {
  title: string
  fields: Array<{
    label: string
    kmField?: keyof Vehiculo
    dateField?: keyof Vehiculo
    modelField?: keyof Vehiculo
    litersField?: keyof Vehiculo
  }>
  vehiculo: Vehiculo
  editedVehiculo: Vehiculo | null
  editMode: boolean
  onUpdate: (updates: Partial<Vehiculo>) => void
}

export default function MantenimientoSection({ 
  title, 
  fields, 
  vehiculo, 
  editedVehiculo, 
  editMode, 
  onUpdate 
}: Props) {
  // Función para verificar si un campo completo debe ocultarse
  const isFieldCompletelyHidden = (field: any) => {
    const modelValue = vehiculo[field.modelField as keyof Vehiculo] as string
    const dateValue = vehiculo[field.dateField as keyof Vehiculo] as string
    const kmValue = vehiculo[field.kmField as keyof Vehiculo] as number
    
    // Si todos los sub-campos están marcados como "No Aplica", ocultar todo el campo
    const modelNotApplicable = modelValue && (modelValue.toUpperCase() === 'N/A' || modelValue.toUpperCase() === 'NO APLICA')
    const dateNotApplicable = dateValue === '1900-01-01'
    const kmNotApplicable = kmValue === -1
    
    // Si al menos uno de los campos principales (modelo, fecha, km) está marcado como N/A, 
    // consideramos que todo el campo no aplica
    return modelNotApplicable || dateNotApplicable || kmNotApplicable
  }

  // Función para verificar si un campo está específicamente marcado como "No Aplica"
  const isFieldExplicitlyMarkedNA = (field: any) => {
    const modelValue = vehiculo[field.modelField as keyof Vehiculo] as string
    const dateValue = vehiculo[field.dateField as keyof Vehiculo] as string
    const kmValue = vehiculo[field.kmField as keyof Vehiculo] as number
    
    // Solo ocultar si está ESPECÍFICAMENTE marcado como N/A, no si está vacío/null
    const modelMarkedNA = modelValue && (modelValue.toUpperCase() === 'N/A' || modelValue.toUpperCase() === 'NO APLICA')
    const dateMarkedNA = dateValue === '1900-01-01'
    const kmMarkedNA = kmValue === -1
    
    // Solo ocultar si TODOS los campos principales están marcados como N/A
    return modelMarkedNA && dateMarkedNA && kmMarkedNA
  }

  // Mostrar todos los campos por defecto, solo ocultar los explícitamente marcados
  const fieldsToShow = fields.filter(field => !isFieldExplicitlyMarkedNA(field))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {fieldsToShow.map((field, index) => {
          // Verificar si al menos un sub-campo es visible
          const hasVisibleSubFields = () => {
            let visibleFields = 0
            let totalFields = 0
            
            // Verificar KM
            if (field.kmField) {
              totalFields++
              if ((vehiculo[field.kmField] as number) !== -1) {
                visibleFields++
              }
            }
            
            // Verificar Fecha
            if (field.dateField) {
              totalFields++
              if ((vehiculo[field.dateField] as string) !== '1900-01-01') {
                visibleFields++
              }
            }
            
            // Verificar Modelo
            if (field.modelField) {
              totalFields++
              const modelValue = vehiculo[field.modelField] as string
              if (!(modelValue && (modelValue.toUpperCase() === 'N/A' || modelValue.toUpperCase() === 'NO APLICA'))) {
                visibleFields++
              }
            }
            
            // Solo mostrar si hay al menos un campo visible
            return visibleFields > 0
          }

          // Solo mostrar el grupo si tiene al menos un sub-campo visible
          if (!hasVisibleSubFields()) {
            return null
          }

          return (
            <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
              <h4 className="font-medium text-gray-800 mb-3">{field.label}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Kilometraje */}
              {field.kmField && (vehiculo[field.kmField] as number) !== -1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kilometraje</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={editedVehiculo?.[field.kmField] as number || ''}
                      onChange={(e) => onUpdate({ [field.kmField!]: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="km"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {vehiculo[field.kmField] 
                        ? (vehiculo[field.kmField] as number).toLocaleString() + ' km' 
                        : 'No registrado'
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Fecha */}
              {field.dateField && (vehiculo[field.dateField] as string) !== '1900-01-01' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editedVehiculo?.[field.dateField] as string || ''}
                      onChange={(e) => onUpdate({ [field.dateField!]: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {vehiculo[field.dateField] 
                        ? new Date(vehiculo[field.dateField] as string).toLocaleDateString() 
                        : 'No registrado'
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Modelo */}
              {field.modelField && (() => {
                const modelValue = vehiculo[field.modelField] as string
                const isNotApplicable = modelValue && (
                  modelValue.toUpperCase() === 'N/A' || 
                  modelValue.toUpperCase() === 'NO APLICA'
                )
                return !isNotApplicable
              })() && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Modelo</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedVehiculo?.[field.modelField] as string || ''}
                      onChange={(e) => onUpdate({ [field.modelField!]: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Modelo/Marca"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {vehiculo[field.modelField] as string || 'No registrado'}
                    </p>
                  )}
                </div>
              )}

              {/* Litros */}
              {field.litersField && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Litros</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editedVehiculo?.[field.litersField] as number || ''}
                      onChange={(e) => onUpdate({ [field.litersField!]: parseFloat(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="L"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {vehiculo[field.litersField] 
                        ? (vehiculo[field.litersField] as number) + ' L' 
                        : 'No registrado'
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}