export const TITRE = 'Refuge';
export const BASELINE = 'Le jumeau 3D du Forum des Halles : décider vite, évacuer juste.';

export function rendreAccueil(racine: HTMLElement): void {
  racine.innerHTML = `
    <main style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem">
      <h1>${TITRE}</h1>
      <p>${BASELINE}</p>
      <p><a href="/sante">État du service</a></p>
    </main>`;
}
