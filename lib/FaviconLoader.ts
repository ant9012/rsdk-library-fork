export class FaviconLoader {
    private static observer: MutationObserver | null = null;
    private static currentFavicon: string = '';

    // Mapping of window titles to favicon paths
    private static faviconMap: Record<string, string> = {
        'Sonic Mania': '/icons/smania.ico',
        'Sonic CD': '/icons/scd.ico',
        'Sonic 1': '/icons/s1.ico',
        'Sonic 2': '/icons/s2.ico',
        'Sonic 3 & Knuckles': '/icons/s3k.ico',
        // Add more mappings as needed
    };

    private static defaultFavicon: string = '/favicon.ico';

    static init() {
        console.log('[FaviconLoader] Initializing...');
        
        // Initial check
        this.updateFavicon();

        // Watch for title changes
        this.observer = new MutationObserver(() => {
            this.updateFavicon();
        });

        // Observe the document title
        const titleElement = document.querySelector('title');
        if (titleElement) {
            this.observer.observe(titleElement, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }

        // Also observe the entire head for title changes
        this.observer.observe(document.head, {
            childList: true,
            subtree: true
        });

        console.log('[FaviconLoader] Watching for title changes...');
    }

    static updateFavicon() {
        const title = document.title;
        let faviconPath = this.defaultFavicon;

        // Check if title matches any of our mappings
        for (const [key, path] of Object.entries(this.faviconMap)) {
            if (title.includes(key)) {
                faviconPath = path;
                break;
            }
        }

        // Only update if favicon changed
        if (faviconPath !== this.currentFavicon) {
            this.setFavicon(faviconPath);
            this.currentFavicon = faviconPath;
            console.log(`[FaviconLoader] Changed favicon to: ${faviconPath} (Title: ${title})`);
        }
    }

    private static setFavicon(path: string) {
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach(link => link.remove());

        // Create new favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = path;
        document.head.appendChild(link);

        // Also add apple-touch-icon for mobile devices
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = path;
        document.head.appendChild(appleTouchIcon);
    }

    static destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        console.log('[FaviconLoader] Destroyed');
    }

    // Allow dynamic addition of favicon mappings
    static addMapping(title: string, faviconPath: string) {
        this.faviconMap[title] = faviconPath;
        console.log(`[FaviconLoader] Added mapping: "${title}" -> ${faviconPath}`);
        this.updateFavicon(); // Recheck immediately
    }

    // Remove a mapping
    static removeMapping(title: string) {
        delete this.faviconMap[title];
        console.log(`[FaviconLoader] Removed mapping: "${title}"`);
        this.updateFavicon();
    }
}

export default FaviconLoader;
