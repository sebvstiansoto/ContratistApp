import type { Categoria } from '../types'

export const CC: Record<string, { bg: string; c: string }> = {
  'Fijaciones':             { bg: '#eef1fd', c: '#3b5bdb' },
  'Empaquetaduras':         { bg: '#ebfbee', c: '#2f9e44' },
  'Tuberias y Pasamuros':   { bg: '#fff4e6', c: '#e67700' },
  'Fittings y Flanges':     { bg: '#fff9db', c: '#d97700' },
  'Perfiles y Estructuras': { bg: '#f3f0ff', c: '#6741d9' },
  'Planchas':               { bg: '#f0f4ff', c: '#4c6ef5' },
  'Aislacion':              { bg: '#e6fcf5', c: '#0ca678' },
  'Adhesivos':              { bg: '#fff5f5', c: '#e03131' },
  'Instrumentacion':        { bg: '#e7f5ff', c: '#1c7ed6' },
  'Soldadura':              { bg: '#fff4e6', c: '#f76707' },
  'Consumibles y EPP':      { bg: '#fff0f6', c: '#c2255c' },
  'Limpieza':               { bg: '#e6fcf5', c: '#099268' },
  'Herramientas':           { bg: '#fff9db', c: '#f59f00' },
  'Lubricantes':            { bg: '#fff4e6', c: '#e8590c' },
  'Escritorio':             { bg: '#f8f9fa', c: '#495057' },
  'Izaje':                  { bg: '#e7f5ff', c: '#1971c2' },
  'Otro':                   { bg: '#f8f9fa', c: '#868e96' },
}

export function getCatColor(cat: string) {
  return CC[cat] ?? CC['Otro']
}

export const CATEGORIAS: Categoria[] = [
  'Fijaciones', 'Empaquetaduras', 'Tuberias y Pasamuros', 'Fittings y Flanges',
  'Perfiles y Estructuras', 'Planchas', 'Aislacion', 'Adhesivos',
  'Instrumentacion', 'Soldadura', 'Consumibles y EPP', 'Limpieza',
  'Herramientas', 'Lubricantes', 'Escritorio', 'Izaje', 'Otro',
]
