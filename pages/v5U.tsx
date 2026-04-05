'use client'

import * as React from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'

import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'

import EngineFS from '@/lib/EngineFS'
import FaviconLoader from '@/lib/FaviconLoader'

export default function V5U() {
    const [consoleVisible, setConsoleVisible] = React.useState(false);
    const [consoleLines, setConsoleLines] = React.useState<string[]>([]);
    const [engineReady, setEngineReady] = React.useState(false);
    const [pageTitle, setPageTitle] = React.useState('RSDKv5U');
    const consoleEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // ===== EXPOSE EngineFS GLOBALLY FIRST =====
        (window as any).EngineFS = EngineFS;
        console.log('[v5U] EngineFS exposed globally');

        // ===== INITIALIZE FAVICON LOADER =====
        FaviconLoader.init();
        console.log('[v5U] FaviconLoader initialized');

        // ===== WATCH FOR TITLE CHANGES =====
        const titleObserver = new MutationObserver(() => {
            const newTitle = document.title;
            if (newTitle && newTitle !== pageTitle) {
                setPageTitle(newTitle);
                console.log('[v5U] Title changed to:', newTitle);
            }
        });

        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleObserver.observe(titleElement, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }

        // Also set initial title
        if (document.title && document.title !== pageTitle) {
            setPageTitle(document.title);
        }

        // Wait for service worker to be ready before loading engine
        const checkServiceWorker = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.ready;
                    console.log('Service worker ready, enabling engine load');
                    setEngineReady(true);
                } catch (e) {
                    console.error('Service worker failed:', e);
                    setEngineReady(true);
                }
            } else {
                setEngineReady(true);
            }
        };
        checkServiceWorker();

        // Flush buffered console messages
        const buffered: string[] = (window as any).__engineConsoleBuffer ?? [];
        if (buffered.length > 0) {
            setConsoleLines(buffered.slice(-500));
        }

        window.__engineConsoleAppend = (text: string) => {
            setConsoleLines(prev => {
                const next = [...prev, text];
                if (next.length > 500) next.splice(0, next.length - 500);
                return next;
            });
        };

        // Cleanup on unmount
        return () => {
            FaviconLoader.destroy();
            titleObserver.disconnect();
        };
    }, []);

    React.useEffect(() => {
        if (consoleEndRef.current && consoleVisible) {
            consoleEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [consoleLines, consoleVisible]);

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

    const getLineClass = (line: string): string => {
        if (line.includes('[ERROR]') || line.includes('ERROR') || line.includes('Exception') || line.includes('[FATAL]'))
            return 'engine-console-line--error';
        if (line.includes('WARNING') || line.includes('WARN') || line.includes('[WARNING]'))
            return 'engine-console-line--warning';
        if (line.includes('[INFO]'))
            return 'engine-console-line--info';
        if (line.includes('[DEBUG]'))
            return 'engine-console-line--debug';
        if (line.includes('MSZSetup:'))
            return 'engine-console-line--info';
        if (line.includes('->'))
            return 'engine-console-line--success';
        if (line.includes('TRANSITIONING'))
            return 'engine-console-line--highlight';
        if (line.includes('[STATUS]'))
            return 'engine-console-line--status';
        return '';
    };

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>

            {/* Load service worker FIRST and wait for it */}
            <Script 
                src='coi-serviceworker.js' 
                strategy='beforeInteractive'
            />

            {/* Pre-buffer setup */}
            <Script id='engine-console-prebuffer' strategy='beforeInteractive'>{`
                window.__engineConsoleBuffer = [];
                window.__engineConsoleAppend = function(text) {
                    window.__engineConsoleBuffer.push(text);
                    if (window.__engineConsoleBuffer.length > 500)
                        window.__engineConsoleBuffer.splice(0, window.__engineConsoleBuffer.length - 500);
                };
            `}</Script>

            {/* EngineFS initialization function */}
            <Script id='engine-fs-init' strategy='beforeInteractive'>{`
                window.TS_InitFS = async function(p, f) {
                    try {
                        console.log('[TS_InitFS] Starting initialization for:', p);
                        
                        if (typeof window.EngineFS === 'undefined') {
                            throw new Error('EngineFS not loaded yet');
                        }
                        
                        await window.EngineFS.Init(p);
                        console.log('[TS_InitFS] EngineFS.Init completed');
                        
                        // Give the filesystem a moment to settle
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        console.log('[TS_InitFS] Calling callback');
                        f();
                    } catch (error) {
                        console.error('[TS_InitFS] EngineFS init failed:', error);
                        window.__engineConsoleAppend?.('[ERROR] FS init failed: ' + error.message);
                    }
                };
            `}</Script>

            <div className='enginePage'>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    <Splash />
                    <canvas className='engineCanvas' id='canvas' />

                    {consoleVisible && (
                        <div className='engine-console'>
                            <div className='engine-console-resize' />
                            <div className='engine-console-header'>
                                <span className='engine-console-title'>Engine Console</span>
                                <div className='engine-console-buttons'>
                                    <button
                                        className='engine-console-btn'
                                        onClick={() => setConsoleLines([])}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        className='engine-console-btn'
                                        onClick={() => setConsoleVisible(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            <div className='engine-console-output'>
                                {consoleLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className={`engine-console-line ${getLineClass(line)}`}
                                    >
                                        <span className='engine-console-line-number'>
                                            {String(i).padStart(4, '0')}
                                        </span>
                                        {line}
                                    </div>
                                ))}
                                <div ref={consoleEndRef} />
                            </div>
                        </div>
                    )}
                </ThemeProvider>
                
                {/* Only load engine scripts after service worker is ready */}
                {engineReady && (
                    <>
                        <Script src='./lib/RSDKv5U.js' strategy='afterInteractive' />
                        <Script src='./modules/RSDKv5U.js' strategy='lazyOnload' />
                    </>
                )}
            </div>
        </>
    )
}
