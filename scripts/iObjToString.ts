

export function iObjToString(srcObj: any, indent = 2): string {
    return Object.keys(srcObj).reduce((previous, key) => {
        if (!key.match(/^-*\d+$/)) {
            let objStr: string;
            if (srcObj[key].type === "Object") {
                objStr = iObjToString(srcObj[key], indent + 2);
            } else {
                objStr = srcObj[key].toString();
            }
            return previous + `\n${' '.repeat(indent)}${key}: ${objStr},`;
        } else {
            return previous;
        }
    }, '{') + '\n}\n';
}
