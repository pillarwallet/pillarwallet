// @flow

declare function describe(name: string, cb: () => void): void;
declare function it(name: string, cb: () => mixed): void;
declare function test(name: string, cb: () => mixed): void;
declare function beforeEach(cb: () => mixed): void;
declare function afterEach(cb: () => mixed): void;
declare function beforeAll(cb: () => mixed): void;
declare function afterAll(cb: () => mixed): void;
declare var expect: any;
declare var jest: any;
