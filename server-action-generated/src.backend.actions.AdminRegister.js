"use server";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// common-redirect:@/tools/prisma
var require_prisma = __commonJS({
  "common-redirect:@/tools/prisma"(exports2, module2) {
    module2.exports = require("./_common").prisma;
  }
});

// common-redirect:@/backend/action_utils
var require_action_utils = __commonJS({
  "common-redirect:@/backend/action_utils"(exports2, module2) {
    module2.exports = require("./_common").backendAuth;
  }
});

// src/backend/actions/AdminRegister.ts
var AdminRegister_exports = {};
__export(AdminRegister_exports, {
  registerAdmin: () => registerAdmin
});
module.exports = __toCommonJS(AdminRegister_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var registerAdmin = (0, import_action_utils.withResult)(
  async (input) => {
    if (input.password !== input.confirmPassword) {
      throw new Error("\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4");
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(input.password)) {
      throw new Error("\u5BC6\u7801\u81F3\u5C118\u4E2A\u5B57\u7B26\uFF0C\u4E14\u5FC5\u987B\u5305\u542B\u5B57\u6BCD\u548C\u6570\u5B57");
    }
    const existAccount = await import_prisma.default.sysuser.findUnique({
      where: { account: input.account },
      select: { id: true }
    });
    if (existAccount) {
      throw new Error("\u8BE5\u8D26\u53F7\u5DF2\u88AB\u6CE8\u518C\uFF0C\u8BF7\u66F4\u6362\u8D26\u53F7\u6216\u76F4\u63A5\u767B\u5F55");
    }
    const existEmail = await import_prisma.default.sysuser.findUnique({
      where: { email: input.email },
      select: { id: true }
    });
    if (existEmail) {
      throw new Error("\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C\uFF0C\u8BF7\u66F4\u6362\u90AE\u7BB1");
    }
    await import_prisma.default.sysuser.create({
      data: {
        account: input.account,
        email: input.email,
        password: (0, import_action_utils.hashPassword)(input.password),
        role: "ADMIN",
        status: "ACTIVE",
        username: input.account
        // 注册时未提供 username，默认使用 account 填充必填项
      }
    });
    return { success: true };
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerAdmin
});
