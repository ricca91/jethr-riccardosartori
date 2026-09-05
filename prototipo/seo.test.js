const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const publicDir = __dirname;
const canonicalOrigin = 'https://www.dovevalatuaral.com';
const publicPages = [
  ['index.html', `${canonicalOrigin}/`],
  ['come-ho-lavorato.html', `${canonicalOrigin}/come-ho-lavorato.html`],
  ['la-storia.html', `${canonicalOrigin}/la-storia.html`],
];

function readPublic(name) {
  return readFileSync(resolve(publicDir, name), 'utf8');
}

function oneMatch(html, expression, label) {
  const matches = [...html.matchAll(expression)];
  assert.equal(matches.length, 1, `${label} deve comparire una volta`);
  return matches[0][1].trim();
}

test('ogni pagina pubblica ha title, description e self-canonical univoci', () => {
  for (const [file, expectedCanonical] of publicPages) {
    const html = readPublic(file);
    const head = oneMatch(html, /<head>([\s\S]*?)<\/head>/gi, `${file}: head`);
    assert.ok(oneMatch(head, /<title>([^<]+)<\/title>/gi, `${file}: title`));
    assert.ok(oneMatch(head, /<meta\s+name="description"\s+content="([^"]+)"\s*\/?>/gi, `${file}: description`));
    assert.equal(
      oneMatch(head, /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/gi, `${file}: canonical`),
      expectedCanonical,
    );
    assert.doesNotMatch(html, /<meta\s+name="robots"\s+content="[^"]*noindex/i);
  }
});

test('la home descrive esplicitamente il calcolo stipendio netto', () => {
  const html = readPublic('index.html');
  const head = oneMatch(html, /<head>([\s\S]*?)<\/head>/gi, 'head home');
  assert.match(oneMatch(head, /<title>([^<]+)<\/title>/gi, 'title home'), /calcolo stipendio netto/i);
  assert.match(
    oneMatch(head, /<meta\s+name="description"\s+content="([^"]+)"\s*\/?>/gi, 'description home'),
    /RAL.*netto|netto.*RAL/i,
  );
});

test('robots permette la scansione e dichiara la sitemap canonica', () => {
  const robots = readPublic('robots.txt');
  assert.match(robots, /^User-agent:\s*\*$/m);
  assert.match(robots, /^Allow:\s*\/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${canonicalOrigin.replaceAll('.', '\\.')}/sitemap\\.xml$`, 'm'));
});

test('sitemap contiene esattamente le pagine pubbliche self-canonical', () => {
  const sitemap = readPublic('sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations, publicPages.map(([, canonical]) => canonical));
  for (const location of locations) {
    assert.doesNotMatch(location, /prototype-|jethr\.riccsartori\.com|\?/);
  }
});

test('i prototipi restano esclusi dall’indicizzazione', () => {
  for (const file of ['prototype-famiglia-pacchetto.html', 'prototype-ral-feedback.html']) {
    assert.match(readPublic(file), /<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/?>/i);
  }
});

test('Vercel reindirizza permanentemente il dominio legacy preservando la path', () => {
  const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
  assert.equal(config.outputDirectory, 'prototipo');
  assert.deepEqual(config.redirects, [{
    source: '/:path*',
    has: [{ type: 'host', value: 'jethr.riccsartori.com' }],
    destination: 'https://www.dovevalatuaral.com/:path*',
    permanent: true,
  }]);
});
