import { useState } from 'react'

function App() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-neutral-gray-light p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-primary mb-2">TEA Link</h1>
        <p className="text-base text-neutral-gray">
          Sistema de Comunicación para Personas con TEA - Demostración UI/UX
        </p>
      </div>

      {/* Paleta de Colores */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold mb-6">Paleta de Colores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Primario */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
            <div className="bg-primary h-24 rounded-lg mb-3"></div>
            <h3 className="text-xl font-semibold mb-1">Primario</h3>
            <p className="text-sm text-neutral-gray-medium">#4A90E2 - Azul calmado</p>
          </div>

          {/* Secundario */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
            <div className="bg-secondary h-24 rounded-lg mb-3"></div>
            <h3 className="text-xl font-semibold mb-1">Secundario</h3>
            <p className="text-sm text-neutral-gray-medium">#7ED321 - Verde suave</p>
          </div>

          {/* Gris */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
            <div className="bg-neutral-gray h-24 rounded-lg mb-3"></div>
            <h3 className="text-xl font-semibold mb-1">Neutro</h3>
            <p className="text-sm text-neutral-gray-medium">#333333 - Textos</p>
          </div>
        </div>

        {/* Estados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
            <div className="bg-status-success h-16 rounded-lg mb-3"></div>
            <h3 className="text-xl font-semibold mb-1">Éxito</h3>
            <p className="text-sm text-neutral-gray-medium">#7ED321</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
            <div className="bg-status-warning h-16 rounded-lg mb-3"></div>
            <h3 className="text-xl font-semibold mb-1">Advertencia</h3>
            <p className="text-sm text-neutral-gray-medium">#F5A623</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
            <div className="bg-status-error h-16 rounded-lg mb-3"></div>
            <h3 className="text-xl font-semibold mb-1">Error</h3>
            <p className="text-sm text-neutral-gray-medium">#D0021B</p>
          </div>
        </div>
      </div>

      {/* Tipografía */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold mb-6">Tipografía (Inter)</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Título H1 - 32px / 2rem</h1>
            <p className="text-sm text-neutral-gray-medium">Font weight: 700</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Título H2 - 24px / 1.5rem</h2>
            <p className="text-sm text-neutral-gray-medium">Font weight: 600</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Título H3 - 20px / 1.25rem</h3>
            <p className="text-sm text-neutral-gray-medium">Font weight: 600</p>
          </div>

          <div>
            <p className="text-base">Texto normal (body) - 16px / 1rem - Font weight: 400</p>
          </div>

          <div>
            <p className="text-sm">Texto pequeño - 14px / 0.875rem - Font weight: 400</p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold mb-6">Botones</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light">
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors min-h-11 min-w-11">
              Botón Primario
            </button>
            <button className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors min-h-11 min-w-11">
              Botón Secundario
            </button>
            <button className="bg-neutral-gray text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-gray/80 transition-colors min-h-11 min-w-11">
              Botón Deshabilitado
            </button>
          </div>
        </div>
      </div>

      {/* Formularios */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold mb-6">Formularios</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light max-w-2xl">
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-semibold mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-neutral-gray-medium rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-11"
                placeholder="correo@ejemplo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-neutral-gray-medium rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-11"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-base font-semibold mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                className="w-full px-4 py-3 border border-neutral-gray-medium rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-11 resize-none"
                rows={4}
                placeholder="Escribe aquí tu observación..."
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors min-h-11 min-w-11">
                Guardar
              </button>
              <button type="button" className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors min-h-11 min-w-11">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cards de Ejemplo */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold mb-6">Cards / Tarjetas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Métrica */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light text-center">
            <div className="text-4xl font-bold text-primary mb-2">45</div>
            <h3 className="text-xl font-semibold mb-1">Observaciones</h3>
            <p className="text-sm text-neutral-gray-medium">Total registradas</p>
          </div>

          {/* Card Métrica */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light text-center">
            <div className="text-4xl font-bold text-secondary mb-2">8</div>
            <h3 className="text-xl font-semibold mb-1">Esta Semana</h3>
            <p className="text-sm text-neutral-gray-medium">Nuevas observaciones</p>
          </div>

          {/* Card Métrica */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light text-center">
            <div className="text-4xl font-bold text-neutral-gray mb-2">12</div>
            <h3 className="text-xl font-semibold mb-1">Perfiles</h3>
            <p className="text-sm text-neutral-gray-medium">Activos en sistema</p>
          </div>
        </div>

        {/* Card de Observación */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-gray-light mt-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-sm text-neutral-gray-medium">13 Abril 2026</span>
              <span className="mx-2 text-neutral-gray-medium">|</span>
              <span className="text-sm text-neutral-gray-medium">Cristian Monsalve</span>
              <span className="mx-2 text-neutral-gray-medium">|</span>
              <span className="inline-block bg-primary text-white text-sm px-3 py-1 rounded-full">
                Conducta
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Juan Pérez (8 años)</h3>
          
          <p className="text-base text-neutral-gray mb-4">
            "Hoy Juan mostró gran avance en su capacidad de compartir juguetes 
            con compañeros. Mantuvo contacto visual durante la interacción..."
          </p>

          <div className="flex gap-3">
            <button className="bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary transition-colors">
              👁️ Ver
            </button>
            <button className="bg-neutral-gray-light text-neutral-gray px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-gray-medium/20 transition-colors">
              ✏️ Editar
            </button>
            <button className="bg-neutral-gray-light text-neutral-gray px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-gray-medium/20 transition-colors">
              📊 Agregar a Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center mt-16 pb-8">
        <p className="text-sm text-neutral-gray-medium">
          TEA Link © 2026 - Proyecto de Titulación DuocUC
        </p>
      </div>
    </div>
  )
}

export default App
