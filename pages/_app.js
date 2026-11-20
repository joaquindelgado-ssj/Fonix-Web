import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>FONIX</title>
        {/* viewport-fit=cover: usa toda la pantalla (notch). interactive-widget=resizes-content: en Android, al abrir el teclado la página se achica en vez de taparse. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />
        {/* Si se agrega a la pantalla de inicio, se abre a pantalla completa (en iPhone no existe el botón de pantalla completa) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FONIX" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
