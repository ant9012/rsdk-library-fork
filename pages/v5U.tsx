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

export default function V5U() {
    const [consoleVisible, setConsoleVisible] = React.useState(false);
    const [consoleLines, setConsoleLines] = React.useState<string[]>([]);
    const consoleEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Expose the console line appender globally so Module.print can use it
        window.__engineConsoleAppend = (text: string) => {
            setConsoleLines(prev => {
                const next = [...prev, text];
                // Keep a rolling buffer of 500 lines to avoid memory bloat
                if (next.length > 500) next.splice(0, next.length - 500);
                return next;
            });
        };

        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
            }
        };
    }, []);

    // Auto-scroll to bottom when new lines arrive
    React.useEffect(() => {
        if (consoleEndRef.current && consoleVisible) {
            consoleEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [consoleLines, consoleVisible]);

    // Toggle with backtick key
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                setConsoleVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            <div className='enginePage'>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    <Splash />
                    <canvas className='engineCanvas' id='canvas' />

                    {/* In-page console overlay */}
                    {consoleVisible && (
                        <div
                            style={{
                                position: 'fixed',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '40%',
                                backgroundColor: 'rgba(0, 0, 0, 0.90)',
                                borderTop: '2px solid #333',
                                zIndex: 9999,
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Header bar */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '4px 10px',
                                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                                    borderBottom: '1px solid #444',
                                    flexShrink: 0,
                                }}
                            >
                                <span style={{
                                    color: '#0f0',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                }}>
                                    ENGINE CONSOLE
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setConsoleLines([])}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #555',
                                            color: '#aaa',
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            cursor: 'pointer',
                                            borderRadius: '3px',
                                        }}
                                    >
                                        CLEAR
                                    </button>
                                    <button
                                        onClick={() => setConsoleVisible(false)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #555',
                                            color: '#aaa',
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            cursor: 'pointer',
                                            borderRadius: '3px',
                                        }}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>

                            {/* Log output area */}
                            <div
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '6px 10px',
                                    fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                    color: '#d4d4d4',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {consoleLines.map((line, i) => {
                                    // Color-code lines based on content
                                    let color = '#d4d4d4';
                                    if (line.includes('WARNING') || line.includes('WARN')) color = '#e5c07b';
                                    else if (line.includes('ERROR') || line.includes('Exception')) color = '#e06c75';
                                    else if (line.includes('MSZSetup:')) color = '#61afef';
                                    else if (line.includes('->')) color = '#98c379';
                                    else if (line.includes('TRANSITIONING')) color = '#c678dd';

                                    return (
                                        <div key={i} style={{ color }}>
                                            <span style={{ color: '#555', marginRight: '8px', userSelect: 'none' }}>
                                                {String(i).padStart(4, '0')}
                                            </span>
                                            {line}
                                        </div>
                                    );
                                })}
                                <div ref={consoleEndRef} />
                            </div>
                        </div>
                    )}
                </ThemeProvider>
                <Script src='coi-serviceworker.js' />
                <Script src='./lib/RSDKv5U.js' />
                <Script src='./modules/RSDKv5U.js' />
            </div>
        </>
    )
}
