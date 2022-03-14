import cache from "../cache/reader";

const getThreadId: string = cache.getThreadId();

const runPath: string = cache.get(`${getThreadId}runPath`);

window.require(runPath);
