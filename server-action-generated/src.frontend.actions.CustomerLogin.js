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

// common-redirect:@/frontend/action_utils
var require_action_utils = __commonJS({
  "common-redirect:@/frontend/action_utils"(exports2, module2) {
    module2.exports = require("./_common").frontendAuth;
  }
});

// src/frontend/actions/CustomerLogin.ts
var CustomerLogin_exports = {};
__export(CustomerLogin_exports, {
  loginCustomer: () => loginCustomer
});
module.exports = __toCommonJS(CustomerLogin_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var loginUserSelect = {
  id: true,
  account: true,
  password: true,
  email: true,
  role: true,
  status: true,
  username: true,
  preferredLocale: true
};
var loginCustomer = (0, import_action_utils.withResult)(
  async (input) => {
    const accountOrEmail = String(input.sysuser_account || "").trim();
    let user = await import_prisma.default.sysuser.findUnique({
      where: {
        account: accountOrEmail
      },
      select: loginUserSelect
    });
    if (!user && accountOrEmail.includes("@")) {
      user = await import_prisma.default.sysuser.findUnique({
        where: {
          email: accountOrEmail.toLowerCase()
        },
        select: loginUserSelect
      });
    }
    if (!user) {
      throw new Error("\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF");
    }
    const hashedInputPassword = (0, import_action_utils.hashPassword)(input.sysuser_password);
    if (user.password !== hashedInputPassword) {
      throw new Error("\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF");
    }
    if (user.role !== import_action_utils.UserRole.CUSTOMER) {
      throw new Error("\u8BE5\u8D26\u53F7\u975E\u524D\u53F0\u5BA2\u6237\u8D26\u53F7\uFF0C\u7981\u6B62\u767B\u5F55");
    }
    if (user.status === "DISABLED") {
      throw new Error("\u8D26\u6237\u72B6\u6001\u53D7\u9650 (DISABLED)\uFF0C\u8BF7\u8054\u7CFB\u7AD9\u70B9\u7BA1\u7406\u5458");
    }
    try {
      await import_prisma.default.sysuser.update({
        where: { id: user.id },
        data: { lastLoginAt: /* @__PURE__ */ new Date() },
        select: { id: true }
      });
    } catch {
      // Best-effort: do not block a valid login on lastLoginAt / schema lag
    }
    const token = await (0, import_action_utils.signToken)(user.id, user.role);
    return {
      token,
      sysuser_id: user.id,
      sysuser_account: user.account,
      sysuser_name: user.username,
      sysuser_email: user.email,
      preferred_locale: user.preferredLocale || "en",
      sysuser_role: user.role
    };
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loginCustomer
});
