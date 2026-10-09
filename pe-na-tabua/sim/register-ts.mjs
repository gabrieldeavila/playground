import { registerHooks } from 'node:module'

// O código do jogo importa sem extensão (estilo bundler); no Node, tenta de novo com `.ts`.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context)
    } catch (error) {
      if (specifier.startsWith('.')) return next(`${specifier}.ts`, context)
      throw error
    }
  },
})
