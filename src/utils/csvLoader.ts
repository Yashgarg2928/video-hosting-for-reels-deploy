import Papa from 'papaparse';

export interface Reel {
    id: number;
    url: string;
    username: string;
    description: string;
}

export async function fetchReelsData(): Promise<Reel[]> {
    return new Promise((resolve, reject) => {
        Papa.parse('/reels.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically converts numbers
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error('CSV Parse Errors:', results.errors);
                    reject(results.errors);
                } else {
                    // Validate and clean data if necessary
                    const data = results.data as Reel[];
                    // Ensure IDs are valid numbers and urls exist
                    const validReels = data.filter(r => r.id && r.url);
                    resolve(validReels);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}
