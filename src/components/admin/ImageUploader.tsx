'use client'
import { useState, useRef } from 'react'
import { X, Loader2, Info, Images, AlertCircle, GripVertical } from 'lucide-react'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
  context?: 'producto' | 'categoria' | 'slider'
}

const SPECS = {
  producto: {
    label: 'Imágenes del producto',
    recomendado: '800 × 800 px',
    aspect: 'Cuadrada (1:1)',
    peso: '< 20 MB por imagen',
    extra: 'La primera imagen es la principal. Arrastrá los thumbnails para cambiar el orden.',
  },
  categoria: {
    label: 'Imagen de categoría',
    recomendado: '400 × 400 px',
    aspect: 'Cuadrada (1:1)',
    peso: '< 20 MB',
    extra: 'Se muestra como ícono en la grilla de categorías.',
  },
  slider: {
    label: 'Imagen del slide',
    recomendado: '1920 × 700 px',
    aspect: 'Horizontal (16:4 aprox.)',
    peso: '< 20 MB',
    extra: 'Imagen de portada a ancho completo. Usá texto grande y buen contraste.',
  },
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_MB = 20
const MAX_BYTES = MAX_MB * 1024 * 1024

export default function ImageUploader({ images, onChange, context = 'producto' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [errors, setErrors] = useState<string[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const spec = SPECS[context]

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    const next = [...images]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onChange(next)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Validación client-side
    const valid: File[] = []
    const newErrors: string[] = []

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}": tipo no permitido (${file.type || 'desconocido'}). Usá JPG, PNG o WEBP.`)
        continue
      }
      if (file.size > MAX_BYTES) {
        newErrors.push(`"${file.name}": supera el límite de ${MAX_MB} MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`)
        continue
      }
      valid.push(file)
    }

    setErrors(newErrors)
    if (valid.length === 0) return

    setUploading(true)
    setProgress({ done: 0, total: valid.length })
    const uploaded: string[] = []
    const uploadErrors = [...newErrors]

    for (const file of valid) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch(`/muebleuno/api/upload?ctx=${context}`, { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) {
          uploaded.push(data.url)
        } else {
          uploadErrors.push(`"${file.name}": ${data.error ?? 'Error desconocido'}`)
        }
      } catch {
        uploadErrors.push(`"${file.name}": error de red al subir.`)
      }
      setProgress(p => ({ ...p, done: p.done + 1 }))
    }

    setErrors(uploadErrors)
    onChange([...images, ...uploaded])
    setUploading(false)
    setProgress({ done: 0, total: 0 })
  }

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{spec.label}</label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {context === 'producto' && images.length > 1 && (
            <p className="w-full text-[11px] text-gris-claro flex items-center gap-1 -mt-1 mb-0.5">
              <GripVertical className="w-3 h-3" /> Arrastrá las fotos para cambiar el orden
            </p>
          )}
          {images.map((img, i) => (
            <div
              key={img + i}
              draggable={context === 'producto'}
              onDragStart={() => { setDragIdx(i); setDragOverIdx(i) }}
              onDragEnter={() => setDragOverIdx(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                if (dragIdx !== null) handleReorder(dragIdx, i)
                setDragIdx(null); setDragOverIdx(null)
              }}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
              className={[
                'relative w-20 h-20 rounded-lg overflow-hidden border bg-gris-fondo transition-all',
                context === 'producto' ? 'cursor-grab active:cursor-grabbing' : '',
                dragIdx === i ? 'opacity-40 scale-95 ring-2 ring-rojo-principal' : '',
                dragOverIdx === i && dragIdx !== null && dragIdx !== i
                  ? 'ring-2 ring-rojo-principal ring-offset-1 scale-105'
                  : '',
              ].join(' ')}
            >
              <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
              {i === 0 && context === 'producto' && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                  Principal
                </span>
              )}
              <button type="button" onClick={() => remove(i)}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-6 px-4 cursor-pointer hover:border-rojo-principal hover:bg-rojo-suave/30 transition-colors"
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-rojo-principal animate-spin" />
            <p className="text-sm font-medium text-rojo-principal">
              Subiendo {progress.done} de {progress.total}...
            </p>
          </>
        ) : (
          <>
            <Images className="w-8 h-8 text-gris-claro" />
            <p className="text-sm font-semibold text-gris-medio">
              Hacé clic o arrastrá las fotos aquí
            </p>
            <p className="text-xs text-gris-claro">
              Podés seleccionar <strong>varias fotos a la vez</strong>
            </p>
          </>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => handleUpload(e.target.files)} />

      {/* Errores de validación / upload */}
      {errors.length > 0 && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
          <div className="flex items-center gap-1.5 text-red-700 font-medium text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.length === 1 ? 'Error al subir imagen' : `${errors.length} errores al subir imágenes`}
          </div>
          <ul className="text-xs text-red-700 space-y-0.5 pl-1">
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
          <button type="button" onClick={() => setErrors([])} className="text-xs text-red-500 underline mt-1">
            Cerrar
          </button>
        </div>
      )}

      {/* Specs */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 space-y-1 mt-3">
        <div className="flex items-center gap-1.5 text-blue-700 font-medium text-xs mb-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Recomendaciones
        </div>
        <ul className="text-xs text-blue-800 space-y-0.5 pl-1">
          <li>📐 Tamaño recomendado: <strong>{spec.recomendado}</strong></li>
          <li>⬜ Proporción: <strong>{spec.aspect}</strong></li>
          <li>⚖️ Peso máximo: <strong>{spec.peso}</strong> (imágenes más grandes se comprimen automáticamente)</li>
          <li>🗂️ Formatos: <strong>JPG, PNG o WEBP</strong></li>
          <li>💡 {spec.extra}</li>
        </ul>
      </div>
    </div>
  )
}
