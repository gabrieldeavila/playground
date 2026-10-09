import { LEVELS } from '../domain/career/levels'
import { NEW_SAVE, type SaveData, parseSave } from './parse-save'

const KEY = 'pe-na-tabua.save.v1'

// localStorage pode não existir ou recusar (aba anônima, cota): o jogo segue sem salvar.
export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(KEY), LEVELS.length)
  } catch {
    return NEW_SAVE
  }
}

export function storeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // sem onde salvar: o progresso dura só até fechar a aba
  }
}
