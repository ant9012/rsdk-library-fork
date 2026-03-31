'use client'

import * as React from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

// --------------------
// UI Component Imports
// --------------------

import Head from 'next/head'
import Script from 'next/script'

import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'

// ---------------
// Library Imports
// ---------------

import EngineFS from '@/lib/EngineFS'

// ---------------------
// Component Definitions
// ---------------------

export default function V3() {
    React.useEffect(() => {
        // ---- Engine FS init ----
        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
            }
        };

        // ---- Load favicon from icons/CD.ico ----
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.type = 'image/x-icon';
        link.href = './icons/CD.ico';
    }, []);

    return (
        <>
            <Head>
                {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                <script src="./coi-serviceworker.js" />
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
                <link rel='icon' type='image/x-icon' href='./icons/CD.ico' />
            </Head>
            <div className='enginePage'>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    <Splash/>
                    <canvas className='engineCanvas' id='canvas' />
                </ThemeProvider>
                <Script src='./lib/RSDKv3.js' />
                <Script src='./modules/RSDKv3.js' />
            </div>
        </>
    )
}
