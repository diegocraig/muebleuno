'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { trackPixel } from '@/lib/pixel'

// Snippet base del Meta Pixel. El pixelId viene del server (ver MetaPixel.tsx)
// y ya fue validado como numérico, así que es seguro interpolarlo en el script.
export default function MetaPixelScript({ pixelId }: { pixelId: string }) {
  const pathname = usePathname()
  const primeraCarga = useRef(true)

  useEffect(() => {
    // El snippet base ya dispara el PageView inicial; acá cubrimos las
    // navegaciones client-side del App Router, que no recargan la página.
    if (primeraCarga.current) {
      primeraCarga.current = false
      return
    }
    trackPixel('PageView')
  }, [pathname])

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
