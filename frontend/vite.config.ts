import { defineConfig, loadEnv } from 'vite'

import path from 'path'

import tailwindcss from '@tailwindcss/vite'

import react from '@vitejs/plugin-react'

import basicSsl from '@vitejs/plugin-basic-ssl'



function figmaAssetResolver() {

  return {

    name: 'figma-asset-resolver',

    resolveId(id: string) {

      if (id.startsWith('figma:asset/')) {

        const filename = id.replace('figma:asset/', '')

        return path.resolve(__dirname, 'src/assets', filename)

      }

    },

  }

}



export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')

  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001'



  return {

    publicDir: path.resolve(__dirname, './public'),

    plugins: [figmaAssetResolver(), react(), tailwindcss(), basicSsl()],

    optimizeDeps: {
      exclude: ["onnxruntime-web"],
    },

    resolve: {

      alias: {

        '@': path.resolve(__dirname, './src'),

      },

    },

    server: {

      host: true,

      port: 5173,

      proxy: {

        '/ai-camera': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/api': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/child-profiles': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/auth': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/users': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/quiz': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/mini-games': {

          target: apiTarget,

          changeOrigin: true,

        },

        '/supertonic-assets': {

          target: 'https://huggingface.co',

          changeOrigin: true,

          rewrite: (path) =>
            path.replace(
              /^\/supertonic-assets/,
              '/Supertone/supertonic-3/resolve/main',
            ),

        },

      },

    },

    assetsInclude: ['**/*.svg', '**/*.csv'],

    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },

  }

})


