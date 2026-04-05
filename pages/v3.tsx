'use client'

import * as React from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

// --------------------
// UI Component Imports
// --------------------

import Script from 'next/script'

import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'

// ---------------
// Library Imports
// ---------------

import EngineFS from '@/lib/EngineFS'

// ----------------
// Favicon Loader
// ----------------

function loadFavicon(href: string) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = 'image/x-icon';
    link.href = href;
}

// ---------------------
// Component Definitions
// ---------------------

export default function V3() {
    const [moduleReady, setModuleReady] = React.useState(false);

    React.useEffect(() => {
        // ---- Favicon ----
        loadFavicon('./icons/scd.ico');

        // ---- Engine FS init ----
        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
                console.error('EngineFS init failed:', error);
            }
        };
    }, []);

    return (
        <div className='enginePage'>
            <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                <Splash />
                <canvas
                    className='engineCanvas'
                    id='canvas'
                    onContextMenu={(e) => e.preventDefault()}
                />
            </ThemeProvider>
            <Script src='./coi-serviceworker.js' strategy='beforeInteractive' />
            <Script
                src='./lib/RSDKv3.js'
                strategy='afterInteractive'
                onLoad={() => setModuleReady(true)}
            />
            {moduleReady && (
                <Script
                    src='./modules/RSDKv3.js'
                    strategy='afterInteractive'
                />
            )}
        </div>
    )
}
