'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'

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

export default function V4() {
    const [consoleOutput, setConsoleOutput] = useState<string>("");
    const consoleRef = useRef<HTMLTextAreaElement>(null);

    // Effect to initialize the FileSystem and the Console Hook
    useEffect(() => {
        // 1. Hook into window.TS_InitFS (FileSystem Init)
        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
                console.error("FS Init Error:", error);
            }
        };

        // 2. Hook into the Engine's print function
        // The engine wrapper (RSDKv4.js) looks for an element with id="output" to write to.
        // But since we are in React, we can intercept it directly or let the wrapper update the DOM.
        // Below is a way to intercept console.log if the wrapper uses it, OR 
        // simply let the wrapper write to the textarea via ID.
        
        // Since your wrapper uses: var element = document.getElementById('output');
        // We just need to ensure the textarea has id="output".
        
    }, []);

    // Auto-scroll to bottom when console updates
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleOutput]);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            <div className='enginePage' style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    <Splash/>
                    
                    {/* Game Canvas */}
                    <canvas className='engineCanvas' id='canvas' style={{ flex: 1 }} />

                    {/* Console Output Section */}
                    <div className="console-container" style={{ 
                        height: '150px', 
                        backgroundColor: '#1e1e1e', 
                        color: '#00ff00',
                        fontFamily: 'monospace',
                        padding: '10px',
                        borderTop: '2px solid #333'
                    }}>
                        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Console Output:</div>
                        <textarea 
                            id="output" 
                            ref={consoleRef}
                            readOnly
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'transparent',
                                color: 'inherit',
                                border: 'none',
                                resize: 'none',
                                outline: 'none',
                                fontSize: '12px'
                            }}
                            defaultValue="Initializing RSDKv4..."
                        />
                    </div>

                </ThemeProvider>

                {/* Scripts */}
                <Script src='coi-serviceworker.js' strategy="beforeInteractive" />
                <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
            </div>
        </>
    )
}
