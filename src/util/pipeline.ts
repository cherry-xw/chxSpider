export class Pipeline<T, U> {
  private data: any;
  private handleList: ((...param: any) => any)[] = [];
  constructor(data: T) {
    this.data = data;
  }
  next<M>(handleFn: (param: T) => M): Pipeline<Awaited<M>, Awaited<M>> {
    this.handleList.push(handleFn);
    return this as any;
  }
  async done<N = U>(lastCallback: (data: U) => N = (d) => d as any): Promise<N> {
    let currnetData = this.data;
    for (let fni = 0; fni < this.handleList.length; fni++) {
      const fn = this.handleList[fni];
      currnetData = await fn(currnetData);
    }
    return lastCallback(currnetData);
  }
}

type LoopNext<X, Z> = {
  next: <Y>(handleFn: (param: X) => Y) => LoopNext<Awaited<Y>, Awaited<Y>>;
  done: <T = Z>(lastCallback?: (data: Z) => T) => Promise<T>;
};
export function pipeline<T>(data: T) {
  const handleList: ((...param: any) => any)[] = [];
  const obj: LoopNext<T, any> = {
    next(handleFn) {
      handleList.push(handleFn);
      return obj as any;
    },
    async done(lastCallback = d => d) {
      let currnetData = data;
      for (let fni = 0; fni < handleList.length; fni++) {
        const fn = handleList[fni];
        currnetData = await fn(currnetData);
      }
      return lastCallback(currnetData);
    }
  };
  return obj;
}
