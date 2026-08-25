# Publicar Vozalta en GitHub Pages

## Si ya lo intentaste y falló, revisa en este orden

1. **¿El repositorio es privado?** GitHub Pages gratuito **solo funciona con repos
   públicos**. *Settings → General → Danger Zone → Change repository visibility → Public.*
2. **¿Se ejecutó el workflow?** Entra en la pestaña **Actions** del repositorio.
   - Si **no aparece ninguna ejecución**, tu push no disparó nada: o la rama no se
     llama `main`/`master`, o el archivo `.github/workflows/deploy.yml` no está en
     el repo, o el repo era privado en el momento del push (repítelo tras hacerlo público).
   - Si aparece una ejecución **en rojo**, haz clic en ella y en el paso fallido:
     el mensaje exacto está ahí.
3. **¿Pages apunta a GitHub Actions?** *Settings → Pages → Build and deployment →
   Source:* debe decir **GitHub Actions** (no «Deploy from a branch»).
4. **Espera el check verde** (1–2 min) y abre la URL que muestra el workflow o la de
   *Settings → Pages*.

## Vía automática (GitHub Actions, recomendada)

```bash
git init
git add -A
git commit -m "Vozalta"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

Activa *Settings → Pages → Source: GitHub Actions*. A partir de ahí, **cada push a
`main` recompila y publica solo**, siempre con rutas relativas.

## Vía manual (sin Actions)

```bash
sh deploy.sh
```

Compila con `--base=./` y sube `dist/` a la rama `gh-pages`. Después:
*Settings → Pages → Source: Deploy from a branch → `gh-pages` / (root).*

## La regla de oro

Nunca compiles con `npm run build` a secas para GitHub Pages: los assets salen con
rutas absolutas (`/assets/…`) y la página queda **en blanco** bajo
`usuario.github.io/repo/` (verás errores 404 en la consola). Usa siempre el workflow
o `deploy.sh`, que compilan con `--base=./`.

## Errores frecuentes y su lectura

| Mensaje / síntoma | Causa | Solución |
|---|---|---|
| `Pages site not found` | Pages sin activar o repo privado | Puntos 1 y 3 |
| `npm ci … lock file out of date` | `package-lock.json` desactualizado | `npm install` en local y commitear el lock |
| Pantalla en blanco, 404 de `/assets/…` | Build sin `--base=./` | Workflow o `sh deploy.sh` |
| Actions vacío tras el push | Rama equivocada o workflow no subido | `git branch` debe mostrar `main`; confirma que `.github/` está en el repo |
