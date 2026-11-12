import { Html, Head, Main, NextScript } from 'next/document';

const FUENTES =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Patrick+Hand',
    'family=Cabin+Sketch:wght@400;700',
    'family=Arimo:wght@700',
    // tipografías del Minijuego 1
    'family=Tinos:wght@700',
    'family=Gelasio:wght@700',
    'family=EB+Garamond:wght@700',
    'family=Courier+Prime:wght@700',
    'family=Anton',
    'family=Didact+Gothic',
    'family=Great+Vibes',
    'family=Libre+Baskerville:wght@700',
  ].join('&') +
  '&display=block';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta name="description" content="FONIX: cribado pedagógico de habilidades lectoras a través de minijuegos." />
        <meta name="theme-color" content="#2f5d46" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FUENTES} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
