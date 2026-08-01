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

// src/backend/actions/AdminLogin.ts
var AdminLogin_exports = {};
__export(AdminLogin_exports, {
  adminLogin: () => adminLogin
});
module.exports = __toCommonJS(AdminLogin_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var adminLogin = (0, import_action_utils.withResult)(
  async (input) => {
    const { sysuser_account, sysuser_password } = input;
    const user = await import_prisma.default.sysuser.findUnique({
      where: {
        account: sysuser_account
      }
    });
    if (!user) {
      throw new Error("\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF");
    }
    const hashedPassword = (0, import_action_utils.hashPassword)(sysuser_password);
    if (hashedPassword !== user.password) {
      throw new Error("\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF");
    }
    if (user.role !== "ADMIN") {
      throw new Error("\u6B64\u8D26\u53F7\u65E0\u540E\u53F0\u8BBF\u95EE\u6743\u9650");
    }
    if (user.status === "DISABLED") {
      throw new Error("\u8D26\u53F7\u5DF2\u88AB\u7981\u7528");
    }
    await import_prisma.default.sysuser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: /* @__PURE__ */ new Date()
      }
    });
    const token = await (0, import_action_utils.signToken)(user.id, user.role);
    return {
      token,
      sysuser_id: user.id,
      sysuser_account: user.account,
      sysuser_username: user.username,
      sysuser_role: user.role,
      sysuser_status: user.status
    };
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminLogin
});
