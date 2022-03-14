import { CONFIG } from '../const';
import cache from '../cache/reader';
const config: any = cache.get(CONFIG);
const windowName: string = cache.getThreadId();
export default Object.assign({ windowName: windowName }, config);
