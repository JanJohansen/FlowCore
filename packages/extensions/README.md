# package/extensions

## Folder structure

```
packages
    extensions
        MyUserExtension         // (User provided) extension library
            frontend
                src
                    nodes
                        nodeX
                            backend.ts
                index.ts        // Exports _paths_ to VUE components, pages, ++
                package.json
                ...
            backend             // NodeJS project with core nodes.
                index.ts        // Exports paths to backend classes for nodes, ++?
                package.json
                src
                    nodes
                        nodeX
                            definition.ts
                            visual.vue

                ...
```

How to start new extansion development:

```
cd packages
cd extensions
mkdir myExtension
cd myExtension
npm init vite@latest frontend
cd frontend
npm install

cd ..
mkdir backend
cd backend

npm init   // Create nodejs ts project
```

## NODES

Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3
`<script setup>` SFCs, check out the
[script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the
[Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
