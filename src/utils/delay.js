export function delay(ms: number): Promise{
    return new Promise((res, rej) => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            res();
        }, ms);
    })
}